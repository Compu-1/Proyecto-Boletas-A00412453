/**
 * Componente SelectionPanel (Carrito Reactivo + Temporizador de 90s).
 * Administra la lista de sillas bloqueadas por el usuario, cálculo de subtotales
 * y la cuenta regresiva visible del tiempo de bloqueo temporal.
 */
import { store } from '../state/store.js';

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
  timerLabel.textContent = 'Tiempo para completar tu compra:';

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
  checkoutBtn.className = 'btn btn-primary btn-block';
  checkoutBtn.id = 'btn-proceed-checkout';
  checkoutBtn.textContent = '💳 Proceder al Pago';
  checkoutBtn.disabled = true;
  checkoutBtn.addEventListener('click', onProceedCheckout);

  const clearBtn = document.createElement('button');
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

  // Lógica interna del temporizador con setInterval
  let timerInterval = null;
  let remainingSeconds = 0;

  function startTimer(seconds) {
    clearInterval(timerInterval);
    remainingSeconds = seconds > 0 ? seconds : 90;
    updateTimerDisplay();
    timerWidget.style.display = 'flex';

    timerInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        updateTimerDisplay();
        if (onTimerExpired) onTimerExpired();
      } else {
        updateTimerDisplay();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerWidget.style.display = 'none';
  }

  function updateTimerDisplay() {
    const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
    const secs = Math.max(0, remainingSeconds) % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timerCountdown.textContent = formatted;

    timerCountdown.classList.remove('timer-danger', 'timer-warning');
    if (remainingSeconds <= 15) {
      timerCountdown.classList.add('timer-danger');
    } else if (remainingSeconds <= 30) {
      timerCountdown.classList.add('timer-warning');
    }
  }

  // Suscripción al store para render reactivo
  store.subscribe((state) => {
    const mySeats = state.myLockedSeats || [];
    countBadge.textContent = `${mySeats.length} ${mySeats.length === 1 ? 'silla' : 'sillas'}`;

    if (mySeats.length === 0) {
      stopTimer();
      itemsList.innerHTML = `
        <div class="empty-cart-message">
          <p>Tu carrito está vacío.</p>
          <small>Selecciona sillas en el plano para iniciar tu reserva.</small>
        </div>
      `;
      totalValue.textContent = '$0 COP';
      checkoutBtn.disabled = true;
      clearBtn.style.display = 'none';
      return;
    }

    // Hay sillas en el carrito
    if (!timerInterval) {
      // Iniciar cuenta de 90s (o el valor del estado si existe)
      startTimer(state.lockRemainingSeconds > 0 ? state.lockRemainingSeconds : 90);
    }

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

      const zoneBadge = document.createElement('span');
      zoneBadge.className = 'item-zone-badge';
      const zoneName = seat.zone === 0 ? 'VIP' : (seat.zone === 1 ? 'Platea' : 'General');
      zoneBadge.textContent = zoneName;

      const price = document.createElement('span');
      price.className = 'item-price';
      price.textContent = `$${seat.price.toLocaleString('es-CO')} COP`;

      info.appendChild(seatTitle);
      info.appendChild(zoneBadge);
      info.appendChild(price);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'cart-item-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Quitar silla ${seat.id} de la selección`;
      removeBtn.setAttribute('aria-label', `Quitar silla ${seat.id}`);
      removeBtn.addEventListener('click', () => {
        onReleaseSeat(seat.id);
      });

      item.appendChild(info);
      item.appendChild(removeBtn);
      itemsList.appendChild(item);
    }

    totalValue.textContent = `$${total.toLocaleString('es-CO')} COP`;
    checkoutBtn.disabled = false;
    clearBtn.style.display = 'block';
  });

  return panel;
}
