/**
 * Componente Toast para notificaciones flotantes en pantalla.
 * Accesible, sin dependencias, con autocierre y soporte para tipos: info, success, warning, error.
 */
class ToastManager {
  constructor() {
    this.container = null;
  }

  ensureContainer() {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  /**
   * Muestra un mensaje emergente.
   * @param {string} message - Texto del mensaje
   * @param {'info'|'success'|'warning'|'error'} type - Tipo visual
   * @param {number} durationMs - Duración antes de desaparecer (default 4000ms)
   */
  show(message, type = 'info', durationMs = 4000) {
    const container = this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    if (type === 'success') icon.textContent = '✔';
    else if (type === 'error') icon.textContent = '✖';
    else if (type === 'warning') icon.textContent = '⚠';
    else icon.textContent = 'ℹ';

    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
      this.remove(toast);
    });

    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, durationMs);
    }
  }

  remove(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }
}

export const toast = new ToastManager();
