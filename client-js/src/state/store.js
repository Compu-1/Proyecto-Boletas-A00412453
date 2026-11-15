/**
 * Almacén reactivo de estado centralizado (Patrón Observer / Pub-Sub simple).
 * No depende de ningún framework ni librería externa.
 */
class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
  }

  /**
   * Obtiene una copia inmutable del estado actual.
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Actualiza el estado mediante un parche y notifica a todos los suscriptores.
   * @param {Object} patch - Propiedades a actualizar
   */
  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.notify();
  }

  /**
   * Registra un callback que se ejecutará cada vez que el estado cambie.
   * @param {Function} listener - Callback que recibe (state)
   * @returns {Function} Función para cancelar la suscripción
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifica a todos los suscriptores activos.
   */
  notify() {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(currentState);
      } catch (err) {
        console.error('[Store Error en listener]:', err);
      }
    }
  }
}

export const store = new Store({
  clientId: '',
  eventInfo: null,
  seats: [],
  myLockedSeats: [],
  myBookings: [],
  isConnected: false,
  isLoading: true,
  isRefreshing: false,
  isLoadingBookings: false,
  isReleasingAll: false,
  isCheckoutOpen: false,
  isBookingsOpen: false,
  connectionError: null,
});
