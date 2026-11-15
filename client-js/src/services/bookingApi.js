/**
 * Fachada de operaciones RPC contra el servidor ZeroC Ice.
 * Consume el proxy obtenido por iceClient.js y provee funciones asíncronas tipadas.
 */
import { invokeBookingService } from './iceClient.js';
import { BookingApp } from '../generated/BookingService.js';

export { BookingApp };

function getErrorDetail(error) {
  return typeof error.reason === 'string' && error.reason.trim()
    ? ` Detalle: ${error.reason.trim()}`
    : '';
}

function translateError(error, operationName) {
  let message;

  if (error instanceof BookingApp.SeatNotFoundException) {
    message = `No se encontró la silla solicitada.${getErrorDetail(error)}`;
  } else if (error instanceof BookingApp.SeatNotAvailableException) {
    message = `La silla ya no está disponible para bloquearla.${getErrorDetail(error)}`;
  } else if (error instanceof BookingApp.LockExpiredException) {
    message = `El tiempo de bloqueo venció. Selecciona la silla y vuelve a intentarlo.${getErrorDetail(error)}`;
  } else if (error instanceof BookingApp.InvalidBookingException) {
    message = `Los datos de la reserva no son válidos.${getErrorDetail(error)}`;
  } else if (error instanceof BookingApp.BookingException) {
    message = `No se pudo completar la reserva.${getErrorDetail(error)}`;
  } else if (operationName === 'confirmar la compra') {
    message = 'No se recibió respuesta al confirmar la compra. Es posible que el servidor la haya procesado; consulta “Mis Compras” antes de volver a intentarlo.';
  } else {
    message = `No se pudo completar la operación para ${operationName}. Comprueba la conexión e inténtalo de nuevo.`;
  }

  const translatedError = new Error(message);
  translatedError.name = error.name || 'BookingApiError';
  translatedError.reason = message;
  translatedError.cause = error;
  return translatedError;
}

async function callBookingService(operationName, operation) {
  try {
    return await invokeBookingService(operation);
  } catch (error) {
    throw translateError(error, operationName);
  }
}

/**
 * Consulta la información general del evento y los contadores de aforo.
 */
export async function getEventInfo() {
  return await callBookingService('consultar el evento', (proxy) => proxy.getEventInfo());
}

/**
 * Obtiene el inventario completo de las 90 sillas.
 */
export async function getAllSeats() {
  return await callBookingService('consultar las sillas', (proxy) => proxy.getAllSeats());
}

/**
 * Consulta las sillas pertenecientes a una zona específica (VIP, Platea, General).
 */
export async function getSeatsByZone(zone) {
  return await callBookingService('filtrar las sillas por zona', (proxy) => proxy.getSeatsByZone(zone));
}

/**
 * Consulta el estado detallado de una silla específica por su ID (ej. "A-1").
 */
export async function getSeat(seatId) {
  return await callBookingService('consultar la silla', (proxy) => proxy.getSeat(seatId));
}

/**
 * Solicita el bloqueo temporal de una silla para el cliente actual.
 */
export async function lockSeat(seatId, clientId) {
  return await callBookingService('bloquear la silla', (proxy) => proxy.lockSeat(seatId, clientId));
}

/**
 * Libera una silla previamente bloqueada por el cliente.
 */
export async function releaseSeat(seatId, clientId) {
  return await callBookingService('liberar la silla', (proxy) => proxy.releaseSeat(seatId, clientId));
}

/**
 * Confirma la compra definitiva de un conjunto de sillas bloqueadas ("Todo o Nada").
 */
export async function confirmBooking(seatIds, clientId, customerName, customerEmail) {
  return await callBookingService(
    'confirmar la compra',
    (proxy) => proxy.confirmBooking(seatIds, clientId, customerName, customerEmail)
  );
}

/**
 * Consulta las sillas que se encuentran actualmente bloqueadas por este cliente.
 */
export async function getMyLockedSeats(clientId) {
  return await callBookingService('consultar tus sillas bloqueadas', (proxy) => proxy.getMyLockedSeats(clientId));
}

/**
 * Consulta el historial de compras confirmadas de este cliente.
 */
export async function getMyBookings(clientId) {
  return await callBookingService('consultar tus compras', (proxy) => proxy.getMyBookings(clientId));
}

/**
 * Reinicia el inventario; operación exclusiva para pruebas, no exponer en la interfaz final.
 */
export async function resetSeats() {
  return await callBookingService('reiniciar el inventario de pruebas', (proxy) => proxy.resetSeats());
}
