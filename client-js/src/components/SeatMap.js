/**
 * Componente SeatMap.
 * Renderiza el plano interactivo de 90 sillas con escenario, leyenda de zonas y estados,
 * filtrado por zona y manejo de eventos de clic.
 */
import { store } from '../state/store.js';

export function createSeatMap(onSeatToggle) {
  const container = document.createElement('section');
  container.className = 'seatmap-card card';

  // Barra superior de filtros
  const toolbar = document.createElement('div');
  toolbar.className = 'seatmap-toolbar';

  const title = document.createElement('h2');
  title.className = 'seatmap-title';
  title.textContent = 'Plano de Asientos';

  const filterGroup = document.createElement('div');
  filterGroup.className = 'filter-group';

  const filterLabel = document.createElement('span');
  filterLabel.className = 'filter-label';
  filterLabel.textContent = 'Filtrar por Zona:';

  const filterSelect = document.createElement('select');
  filterSelect.className = 'filter-select';
  filterSelect.id = 'zone-filter';

  const zones = [
    { value: 'ALL', label: 'Todas las Zonas (90)' },
    { value: 'VIP', label: 'VIP - Filas A-B ($120.000)' },
    { value: 'PLATEA', label: 'Platea - Filas C-E ($75.000)' },
    { value: 'GENERAL', label: 'General - Filas F-I ($45.000)' },
  ];

  for (const z of zones) {
    const opt = document.createElement('option');
    opt.value = z.value;
    opt.textContent = z.label;
    filterSelect.appendChild(opt);
  }

  filterGroup.appendChild(filterLabel);
  filterGroup.appendChild(filterSelect);

  toolbar.appendChild(title);
  toolbar.appendChild(filterGroup);

  // Escenario
  const stage = document.createElement('div');
  stage.className = 'stage';
  stage.textContent = '▲ ESCENARIO / TARIMA PRINCIPAL ▲';

  // Grid de sillas
  const gridContainer = document.createElement('div');
  gridContainer.className = 'seat-grid-container';
  gridContainer.setAttribute('aria-label', 'Mapa interactivo de las sillas');

  // Leyenda de colores y estados
  const legend = document.createElement('div');
  legend.className = 'seatmap-legend';

  const legendItems = [
    { label: 'Disponible', marker: 'D', class: 'seat-available zone-general' },
    { label: 'Tuya (bloqueada)', marker: 'T', class: 'seat-my-locked' },
    { label: 'De otra persona (bloqueada)', marker: 'O', class: 'seat-other-locked' },
    { label: 'Vendida', marker: 'V', class: 'seat-booked' },
  ];

  for (const item of legendItems) {
    const legItem = document.createElement('div');
    legItem.className = 'legend-item';

    const pill = document.createElement('span');
    pill.className = `legend-pill ${item.class}`;
    pill.textContent = item.marker;
    pill.setAttribute('aria-hidden', 'true');

    const txt = document.createElement('span');
    txt.textContent = item.label;

    legItem.appendChild(pill);
    legItem.appendChild(txt);
    legend.appendChild(legItem);
  }

  container.appendChild(toolbar);
  container.appendChild(stage);
  container.appendChild(gridContainer);
  container.appendChild(legend);

  let currentZoneFilter = 'ALL';

  filterSelect.addEventListener('change', (e) => {
    currentZoneFilter = e.target.value;
    renderSeats(store.getState());
  });

  function renderSeats(state) {
    gridContainer.innerHTML = '';
    const seats = state.seats || [];
    const myClientId = state.clientId;

    if (seats.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = state.connectionError ? 'seatmap-error' : 'seatmap-loading';
      emptyMsg.setAttribute('role', state.connectionError ? 'alert' : 'status');
      emptyMsg.textContent = state.isLoading
        ? 'Cargando silletería...'
        : state.connectionError
          ? `No se pudo cargar el mapa de sillas. ${state.connectionError}`
          : 'No hay información de sillas disponible.';
      gridContainer.appendChild(emptyMsg);
      return;
    }

    if (state.connectionError) {
      const staleDataNotice = document.createElement('div');
      staleDataNotice.className = 'seatmap-error';
      staleDataNotice.setAttribute('role', 'status');
      staleDataNotice.textContent = `No se pudo actualizar el mapa. Se muestran los últimos datos recibidos. ${state.connectionError}`;
      gridContainer.appendChild(staleDataNotice);
    }

    // Siempre se muestran las filas del plano; sus sillas provienen del servidor.
    const rowsMap = new Map();
    for (const seat of seats) {
      if (!rowsMap.has(seat.row)) {
        rowsMap.set(seat.row, []);
      }
      rowsMap.get(seat.row).push(seat);
    }

    const sortedRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const rowZone = (row) => row <= 'B' ? 'VIP' : row <= 'E' ? 'PLATEA' : 'GENERAL';

    for (const rowKey of sortedRows) {
      const rowSeats = (rowsMap.get(rowKey) || []).sort((a, b) => a.number - b.number);

      // Verificar si la fila coincide con el filtro de zona
      const zoneName = rowZone(rowKey);

      if (currentZoneFilter !== 'ALL' && zoneName !== currentZoneFilter) {
        continue;
      }

      const rowDiv = document.createElement('div');
      rowDiv.className = `seat-row seat-row-${zoneName.toLowerCase()}`;

      const rowLabel = document.createElement('span');
      rowLabel.className = 'row-label';
      rowLabel.textContent = `Fila ${rowKey}`;
      rowDiv.appendChild(rowLabel);

      const seatsWrapper = document.createElement('div');
      seatsWrapper.className = 'row-seats';

      for (const seat of rowSeats) {
        const stateValue = getEnumValue(seat.state);
        const isMyLock = stateValue === 1 && seat.lockedByClientId === myClientId;
        const isOtherLock = stateValue === 1 && !isMyLock;
        const isBooked = stateValue === 2;
        const stateLabel = isMyLock
          ? 'Bloqueada por ti'
          : isOtherLock
            ? 'Bloqueada por otra persona'
            : isBooked
              ? 'Vendida'
              : 'Disponible';
        const marker = isMyLock ? 'T' : isOtherLock ? 'O' : isBooked ? 'V' : 'D';

        const seatBtn = document.createElement('button');
        seatBtn.className = 'seat-btn';
        seatBtn.dataset.seatId = seat.id;
        seatBtn.setAttribute('aria-label', `Silla ${seat.id}, ${stateLabel.toLowerCase()}`);
        seatBtn.title = `Silla ${seat.id}: ${stateLabel}`;
        seatBtn.textContent = seat.number;

        const stateMarker = document.createElement('span');
        stateMarker.className = 'seat-state-marker';
        stateMarker.textContent = marker;
        stateMarker.setAttribute('aria-hidden', 'true');
        seatBtn.appendChild(stateMarker);

        if (isMyLock) {
          seatBtn.classList.add('seat-my-locked');
        } else if (isOtherLock) {
          seatBtn.classList.add('seat-other-locked');
        } else if (isBooked) {
          seatBtn.classList.add('seat-booked');
          seatBtn.disabled = true;
        } else {
          seatBtn.classList.add('seat-available', `zone-${zoneName.toLowerCase()}`);
        }

        seatBtn.addEventListener('click', () => {
          onSeatToggle(seat, isMyLock, isOtherLock, isBooked);
        });

        seatsWrapper.appendChild(seatBtn);
      }

      rowDiv.appendChild(seatsWrapper);
      gridContainer.appendChild(rowDiv);

      if (rowSeats.length !== 10) {
        const rowNotice = document.createElement('p');
        rowNotice.className = 'seatmap-row-warning';
        rowNotice.textContent = `Fila ${rowKey}: se recibieron ${rowSeats.length} de 10 sillas.`;
        gridContainer.appendChild(rowNotice);
      }
    }

    if (seats.length !== 90) {
      const inventoryNotice = document.createElement('p');
      inventoryNotice.className = 'seatmap-row-warning';
      inventoryNotice.textContent = `El servidor devolvió ${seats.length} de las 90 sillas esperadas.`;
      gridContainer.appendChild(inventoryNotice);
    }
  }

  function getEnumValue(value) {
    return typeof value === 'object' && value !== null && value._value !== undefined
      ? value._value
      : value;
  }

  store.subscribe((state) => {
    renderSeats(state);
  });

  return container;
}
