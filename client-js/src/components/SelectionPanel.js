/**
 * Componente SelectionPanel (Carrito Reactivo + Temporizador de 90s).
 * Administra la lista de sillas bloqueadas por el usuario, cálculo de subtotales
 * y la cuenta regresiva visible del tiempo de bloqueo temporal.
 */
import { store } from '../state/store.js';
import { formatRemainingTime, getSeatExpiresAt } from '../utils/lockTimer.js';

export function createSelectionPanel(onReleaseSeat, onReleaseAll, onProceedCheckout, onTimerExpired) {
  const panel = document.createElement('aside');
  panel.className = 'selection-panel card';

  // Cabecera del carrito
  const header = document.createElement('div');
  header.className = 'panel-header';

  const title = document.createElement('h3');
  title.className = 'panel-title';
  title.textContent = '🛒 Tu Selección';

  const countBadge = document.createElement('span');
  countBadge.className = 'badge badge-primary';
  countBadge.id = 'cart-count-badge';
  countBadge.textContent = '0 sillas';

  header.appendChild(title);
  header.appendChild(countBadge);

  // Widget del Temporizador
  const timerWidget = document.createElement('div');
  timerWidget.className = 'timer-widget';
  timerWidget.id = 'timer-widget';
  timerWidget.style.display = 'none';

  const timerIcon = document.createElement('span');
  timerIcon.className = 'timer-icon';
  timerIcon.textContent = '⏱';

  const timerTextGroup = document.createElement('div');
  timerTextGroup.className = 'timer-text-group';

  const timerLabel = document.createElement('span');
  timerLabel.className = 'timer-label';
  timerLabel.textContent = 'Silla que vence primero:';

  const timerCountdown = document.createElement('span');
  timerCountdown.className = 'timer-countdown';
  timerCountdown.id = 'timer-countdown';
  timerCountdown.textContent = '01:30';

  timerTextGroup.appendChild(timerLabel);
  timerTextGroup.appendChild(timerCountdown);

  timerWidget.appendChild(timerIcon);
  timerWidget.appendChild(timerTextGroup);

  // Contenedor de la lista de sillas seleccionadas
  const itemsList = document.createElement('div');
  itemsList.className = 'cart-items-list';
  itemsList.id = 'cart-items-list';

  // Resumen de precios
  const summaryBox = document.createElement('div');
  summaryBox.className = 'cart-summary';

  const totalRow = document.createElement('div');
  totalRow.className = 'summary-row total-row';

  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Total a Pagar:';

  const totalValue = document.createElement('span');
  totalValue.className = 'total-amount';
  totalValue.id = 'cart-total-amount';
  totalValue.textContent = '$0 COP';

  totalRow.appendChild(totalLabel);
  totalRow.appendChild(totalValue);
  summaryBox.appendChild(totalRow);

  // Botones de acción
  const actionsBox = document.createElement('div');
  actionsBox.className = 'panel-actions';

  const checkoutBtn = document.createElement('button');
  checkoutBtn.type = 'button';
  checkoutBtn.className = 'btn btn-primary btn-block';
  checkoutBtn.id = 'btn-proceed-checkout';
  checkoutBtn.textContent = '💳 Proceder al Pago';
  checkoutBtn.disabled = true;
  checkoutBtn.addEventListener('click', onProceedCheckout);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-link btn-block';
  clearBtn.id = 'btn-clear-cart';
  clearBtn.textContent = 'Liberar todas las sillas';
  clearBtn.style.display = 'none';
  clearBtn.addEventListener('click', onReleaseAll);

  actionsBox.appendChild(checkoutBtn);
  actionsBox.appendChild(clearBtn);

  panel.appendChild(header);
  panel.appendChild(timerWidget);
  panel.appendChild(itemsList);
  panel.appendChild(summaryBox);
  panel.appendChild(actionsBox);

  // setInterval actualiza la pantalla; la expiración real la valida el servidor.
  let timerInterval = null;
  let activeSeats = [];
  let countdownElements = new Map();
  const reportedExpirations = new Map();

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerWidget.style.display = 'none';
  }

  function setCountdownStyle(element, remainingSeconds) {
    element.classList.remove('timer-danger', 'timer-warning');
    if (remainingSeconds <= 15) {
      element.classList.add('timer-danger');
    } else if (remainingSeconds <= 30) {
      element.classList.add('timer-warning');
    }
  }

  function updateCountdowns() {
    const now = Date.now();
    let nearestRemainingSeconds = null;
    let knownExpirationCount = 0;
    const expiredSeatIds = [];

    for (const seat of activeSeats) {
      const countdown = countdownElements.get(seat.id);
      const expiresAt = getSeatExpiresAt(seat);
      if (!countdown || expiresAt === null) {
        if (countdown) {
          countdown.textContent = '--:--';
          countdown.classList.remove('timer-danger', 'timer-warning');
        }
        continue;
      }

      knownExpirationCount++;
      const remainingSeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
      countdown.textContent = formatRemainingTime(remainingSeconds);
      setCountdownStyle(countdown, remainingSeconds);

      if (remainingSeconds === 0) {
        if (reportedExpirations.get(seat.id) !== expiresAt) {
          reportedExpirations.set(seat.id, expiresAt);
          expiredSeatIds.push(seat.id);
        }
      } else if (
        nearestRemainingSeconds === null ||
        remainingSeconds < nearestRemainingSeconds
      ) {
        nearestRemainingSeconds = remainingSeconds;
      }
    }

    timerCountdown.textContent = nearestRemainingSeconds === null
      ? (knownExpirationCount > 0 ? '00:00' : '--:--')
      : formatRemainingTime(nearestRemainingSeconds);
    if (knownExpirationCount > 0) {
      setCountdownStyle(timerCountdown, nearestRemainingSeconds ?? 0);
    } else {
      timerCountdown.classList.remove('timer-danger', 'timer-warning');
    }

    if (expiredSeatIds.length > 0 && onTimerExpired) {
      onTimerExpired(expiredSeatIds);
    }
  }

  // Suscripción al store para render reactivo
  store.subscribe((state) => {
    const mySeats = state.myLockedSeats || [];
    const pendingSeatIds = state.pendingSeatIds || [];
    const actionsPending = Boolean(state.isReleasingAll) || pendingSeatIds.length > 0;
    countBadge.textContent = `${mySeats.length} ${mySeats.length === 1 ? 'silla' : 'sillas'}`;
    activeSeats = mySeats;
    countdownElements = new Map();

    if (mySeats.length === 0) {
      stopTimer();
      itemsList.innerHTML = `
        <div class="empty-cart-message">
          <p>Tu carrito está vacío.</p>
          <small>Selecciona sillas en el plano para iniciar tu reserva.</small>
        </div>
      `;
      totalValue.textContent = '$0 COP';
      checkoutBtn.disabled = actionsPending;
      checkoutBtn.textContent = actionsPending ? 'Procesando solicitud...' : '💳 Proceder al Pago';
      if (actionsPending) {
        checkoutBtn.setAttribute('aria-busy', 'true');
      } else {
        checkoutBtn.removeAttribute('aria-busy');
      }
      clearBtn.disabled = actionsPending;
      clearBtn.textContent = state.isReleasingAll ? 'Liberando sillas...' : 'Liberar todas las sillas';
      clearBtn.removeAttribute('aria-busy');
      clearBtn.style.display = 'none';
      return;
    }

    timerWidget.style.display = 'flex';
    itemsList.innerHTML = '';
    let total = 0;

    for (const seat of mySeats) {
      total += seat.price;

      const item = document.createElement('div');
      item.className = 'cart-item';

      const info = document.createElement('div');
      info.className = 'cart-item-info';

      const seatTitle = document.createElement('strong');
      seatTitle.textContent = `Silla ${seat.id}`;

      const seatCountdown = document.createElement('span');
      seatCountdown.className = 'cart-item-countdown';
      seatCountdown.setAttribute('aria-label', `Tiempo restante de la silla ${seat.id}`);
      countdownElements.set(seat.id, seatCountdown);

      const zoneBadge = document.createElement('span');
      zoneBadge.className = 'item-zone-badge';
      const zoneName = seat.zone === 0 ? 'VIP' : (seat.zone === 1 ? 'Platea' : 'General');
      zoneBadge.textContent = zoneName;

      const price = document.createElement('span');
      price.className = 'item-price';
      price.textContent = `$${seat.price.toLocaleString('es-CO')} COP`;

      info.appendChild(seatTitle);
      info.appendChild(seatCountdown);
      info.appendChild(zoneBadge);
      info.appendChild(price);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'cart-item-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Quitar silla ${seat.id} de la selección`;
      removeBtn.setAttribute('aria-label', `Quitar silla ${seat.id}`);
      removeBtn.disabled = pendingSeatIds.includes(seat.id) || Boolean(state.isReleasingAll);
      if (removeBtn.disabled) {
        removeBtn.setAttribute('aria-busy', 'true');
        removeBtn.title = `Procesando liberación de la silla ${seat.id}`;
      }
      removeBtn.addEventListener('click', () => {
        onReleaseSeat(seat.id);
      });

      item.appendChild(info);
      item.appendChild(removeBtn);
      itemsList.appendChild(item);
    }

    totalValue.textContent = `$${total.toLocaleString('es-CO')} COP`;
    checkoutBtn.disabled = actionsPending;
    checkoutBtn.textContent = actionsPending ? 'Procesando solicitud...' : '💳 Proceder al Pago';
    if (actionsPending) {
      checkoutBtn.setAttribute('aria-busy', 'true');
    } else {
      checkoutBtn.removeAttribute('aria-busy');
    }
    clearBtn.disabled = Boolean(state.isReleasingAll) || pendingSeatIds.length > 0;
    clearBtn.textContent = state.isReleasingAll
      ? 'Liberando sillas...'
      : pendingSeatIds.length > 0
        ? 'Procesando solicitud...'
        : 'Liberar todas las sillas';
    if (state.isReleasingAll || pendingSeatIds.length > 0) {
      clearBtn.setAttribute('aria-busy', 'true');
    } else {
      clearBtn.removeAttribute('aria-busy');
    }
    clearBtn.style.display = 'block';

    if (!timerInterval) {
      timerInterval = setInterval(updateCountdowns, 1000);
    }
    updateCountdowns();
  });

  return panel;
}
