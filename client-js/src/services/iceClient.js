/**
 * Módulo de conexión y ciclo de vida del comunicador ZeroC Ice.
 * Establece el enlace WebSocket hacia ws://localhost:10002 y gestiona
 * el proxy tipado hacia BookingServicePrx.
 */
import { Ice } from 'ice';
import { BookingApp } from '../generated/BookingService.js';

let communicator = null;
let proxyInstance = null;

/**
 * Obtiene el proxy remoto de BookingServicePrx reutilizando el comunicador Ice.
 * @returns {Promise<BookingApp.BookingServicePrx>}
 */
export async function getBookingServiceProxy() {
  if (proxyInstance) {
    return proxyInstance;
  }

  try {
    const initData = new Ice.InitializationData();
    initData.properties = Ice.createProperties();
    initData.properties.setProperty('Ice.MessageSizeMax', '4096');
    initData.properties.setProperty('Ice.Default.Timeout', '10000');

    communicator = Ice.initialize(initData);

    // En Windows, 'localhost' resuelve preferentemente a IPv6 (::1), mientras que
    // el servidor Java escucha en IPv4 (0.0.0.0). Forzar 127.0.0.1 garantiza IPv4.
    const hostname = window.location.hostname;
    const host = (hostname === 'localhost' || !hostname) ? '127.0.0.1' : hostname;
    const wsPort = 10002;
    const proxyStr = `BookingService:ws -h ${host} -p ${wsPort}`;

    console.log(`[ZeroC Ice] Estableciendo proxy WebSocket en: ${proxyStr}`);

    const basePrx = communicator.stringToProxy(proxyStr);
    proxyInstance = BookingApp.BookingServicePrx.uncheckedCast(basePrx);

    if (!proxyInstance) {
      throw new Error(`Proxy inválido para el servicio en ${proxyStr}`);
    }

    return proxyInstance;
  } catch (error) {
    console.error('[ZeroC Ice] Error al inicializar proxy:', error);
    proxyInstance = null;
    throw error;
  }
}

/**
 * Cierra limpiamente el comunicador Ice al descargar la página.
 */
export async function closeIceConnection() {
  if (communicator) {
    try {
      await communicator.destroy();
    } catch (e) {
      console.warn('[Ice] Error al cerrar comunicador:', e);
    }
    communicator = null;
    proxyInstance = null;
  }
}
