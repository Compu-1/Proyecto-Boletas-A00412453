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
  closeBtn.type = 'button';
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
  bookingsListContainer.setAttribute('aria-live', 'polite');

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

  let isOpen = false;
  let previousFocus = null;

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = Array.from(dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => !element.hidden && element.getClientRects().length > 0);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  store.subscribe((state) => {
    if (state.isBookingsOpen) {
      if (!isOpen) {
        previousFocus = document.activeElement;
        isOpen = true;
      }
      overlay.style.display = 'flex';
      if (previousFocus && !dialog.contains(document.activeElement)) {
        closeBtn.focus();
      }
      const list = state.myBookings || [];

      if (list.length === 0) {
        bookingsListContainer.innerHTML = '';
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-bookings-box';
        const message = document.createElement('p');
        message.textContent = `No tienes reservas confirmadas aún con esta sesión (${state.clientId}).`;
        const hint = document.createElement('small');
        hint.textContent = 'Completa una compra en el carrito para recibir tu código de reserva.';
        emptyMessage.append(message, hint);
        bookingsListContainer.appendChild(emptyMessage);
        return;
      }

      bookingsListContainer.innerHTML = '';
      for (const booking of list) {
        const item = document.createElement('div');
        item.className = 'booking-card-item';

        const timestamp = booking.timestamp && typeof booking.timestamp.toNumber === 'function'
          ? booking.timestamp.toNumber()
          : Number(booking.timestamp);
        const dateStr = timestamp ? new Date(timestamp).toLocaleString('es-CO') : 'Reciente';
        const seatsStr = Array.isArray(booking.seatIds) ? booking.seatIds.join(', ') : '';

        const itemHeader = document.createElement('div');
        itemHeader.className = 'booking-item-header';
        const code = document.createElement('span');
        code.className = 'booking-code';
        code.textContent = booking.bookingCode;
        const date = document.createElement('span');
        date.className = 'booking-date';
        date.textContent = dateStr;
        itemHeader.append(code, date);

        const itemBody = document.createElement('div');
        itemBody.className = 'booking-item-body';
        const buyer = document.createElement('p');
        buyer.textContent = `Comprador: ${booking.customerName} (${booking.customerEmail})`;
        const seatList = document.createElement('p');
        seatList.textContent = `Sillas adquiridas: ${seatsStr}`;
        const total = document.createElement('p');
        total.className = 'booking-item-total';
        total.textContent = `Total pagado: $${booking.totalAmount.toLocaleString('es-CO')} COP`;
        itemBody.append(buyer, seatList, total);

        item.append(itemHeader, itemBody);
        bookingsListContainer.appendChild(item);
      }
    } else {
      overlay.style.display = 'none';
      if (isOpen) {
        isOpen = false;
        if (previousFocus && typeof previousFocus.focus === 'function') {
          previousFocus.focus();
        }
        previousFocus = null;
      }
    }
  });

  return overlay;
}
