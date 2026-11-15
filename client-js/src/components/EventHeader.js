/**
 * Componente EventHeader.
 * Muestra el título del evento, fecha, lugar, identificador de sesión y contadores de aforo.
 */
import { store } from '../state/store.js';

export function createEventHeader(onRefresh, onToggleBookings) {
  const header = document.createElement('header');
  header.className = 'event-header card';

  // Sub-contenedor de títulos
  const titleGroup = document.createElement('div');
  titleGroup.className = 'header-title-group';

  const badgeRow = document.createElement('div');
  badgeRow.className = 'badge-row';

  const liveBadge = document.createElement('span');
  liveBadge.className = 'badge badge-live';
  liveBadge.textContent = '● EN VIVO';

  const clientBadge = document.createElement('span');
  clientBadge.className = 'badge badge-client';
  clientBadge.id = 'header-client-id';
  clientBadge.textContent = 'Cliente: Conectando...';

  badgeRow.appendChild(liveBadge);
  badgeRow.appendChild(clientBadge);

  const title = document.createElement('h1');
  title.className = 'event-title';
  title.id = 'header-event-title';
  title.textContent = 'Icesi Live Arena';

  const metaRow = document.createElement('div');
  metaRow.className = 'event-meta';

  const dateSpan = document.createElement('span');
  dateSpan.id = 'header-event-date';
  dateSpan.textContent = 'Fecha: Consultando...';

  const venueSpan = document.createElement('span');
  venueSpan.id = 'header-event-venue';
  venueSpan.textContent = 'Lugar: Auditorio Manuelita';

  metaRow.appendChild(dateSpan);
  metaRow.appendChild(venueSpan);

  titleGroup.appendChild(badgeRow);
  titleGroup.appendChild(title);
  titleGroup.appendChild(metaRow);

  // Sub-contenedor de contadores y acciones
  const actionsGroup = document.createElement('div');
  actionsGroup.className = 'header-actions-group';

  const countersGrid = document.createElement('div');
  countersGrid.className = 'counters-grid';

  const createCounter = (label, id, colorClass) => {
    const box = document.createElement('div');
    box.className = `counter-box ${colorClass}`;

    const num = document.createElement('span');
    num.className = 'counter-number';
    num.id = id;
    num.textContent = '-';

    const lbl = document.createElement('span');
    lbl.className = 'counter-label';
    lbl.textContent = label;

    box.appendChild(num);
    box.appendChild(lbl);
    return box;
  };

  countersGrid.appendChild(createCounter('Disponibles', 'count-available', 'counter-available'));
  countersGrid.appendChild(createCounter('Bloqueadas', 'count-locked', 'counter-locked'));
  countersGrid.appendChild(createCounter('Vendidas', 'count-booked', 'counter-booked'));

  const btnRow = document.createElement('div');
  btnRow.className = 'header-btn-row';

  const bookingsBtn = document.createElement('button');
  bookingsBtn.className = 'btn btn-secondary';
  bookingsBtn.id = 'btn-toggle-bookings';
  bookingsBtn.textContent = '🎟 Mis Compras';
  bookingsBtn.addEventListener('click', onToggleBookings);

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'btn btn-outline';
  refreshBtn.id = 'btn-refresh-data';
  refreshBtn.textContent = '🔄 Actualizar';
  refreshBtn.title = 'Refrescar aforos y estado de sillas';
  refreshBtn.addEventListener('click', onRefresh);

  btnRow.appendChild(bookingsBtn);
  btnRow.appendChild(refreshBtn);

  actionsGroup.appendChild(countersGrid);
  actionsGroup.appendChild(btnRow);

  header.appendChild(titleGroup);
  header.appendChild(actionsGroup);

  // Suscripción al store para actualización reactiva del encabezado
  store.subscribe((state) => {
    if (state.clientId) {
      clientBadge.textContent = `Cliente: ${state.clientId}`;
    }

    if (state.eventInfo) {
      title.textContent = state.eventInfo.name || 'Icesi Live Arena';
      dateSpan.textContent = `📅 ${state.eventInfo.date || 'Por definir'}`;
      venueSpan.textContent = `📍 ${state.eventInfo.venue || 'Auditorio Manuelita'}`;

      const elAvail = header.querySelector('#count-available');
      const elLocked = header.querySelector('#count-locked');
      const elBooked = header.querySelector('#count-booked');

      if (elAvail) elAvail.textContent = state.eventInfo.availableSeats;
      if (elLocked) elLocked.textContent = state.eventInfo.lockedSeats;
      if (elBooked) elBooked.textContent = state.eventInfo.bookedSeats;
    }
  });

  return header;
}
