/**
 * Fachada de operaciones RPC contra el servidor ZeroC Ice.
 * Consume el proxy obtenido por iceClient.js y provee funciones asíncronas tipadas.
 */
import { invokeBookingService } from './iceClient.js';
import { BookingApp } from '../generated/BookingService.js';

export { BookingApp };

/**
 * Consulta la información general del evento y los contadores de aforo.
 */
export async function getEventInfo() {
  return await invokeBookingService((proxy) => proxy.getEventInfo());
}

/**
 * Obtiene el inventario completo de las 90 sillas.
 */
export async function getAllSeats() {
  return await invokeBookingService((proxy) => proxy.getAllSeats());
}

/**
 * Consulta las sillas pertenecientes a una zona específica (VIP, Platea, General).
 */
export async function getSeatsByZone(zone) {
  return await invokeBookingService((proxy) => proxy.getSeatsByZone(zone));
}

/**
 * Consulta el estado detallado de una silla específica por su ID (ej. "A-1").
 */
export async function getSeat(seatId) {
  return await invokeBookingService((proxy) => proxy.getSeat(seatId));
}

/**
 * Solicita el bloqueo temporal de una silla para el cliente actual.
 */
export async function lockSeat(seatId, clientId) {
  return await invokeBookingService((proxy) => proxy.lockSeat(seatId, clientId));
}

/**
 * Libera una silla previamente bloqueada por el cliente.
 */
export async function releaseSeat(seatId, clientId) {
  return await invokeBookingService((proxy) => proxy.releaseSeat(seatId, clientId));
}

/**
 * Confirma la compra definitiva de un conjunto de sillas bloqueadas ("Todo o Nada").
 */
export async function confirmBooking(seatIds, clientId, customerName, customerEmail) {
  return await invokeBookingService((proxy) => proxy.confirmBooking(seatIds, clientId, customerName, customerEmail));
}

/**
 * Consulta las sillas que se encuentran actualmente bloqueadas por este cliente.
 */
export async function getMyLockedSeats(clientId) {
  return await invokeBookingService((proxy) => proxy.getMyLockedSeats(clientId));
}

/**
 * Consulta el historial de compras confirmadas de este cliente.
 */
export async function getMyBookings(clientId) {
  return await invokeBookingService((proxy) => proxy.getMyBookings(clientId));
}

/**
 * Reinicia el inventario a su estado inicial disponible (operación de pruebas).
 */
export async function resetSeats() {
  return await invokeBookingService((proxy) => proxy.resetSeats());
}
