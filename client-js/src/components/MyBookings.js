/**
 * Componente MyBookings.
 * Modal/panel que lista las reservas confirmadas del usuario actual en el servidor.
 */
import { store } from '../state/store.js';

export function createMyBookings(onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'bookings-modal';
  overlay.style.display = 'none';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'bookings-modal-title');

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h3');
  title.id = 'bookings-modal-title';
  title.className = 'modal-title';
  title.textContent = '🎟 Historial de Mis Compras';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Cerrar historial');
  closeBtn.addEventListener('click', onClose);

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-body';

  const bookingsListContainer = document.createElement('div');
  bookingsListContainer.className = 'bookings-history-list';
  bookingsListContainer.id = 'bookings-history-list';

  body.appendChild(bookingsListContainer);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  const okBtn = document.createElement('button');
  okBtn.className = 'btn btn-primary';
  okBtn.textContent = 'Entendido';
  okBtn.addEventListener('click', onClose);

  footer.appendChild(okBtn);

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) onClose();
  });

  store.subscribe((state) => {
    if (state.isBookingsOpen) {
      overlay.style.display = 'flex';
      const list = state.myBookings || [];

      if (list.length === 0) {
        bookingsListContainer.innerHTML = `
          <div class="empty-bookings-box">
            <p>No tienes reservas confirmadas aún con esta sesión (${state.clientId}).</p>
            <small>Completa una compra en el carrito para recibir tu código de reserva.</small>
          </div>
        `;
        return;
      }

      bookingsListContainer.innerHTML = '';
      for (const booking of list) {
        const item = document.createElement('div');
        item.className = 'booking-card-item';

        const dateStr = booking.timestamp ? new Date(Number(booking.timestamp)).toLocaleString('es-CO') : 'Reciente';
        const seatsStr = Array.isArray(booking.seatIds) ? booking.seatIds.join(', ') : '';

        item.innerHTML = `
          <div class="booking-item-header">
            <span class="booking-code">${booking.bookingCode}</span>
            <span class="booking-date">${dateStr}</span>
          </div>
          <div class="booking-item-body">
            <p><strong>Comprador:</strong> ${booking.customerName} (${booking.customerEmail})</p>
            <p><strong>Sillas adquiridas:</strong> <span class="badge-seats">${seatsStr}</span></p>
            <p class="booking-item-total"><strong>Total Pagado:</strong> $${booking.totalAmount.toLocaleString('es-CO')} COP</p>
          </div>
        `;

        bookingsListContainer.appendChild(item);
      }
    } else {
      overlay.style.display = 'none';
    }
  });

  return overlay;
}
