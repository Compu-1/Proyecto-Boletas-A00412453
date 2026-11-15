/**
 * Componente EventHeader.
 * Muestra el título del evento, fecha, lugar, identificador de sesión y contadores de aforo.
 */
import { store } from '../state/store.js';
import { createIcon } from './Icon.js';

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
  liveBadge.setAttribute('role', 'status');

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
  venueSpan.textContent = 'Lugar: Consultando...';

  metaRow.appendChild(dateSpan);
  metaRow.appendChild(venueSpan);

  titleGroup.appendChild(badgeRow);
  titleGroup.appendChild(title);
  titleGroup.appendChild(metaRow);

  const prices = document.createElement('div');
  prices.className = 'event-prices';
  prices.setAttribute('aria-label', 'Precios por zona');

  const priceItems = [
    { label: 'VIP', key: 'vipPrice' },
    { label: 'Platea', key: 'plateaPrice' },
    { label: 'General', key: 'generalPrice' },
  ];
  const priceValues = new Map();
  for (const item of priceItems) {
    const price = document.createElement('span');
    price.className = 'event-price';
    price.textContent = `${item.label}: Consultando...`;
    prices.appendChild(price);
    priceValues.set(item.key, price);
  }
  titleGroup.appendChild(prices);

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
  bookingsBtn.type = 'button';
  bookingsBtn.className = 'btn btn-secondary';
  bookingsBtn.id = 'btn-toggle-bookings';
  bookingsBtn.appendChild(createIcon('ticket'));
  const bookingsLabel = document.createElement('span');
  bookingsLabel.textContent = 'Mis compras';
  bookingsBtn.appendChild(bookingsLabel);
  bookingsBtn.addEventListener('click', onToggleBookings);

  const refreshBtn = document.createElement('button');
  refreshBtn.type = 'button';
  refreshBtn.className = 'btn btn-outline';
  refreshBtn.id = 'btn-refresh-data';
  refreshBtn.appendChild(createIcon('refresh'));
  const refreshLabel = document.createElement('span');
  refreshLabel.textContent = 'Actualizar';
  refreshBtn.appendChild(refreshLabel);
  refreshBtn.title = 'Refrescar aforos y estado de sillas';
  refreshBtn.addEventListener('click', onRefresh);

  btnRow.appendChild(bookingsBtn);
  btnRow.appendChild(refreshBtn);

  actionsGroup.appendChild(countersGrid);
  actionsGroup.appendChild(btnRow);

  header.appendChild(titleGroup);
  header.appendChild(actionsGroup);

  const dataStatus = document.createElement('p');
  dataStatus.className = 'event-data-status';
  dataStatus.setAttribute('role', 'status');
  dataStatus.setAttribute('aria-live', 'polite');
  header.appendChild(dataStatus);

  // Suscripción al store para actualización reactiva del encabezado
  store.subscribe((state) => {
    const connectionLabel = state.isConnected
      ? 'connected'
      : state.connectionError
        ? 'disconnected'
        : 'connecting';
    liveBadge.textContent = connectionLabel === 'connected'
      ? '● CONECTADO'
      : connectionLabel === 'disconnected'
        ? '● SIN CONEXIÓN'
        : '● CONECTANDO';
    liveBadge.className = `badge badge-live badge-${connectionLabel}`;

    refreshBtn.disabled = Boolean(state.isRefreshing);
    refreshLabel.textContent = state.isRefreshing
      ? (state.isConnected ? 'Actualizando...' : 'Conectando...')
      : state.connectionError
        ? 'Reintentar conexión'
        : 'Actualizar';
    if (state.isRefreshing) {
      refreshBtn.setAttribute('aria-busy', 'true');
    } else {
      refreshBtn.removeAttribute('aria-busy');
    }

    bookingsLabel.textContent = state.isLoadingBookings ? 'Consultando compras...' : 'Mis compras';
    if (state.isLoadingBookings) {
      bookingsBtn.setAttribute('aria-busy', 'true');
    } else {
      bookingsBtn.removeAttribute('aria-busy');
    }

    if (state.clientId) {
      clientBadge.textContent = `Cliente: ${state.clientId}`;
    }

    if (state.eventInfo) {
      title.textContent = state.eventInfo.name || 'Icesi Live Arena';
      dateSpan.textContent = `Fecha: ${state.eventInfo.date || 'Por definir'}`;
      venueSpan.textContent = `Lugar: ${state.eventInfo.venue || 'Por definir'}`;

      header.querySelector('#count-available').textContent = state.eventInfo.availableSeats;
      header.querySelector('#count-locked').textContent = state.eventInfo.lockedSeats;
      header.querySelector('#count-booked').textContent = state.eventInfo.bookedSeats;

      for (const item of priceItems) {
        const price = state.eventInfo[item.key];
        priceValues.get(item.key).textContent = `${item.label}: ${Number(price).toLocaleString('es-CO')} COP`;
      }
    } else {
      for (const item of priceItems) {
        priceValues.get(item.key).textContent = `${item.label}: --`;
      }
    }

    if (state.isLoading && !state.eventInfo) {
      dataStatus.textContent = 'Cargando información del evento y aforo...';
      dataStatus.className = 'event-data-status';
    } else if (state.connectionError) {
      const message = state.eventInfo
        ? `No se pudo actualizar la información. Se muestran los últimos datos recibidos. ${state.connectionError}`
        : `No se pudo cargar la información del evento. ${state.connectionError}`;
      dataStatus.className = 'event-data-status event-data-error';
      dataStatus.replaceChildren(document.createTextNode(`${message} `));
      const retryButton = document.createElement('button');
      retryButton.type = 'button';
      retryButton.className = 'btn btn-outline btn-retry';
      retryButton.textContent = state.isRefreshing ? 'Reintentando...' : 'Reintentar ahora';
      retryButton.disabled = Boolean(state.isRefreshing);
      retryButton.setAttribute('aria-label', 'Reintentar conexión con el servidor');
      retryButton.addEventListener('click', onRefresh);
      dataStatus.appendChild(retryButton);
    } else {
      dataStatus.textContent = '';
      dataStatus.className = 'event-data-status';
    }
  });

  return header;
}
