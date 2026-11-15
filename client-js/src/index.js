/**
 * Punto de entrada principal (Orquestador de la SPA Vanilla JS).
 * Inicializa sesión, conecta servicios RPC de ZeroC Ice, monta componentes y
 * coordina el flujo unidireccional de datos.
 */
import './styles/main.css';
import './styles/seatmap.css';
import './styles/panel.css';
import './styles/modal.css';
import './styles/toast.css';

import { getClientId } from './utils/session.js';
import { store } from './state/store.js';
import * as bookingApi from './services/bookingApi.js';
import { toast } from './components/Toast.js';
import { createEventHeader } from './components/EventHeader.js';
import { createSeatMap } from './components/SeatMap.js';
import { createSelectionPanel } from './components/SelectionPanel.js';
import { createCheckoutModal } from './components/CheckoutModal.js';
import { createMyBookings } from './components/MyBookings.js';

// 1. Inicialización de sesión
const clientId = getClientId();
store.setState({ clientId });
console.log(`[Icesi Live Arena] Cliente inicializado con ID: ${clientId}`);

// 2. Elemento raíz de la aplicación
const app = document.getElementById('app');
if (!app) {
  throw new Error('No se encontró el contenedor #app en el DOM.');
}
app.innerHTML = ''; // Limpiar cualquier contenido inicial

// 3. Funciones de carga y sincronización con el servidor backend
async function syncData(isSilent = false) {
  try {
    const [eventInfo, allSeats, myLocked, myBookings] = await Promise.all([
      bookingApi.getEventInfo(),
      bookingApi.getAllSeats(),
      bookingApi.getMyLockedSeats(clientId),
      bookingApi.getMyBookings(clientId),
    ]);

    store.setState({
      eventInfo,
      seats: allSeats,
      myLockedSeats: myLocked,
      myBookings,
      isConnected: true,
      isLoading: false,
      connectionError: null,
    });

    if (!isSilent) {
      toast.show('Datos actualizados en tiempo real desde el servidor.', 'info', 2000);
    }
  } catch (err) {
    console.error('[Error de sincronización con ZeroC Ice]:', err);
    store.setState({
      isConnected: false,
      isLoading: false,
      connectionError: err.message || 'Error al conectar con el servidor Ice.',
    });
    if (!isSilent) {
      toast.show('No se pudo conectar con el servidor en ws://127.0.0.1:10002. Revisa que el backend Java esté corriendo (gradlew.bat runServer).', 'error', 6000);
    }
  }
}

// 4. Manejadores de eventos de negocio
async function handleSeatToggle(seat, isMyLock, isOtherLock, isBooked) {
  if (isBooked) {
    toast.show(`La silla ${seat.id} ya fue vendida definitivamente.`, 'warning');
    return;
  }

  if (isOtherLock) {
    toast.show(`La silla ${seat.id} se encuentra bloqueada por otro comprador.`, 'warning');
    return;
  }

  if (isMyLock) {
    // Si ya la tengo bloqueada, hacer clic la libera
    try {
      const ok = await bookingApi.releaseSeat(seat.id, clientId);
      if (ok) {
        toast.show(`Silla ${seat.id} liberada.`, 'info');
        await syncData(true);
      }
    } catch (err) {
      toast.show(`Error al liberar silla: ${err.message || err}`, 'error');
    }
    return;
  }

  // Silla AVAILABLE -> Solicitar bloqueo
  try {
    const result = await bookingApi.lockSeat(seat.id, clientId);
    if (result && result.success) {
      toast.show(`¡Silla ${seat.id} bloqueada por 90 segundos!`, 'success');
      store.setState({ lockRemainingSeconds: result.remainingSeconds || 90 });
      await syncData(true);
    } else {
      toast.show(`No fue posible bloquear la silla ${seat.id}: ${result.message}`, 'error');
      await syncData(true);
    }
  } catch (err) {
    const msg = err.reason || err.message || 'La silla ya no se encuentra disponible.';
    toast.show(`No se pudo bloquear la silla ${seat.id}: ${msg}`, 'error');
    await syncData(true);
  }
}

async function handleReleaseSeat(seatId) {
  try {
    const ok = await bookingApi.releaseSeat(seatId, clientId);
    if (ok) {
      toast.show(`Silla ${seatId} liberada.`, 'info');
      await syncData(true);
    }
  } catch (err) {
    toast.show(`Error al liberar: ${err.message || err}`, 'error');
  }
}

async function handleReleaseAll() {
  const locked = store.getState().myLockedSeats || [];
  if (locked.length === 0) return;

  try {
    for (const s of locked) {
      await bookingApi.releaseSeat(s.id, clientId);
    }
    toast.show('Todas las sillas de tu carrito han sido liberadas.', 'info');
    await syncData(true);
  } catch (err) {
    toast.show(`Error al liberar carrito: ${err.message || err}`, 'error');
  }
}

function handleProceedCheckout() {
  store.setState({ isCheckoutOpen: true });
}

function handleCloseCheckout() {
  store.setState({ isCheckoutOpen: false });
}

function handleToggleBookings() {
  const current = store.getState().isBookingsOpen;
  store.setState({ isBookingsOpen: !current });
}

function handleCloseBookings() {
  store.setState({ isBookingsOpen: false });
}

async function handleConfirmOrder({ customerName, customerEmail }) {
  const locked = store.getState().myLockedSeats || [];
  if (locked.length === 0) {
    toast.show('Tu carrito está vacío o tus bloqueos expiraron.', 'warning');
    handleCloseCheckout();
    return;
  }

  const seatIds = locked.map((s) => s.id);

  try {
    const result = await bookingApi.confirmBooking(seatIds, clientId, customerName, customerEmail);
    if (result && result.success) {
      handleCloseCheckout();
      toast.show(`¡Compra exitosa! Código de reserva: ${result.bookingCode}`, 'success', 8000);
      await syncData(true);
    } else {
      toast.show(`Error en la reserva: ${result.message}`, 'error', 6000);
      await syncData(true);
    }
  } catch (err) {
    console.error('[Error RPC confirmBooking]:', err);
    const msg = err.reason || err.message || 'Error al procesar la reserva con el servidor.';
    toast.show(`No se pudo confirmar la compra: ${msg}`, 'error', 7000);
    await syncData(true);
  }
}

function handleTimerExpired() {
  toast.show('⏱ Tu tiempo de reserva ha expirado. Las sillas se liberaron automáticamente.', 'warning', 6000);
  handleCloseCheckout();
  syncData(true);
}

// 5. Ensamblaje de componentes en el DOM
const eventHeader = createEventHeader(() => syncData(false), handleToggleBookings);

const mainLayout = document.createElement('main');
mainLayout.className = 'main-layout';

const seatMap = createSeatMap(handleSeatToggle);
const selectionPanel = createSelectionPanel(handleReleaseSeat, handleReleaseAll, handleProceedCheckout, handleTimerExpired);

mainLayout.appendChild(seatMap);
mainLayout.appendChild(selectionPanel);

const checkoutModal = createCheckoutModal(handleConfirmOrder, handleCloseCheckout);
const myBookingsModal = createMyBookings(handleCloseBookings);

app.appendChild(eventHeader);
app.appendChild(mainLayout);
app.appendChild(checkoutModal);
app.appendChild(myBookingsModal);

// 6. Carga inicial de datos
syncData(false);

// 7. Polling de sincronización en segundo plano cada 5 segundos
setInterval(() => {
  // Sincronizar silenciosamente para reflejar sillas tomadas por otros clientes en tiempo real
  syncData(true);
}, 5000);
