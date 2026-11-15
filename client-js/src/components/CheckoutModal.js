/**
 * Componente CheckoutModal.
 * Modal accesible de confirmación de reserva con validación estricta en tiempo real
 * para nombre completo y correo electrónico del comprador.
 */
import { store } from '../state/store.js';

export function createCheckoutModal(onConfirmOrder, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'checkout-modal';
  overlay.style.display = 'none';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modal-title');

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog checkout-modal-dialog';

  // Cabecera del modal
  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h3');
  title.id = 'modal-title';
  title.className = 'modal-title';
  title.textContent = 'Finalizar Reserva de Boletas';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
  closeBtn.type = 'button';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Cerrar ventana de pago');
  closeBtn.addEventListener('click', onClose);

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Cuerpo del modal
  const body = document.createElement('div');
  body.className = 'modal-body';

  // Resumen del pedido
  const orderSummary = document.createElement('div');
  orderSummary.className = 'modal-order-summary';
  orderSummary.id = 'modal-summary-box';

  // Formulario
  const form = document.createElement('form');
  form.className = 'checkout-form';
  form.id = 'checkout-form';
  form.noValidate = true;

  // Campo Nombre
  const nameGroup = document.createElement('div');
  nameGroup.className = 'form-group';

  const nameLabel = document.createElement('label');
  nameLabel.htmlFor = 'customer-name';
  nameLabel.textContent = 'Nombre Completo:';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'customer-name';
  nameInput.name = 'customerName';
  nameInput.placeholder = 'Ej. María Pérez';
  nameInput.required = true;
  nameInput.autocomplete = 'name';
  nameInput.setAttribute('aria-describedby', 'name-error');

  const nameError = document.createElement('span');
  nameError.className = 'form-error';
  nameError.id = 'name-error';
  nameError.setAttribute('aria-live', 'polite');

  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  nameGroup.appendChild(nameError);

  // Campo Correo
  const emailGroup = document.createElement('div');
  emailGroup.className = 'form-group';

  const emailLabel = document.createElement('label');
  emailLabel.htmlFor = 'customer-email';
  emailLabel.textContent = 'Correo Electrónico (para envío de boletas):';

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.id = 'customer-email';
  emailInput.name = 'customerEmail';
  emailInput.placeholder = 'ejemplo@correo.com';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailInput.setAttribute('aria-describedby', 'email-error');

  const emailError = document.createElement('span');
  emailError.className = 'form-error';
  emailError.id = 'email-error';
  emailError.setAttribute('aria-live', 'polite');

  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);
  emailGroup.appendChild(emailError);

  // Botones del pie del modal
  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', onClose);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.id = 'btn-confirm-order';
  submitBtn.textContent = 'Confirmar Compra Definitiva';

  const submissionError = document.createElement('p');
  submissionError.className = 'checkout-submit-error';
  submissionError.setAttribute('role', 'alert');
  submissionError.hidden = true;

  const receipt = document.createElement('section');
  receipt.className = 'checkout-receipt';
  receipt.hidden = true;

  footer.appendChild(cancelBtn);
  footer.appendChild(submitBtn);

  form.appendChild(nameGroup);
  form.appendChild(emailGroup);
  form.appendChild(footer);

  body.appendChild(orderSummary);
  body.appendChild(submissionError);
  body.appendChild(form);
  body.appendChild(receipt);

  dialog.appendChild(header);
  dialog.appendChild(body);
  overlay.appendChild(dialog);

  let isOpen = false;
  let isSubmitting = false;
  let previousFocus = null;
  let hasReceipt = false;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      onClose();
    }
  });

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

  function showReceipt(result, submittedSeats) {
    hasReceipt = true;
    orderSummary.hidden = true;
    form.hidden = true;
    receipt.hidden = false;
    receipt.innerHTML = '';

    const heading = document.createElement('h4');
    heading.textContent = 'Compra confirmada';
    heading.tabIndex = -1;

    const code = document.createElement('p');
    code.className = 'receipt-booking-code';
    code.textContent = `Código de reserva: ${result.bookingCode}`;

    const seats = document.createElement('p');
    const seatIds = Array.isArray(result.seatIds) ? result.seatIds : submittedSeats;
    seats.textContent = `Sillas: ${seatIds.join(', ')}`;

    const total = document.createElement('p');
    const amount = Number.isFinite(result.totalAmount) ? result.totalAmount : 0;
    total.textContent = `Total pagado: $${amount.toLocaleString('es-CO')} COP`;

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'btn btn-primary receipt-close-button';
    doneBtn.textContent = 'Cerrar comprobante';
    doneBtn.addEventListener('click', onClose);

    receipt.append(heading, code, seats, total, doneBtn);
    heading.focus();
  }

  function setFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    input.classList.toggle('input-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting || hasReceipt) return;

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const nameIsValid = nameVal.length > 0;
    const emailIsValid = emailInput.checkValidity() && emailRegex.test(emailVal);

    setFieldError(nameInput, nameError, nameIsValid ? '' : 'Ingresa tu nombre.');
    setFieldError(
      emailInput,
      emailError,
      emailIsValid ? '' : 'Ingresa un correo válido, por ejemplo usuario@dominio.com.'
    );
    submissionError.hidden = true;
    submissionError.textContent = '';

    if (!nameIsValid || !emailIsValid) {
      (nameIsValid ? emailInput : nameInput).focus();
      return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submitBtn.textContent = 'Procesando reserva en el servidor...';

    try {
      const submittedSeats = (store.getState().myLockedSeats || []).map((seat) => seat.id);
      const result = await onConfirmOrder({
        customerName: nameVal,
        customerEmail: emailVal,
      });
      if (result && result.success) {
        if (isOpen) {
          form.reset();
          showReceipt(result, submittedSeats);
        }
      } else {
        submissionError.textContent = result && result.message
          ? result.message
          : 'No se pudo confirmar la compra. Revisa el carrito e inténtalo de nuevo.';
        submissionError.hidden = false;
      }
    } catch (error) {
      submissionError.textContent = error.message || 'No se pudo confirmar la compra. Inténtalo de nuevo.';
      submissionError.hidden = false;
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar Compra Definitiva';
      form.removeAttribute('aria-busy');
    }
  });

  function renderOrderSummary(seats) {
    orderSummary.innerHTML = '';
    const title = document.createElement('h4');
    title.textContent = `Resumen de tu pedido (${seats.length} ${seats.length === 1 ? 'silla' : 'sillas'}):`;
    orderSummary.appendChild(title);

    const chips = document.createElement('div');
    chips.className = 'summary-chips';
    for (const seat of seats) {
      const chip = document.createElement('span');
      chip.className = 'summary-chip';
      chip.textContent = `Silla ${seat.id} ($${seat.price.toLocaleString('es-CO')})`;
      chips.appendChild(chip);
    }
    orderSummary.appendChild(chips);

    const total = seats.reduce((sum, seat) => sum + seat.price, 0);
    const totalText = document.createElement('p');
    totalText.className = 'summary-total-price';
    totalText.textContent = `Total a Pagar: $${total.toLocaleString('es-CO')} COP`;
    orderSummary.appendChild(totalText);
  }

  store.subscribe((state) => {
    const shouldBeOpen = Boolean(state.isCheckoutOpen);
    if (shouldBeOpen && !isOpen) {
      previousFocus = document.activeElement;
      isOpen = true;
      overlay.style.display = 'flex';
      hasReceipt = false;
      orderSummary.hidden = false;
      form.hidden = false;
      receipt.hidden = true;
      submissionError.hidden = true;
      setFieldError(nameInput, nameError, '');
      setFieldError(emailInput, emailError, '');
      renderOrderSummary(state.myLockedSeats || []);
      nameInput.focus();
    } else if (shouldBeOpen && !hasReceipt) {
      renderOrderSummary(state.myLockedSeats || []);
    } else if (!shouldBeOpen && isOpen) {
      isOpen = false;
      overlay.style.display = 'none';
      setFieldError(nameInput, nameError, '');
      setFieldError(emailInput, emailError, '');
      submissionError.hidden = true;
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
      previousFocus = null;
    }
  });

  return overlay;
}
