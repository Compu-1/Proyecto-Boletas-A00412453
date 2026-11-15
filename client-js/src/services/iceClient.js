/**
 * Módulo de conexión y ciclo de vida del comunicador ZeroC Ice (Tarea B4).
 *
 * Reglas de diseño arquitectónico:
 * 1. Punto único de configuración: El host se define en ICE_CONFIG y puede cambiarse
 *    en una sola línea o mediante window.ICE_SERVER_HOST para despliegues en VM o nube.
 * 2. Transporte web exclusivo: Los navegadores NO soportan sockets TCP puros (puerto 10000).
 *    Esta capa utiliza única y exclusivamente el protocolo WebSocket (ws://) en el puerto 10002.
 * 3. Estados de conexión auditables: Notifica al Store central los estados:
 *    - "conectando"
 *    - "conectado"
 *    - "sin conexión"
 *    Maneja fallos de red sin detener ni quebrar la ejecución de la página SPA.
 */
import { Ice } from 'ice';
import { BookingApp } from '../generated/BookingService.js';
import { store } from '../state/store.js';

/**
 * CONFIGURACIÓN CENTRALIZADA DE CONEXIÓN ZEROC ICE
 * Modificar aquí la dirección 'host' para apuntar a una Máquina Virtual o servidor remoto.
 */
export const ICE_CONFIG = {
  // Cambiar solo este valor para apuntar a otro servidor.
  host: 'localhost',
  wsPort: 10002,
  identity: 'BookingService',
  timeoutMs: 10000,
};

/**
 * Estados formales de conexión para la interfaz gráfica.
 */
export const ConnectionStatus = {
  CONNECTING: 'conectando',
  CONNECTED: 'conectado',
  DISCONNECTED: 'sin conexión',
};

let communicator = null;
let proxyInstance = null;

function updateConnectionStatus(status, error = null) {
  const state = {
    connectionStatus: status,
    isConnected: status === ConnectionStatus.CONNECTED,
    connectionError: error,
  };
  const currentStatus = store.getState().connectionStatus;
  store.setState(state);

  if (currentStatus !== status) {
    const color = status === ConnectionStatus.CONNECTED
      ? '#16a34a'
      : status === ConnectionStatus.CONNECTING
        ? '#f59e0b'
        : '#dc2626';
    const detail = error ? ` - ${error}` : '';
    console.log(`%c[ZeroC Ice] Estado: ${status}${detail}`, `color: ${color}; font-weight: bold;`);
  }
}

/**
 * Permite actualizar dinámicamente el host del servidor ZeroC Ice (útil para pruebas en VM).
 * @param {string} newHost - Dirección IP o dominio (ej. '192.168.1.50' o 'boletas.icesi.edu.co')
 */
export function setIceServerHost(newHost) {
  const host = typeof newHost === 'string' ? newHost.trim() : '';
  if (!host) {
    throw new Error('El host del servidor Ice no puede estar vacío.');
  }

  ICE_CONFIG.host = host;
  console.log(`[ZeroC Ice Config] Host actualizado a: ${ICE_CONFIG.host}`);
  closeIceConnection();
}

/**
 * Inicializa el Communicator de ZeroC Ice y obtiene el proxy tipado BookingServicePrx.
 * @returns {Promise<BookingApp.BookingServicePrx>}
 */
export async function getBookingServiceProxy() {
  if (proxyInstance) {
    return proxyInstance;
  }

  updateConnectionStatus(ConnectionStatus.CONNECTING);

  try {
    // 1. Inicialización del Communicator con propiedades de red
    const initData = new Ice.InitializationData();
    initData.properties = Ice.createProperties();
    initData.properties.setProperty('Ice.MessageSizeMax', '4096');
    initData.properties.setProperty('Ice.Default.Timeout', String(ICE_CONFIG.timeoutMs));
    initData.properties.setProperty('Ice.RetryIntervals', '-1'); // Evitar bucles infinitos de reconexión síncrona

    communicator = Ice.initialize(initData);

    // 2. Construcción del string de proxy con WebSocket exclusivamente
    // Formato Ice: <Identidad>:<protocolo> -h <host> -p <puerto>
    // Nota didáctica: En Windows, cuando el host es 'localhost', '127.0.0.1' asegura IPv4
    // compatible con el socket 0.0.0.0 del servidor Java.
    const resolvedHost = (ICE_CONFIG.host === 'localhost') ? '127.0.0.1' : ICE_CONFIG.host;
    const proxyStr = `${ICE_CONFIG.identity}:ws -h ${resolvedHost} -p ${ICE_CONFIG.wsPort}`;

    console.log(
      `%c[ZeroC Ice] Creando Communicator y resolviendo proxy WebSocket: ws://${ICE_CONFIG.host}:${ICE_CONFIG.wsPort} (${proxyStr})`,
      'color: #0284c7;'
    );

    // 3. Obtención y casting del proxy
    const basePrx = communicator.stringToProxy(proxyStr);
    if (!basePrx) {
      throw new Error(`No fue posible resolver la cadena de proxy: ${proxyStr}`);
    }

    // Cast estático tipado a la interfaz de Slice BookingServicePrx
    proxyInstance = BookingApp.BookingServicePrx.uncheckedCast(basePrx);

    return proxyInstance;
  } catch (error) {
    proxyInstance = null;
    updateConnectionStatus(
      ConnectionStatus.DISCONNECTED,
      error.message || 'Error de enlace con el servidor Ice.'
    );
    console.error('[ZeroC Ice] Error al inicializar el proxy:', error);

    throw error;
  }
}

/**
 * Ejecuta una llamada RPC y actualiza el estado según la respuesta real del servidor.
 * La creación del proxy por sí sola no comprueba que el servidor esté disponible.
 */
export async function invokeBookingService(operation) {
  if (store.getState().connectionStatus !== ConnectionStatus.CONNECTED) {
    updateConnectionStatus(ConnectionStatus.CONNECTING);
  }

  try {
    const proxy = await getBookingServiceProxy();
    const result = await operation(proxy);
    updateConnectionStatus(ConnectionStatus.CONNECTED);
    return result;
  } catch (error) {
    if (error instanceof BookingApp.BookingException) {
      updateConnectionStatus(ConnectionStatus.CONNECTED);
      throw error;
    }

    updateConnectionStatus(
      ConnectionStatus.DISCONNECTED,
      error.message || 'Error de enlace con el servidor Ice.'
    );
    throw error;
  }
}

/**
 * Destruye de forma segura el comunicador Ice y libera recursos de red.
 */
export async function closeIceConnection() {
  const communicatorToClose = communicator;
  communicator = null;
  proxyInstance = null;

  if (communicatorToClose) {
    try {
      await communicatorToClose.destroy();
      console.log('[ZeroC Ice] Communicator destruido limpiamente.');
    } catch (e) {
      console.warn('[ZeroC Ice] Advertencia al cerrar comunicador:', e);
    }
  }
}
