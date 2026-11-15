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

  // Leyenda de colores y estados
  const legend = document.createElement('div');
  legend.className = 'seatmap-legend';

  const legendItems = [
    { label: 'Disponible', class: 'seat-available' },
    { label: 'Tu Selección (Bloqueada)', class: 'seat-my-locked' },
    { label: 'Bloqueada por otro', class: 'seat-other-locked' },
    { label: 'Vendida', class: 'seat-booked' },
  ];

  for (const item of legendItems) {
    const legItem = document.createElement('div');
    legItem.className = 'legend-item';

    const pill = document.createElement('span');
    pill.className = `legend-pill ${item.class}`;

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
      emptyMsg.className = 'seatmap-loading';
      emptyMsg.textContent = state.isLoading ? 'Cargando silletería...' : 'No hay información de sillas disponible.';
      gridContainer.appendChild(emptyMsg);
      return;
    }

    // Agrupar por filas (A hasta I)
    const rowsMap = new Map();
    for (const seat of seats) {
      if (!rowsMap.has(seat.row)) {
        rowsMap.set(seat.row, []);
      }
      rowsMap.get(seat.row).push(seat);
    }

    const sortedRows = Array.from(rowsMap.keys()).sort();

    for (const rowKey of sortedRows) {
      const rowSeats = rowsMap.get(rowKey).sort((a, b) => a.number - b.number);

      // Verificar si la fila coincide con el filtro de zona
      const firstSeat = rowSeats[0];
      const zoneName = getZoneName(firstSeat ? firstSeat.zone : 0);

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
        const seatBtn = document.createElement('button');
        seatBtn.className = 'seat-btn';
        seatBtn.dataset.seatId = seat.id;
        seatBtn.textContent = seat.number;

        // Determinar estado visual
        // 0: AVAILABLE, 1: LOCKED, 2: BOOKED
        const stateValue = typeof seat.state === 'object' && seat.state._value !== undefined ? seat.state._value : seat.state;
        const isMyLock = stateValue === 1 && seat.lockedByClientId === myClientId;
        const isOtherLock = stateValue === 1 && !isMyLock;
        const isBooked = stateValue === 2;

        if (isMyLock) {
          seatBtn.classList.add('seat-my-locked');
          seatBtn.title = `Silla ${seat.id} (${zoneName}): En tu carrito ($${seat.price.toLocaleString('es-CO')}) - Haz clic para liberar`;
          seatBtn.setAttribute('aria-label', `Silla ${seat.id}, seleccionada por ti`);
        } else if (isOtherLock) {
          seatBtn.classList.add('seat-other-locked');
          seatBtn.title = `Silla ${seat.id} (${zoneName}): Bloqueada temporalmente por otro comprador`;
          seatBtn.setAttribute('aria-label', `Silla ${seat.id}, bloqueada por otro comprador`);
        } else if (isBooked) {
          seatBtn.classList.add('seat-booked');
          seatBtn.disabled = true;
          seatBtn.title = `Silla ${seat.id} (${zoneName}): Vendida definitivamente`;
          seatBtn.setAttribute('aria-label', `Silla ${seat.id}, vendida`);
        } else {
          seatBtn.classList.add('seat-available', `zone-${zoneName.toLowerCase()}`);
          seatBtn.title = `Silla ${seat.id} (${zoneName}): Disponible por $${seat.price.toLocaleString('es-CO')} - Haz clic para reservar`;
          seatBtn.setAttribute('aria-label', `Silla ${seat.id}, disponible, precio $${seat.price}`);
        }

        seatBtn.addEventListener('click', () => {
          onSeatToggle(seat, isMyLock, isOtherLock, isBooked);
        });

        seatsWrapper.appendChild(seatBtn);
      }

      rowDiv.appendChild(seatsWrapper);
      gridContainer.appendChild(rowDiv);
    }
  }

  function getZoneName(zoneEnum) {
    const val = typeof zoneEnum === 'object' && zoneEnum._value !== undefined ? zoneEnum._value : zoneEnum;
    if (val === 0) return 'VIP';
    if (val === 1) return 'PLATEA';
    return 'GENERAL';
  }

  store.subscribe((state) => {
    renderSeats(state);
  });

  return container;
}
