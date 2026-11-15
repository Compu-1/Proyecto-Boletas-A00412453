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
  dialog.className = 'modal-dialog';

  // Cabecera del modal
  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h3');
  title.id = 'modal-title';
  title.className = 'modal-title';
  title.textContent = 'Finalizar Reserva de Boletas';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
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

  const nameError = document.createElement('span');
  nameError.className = 'form-error';
  nameError.id = 'name-error';

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

  const emailError = document.createElement('span');
  emailError.className = 'form-error';
  emailError.id = 'email-error';

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

  footer.appendChild(cancelBtn);
  footer.appendChild(submitBtn);

  form.appendChild(nameGroup);
  form.appendChild(emailGroup);
  form.appendChild(footer);

  body.appendChild(orderSummary);
  body.appendChild(form);

  dialog.appendChild(header);
  dialog.appendChild(body);
  overlay.appendChild(dialog);

  // Cerrar al hacer clic en el backdrop
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      onClose();
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display !== 'none') {
      onClose();
    }
  });

  // Validación y envío del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!nameVal || nameVal.length < 3) {
      nameError.textContent = 'Por favor ingresa tu nombre completo (mínimo 3 caracteres).';
      nameInput.classList.add('input-invalid');
      isValid = false;
    } else {
      nameError.textContent = '';
      nameInput.classList.remove('input-invalid');
    }

    if (!emailVal || !emailRegex.test(emailVal)) {
      emailError.textContent = 'Ingresa una dirección de correo válida (ej. usuario@dominio.com).';
      emailInput.classList.add('input-invalid');
      isValid = false;
    } else {
      emailError.textContent = '';
      emailInput.classList.remove('input-invalid');
    }

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Procesando reserva en el servidor...';

    try {
      await onConfirmOrder({
        customerName: nameVal,
        customerEmail: emailVal,
      });
      form.reset();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmar Compra Definitiva';
    }
  });

  // Suscripción al store para visibilidad y datos
  store.subscribe((state) => {
    if (state.isCheckoutOpen) {
      overlay.style.display = 'flex';

      const seats = state.myLockedSeats || [];
      const total = seats.reduce((acc, s) => acc + s.price, 0);

      orderSummary.innerHTML = `
        <h4>Resumen de tu pedido (${seats.length} ${seats.length === 1 ? 'silla' : 'sillas'}):</h4>
        <div class="summary-chips">
          ${seats.map((s) => `<span class="summary-chip">Silla ${s.id} ($${s.price.toLocaleString('es-CO')})</span>`).join('')}
        </div>
        <p class="summary-total-price">Total a Pagar: <strong>$${total.toLocaleString('es-CO')} COP</strong></p>
      `;

      setTimeout(() => nameInput.focus(), 100);
    } else {
      overlay.style.display = 'none';
      nameError.textContent = '';
      emailError.textContent = '';
      nameInput.classList.remove('input-invalid');
      emailInput.classList.remove('input-invalid');
    }
  });

  return overlay;
}
