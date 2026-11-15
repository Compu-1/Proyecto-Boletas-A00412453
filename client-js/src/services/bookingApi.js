/**
 * Fachada de operaciones RPC contra el servidor ZeroC Ice.
 * Consume el proxy obtenido por iceClient.js y provee funciones asíncronas tipadas.
 */
import { getBookingServiceProxy } from './iceClient.js';
import { BookingApp } from '../generated/BookingService.js';

export { BookingApp };

/**
 * Consulta la información general del evento y los contadores de aforo.
 */
export async function getEventInfo() {
  const proxy = await getBookingServiceProxy();
  return await proxy.getEventInfo();
}

/**
 * Obtiene el inventario completo de las 90 sillas.
 */
export async function getAllSeats() {
  const proxy = await getBookingServiceProxy();
  return await proxy.getAllSeats();
}

/**
 * Consulta las sillas pertenecientes a una zona específica (VIP, Platea, General).
 */
export async function getSeatsByZone(zone) {
  const proxy = await getBookingServiceProxy();
  return await proxy.getSeatsByZone(zone);
}

/**
 * Consulta el estado detallado de una silla específica por su ID (ej. "A-1").
 */
export async function getSeat(seatId) {
  const proxy = await getBookingServiceProxy();
  return await proxy.getSeat(seatId);
}

/**
 * Solicita el bloqueo temporal de una silla para el cliente actual.
 */
export async function lockSeat(seatId, clientId) {
  const proxy = await getBookingServiceProxy();
  return await proxy.lockSeat(seatId, clientId);
}

/**
 * Libera una silla previamente bloqueada por el cliente.
 */
export async function releaseSeat(seatId, clientId) {
  const proxy = await getBookingServiceProxy();
  return await proxy.releaseSeat(seatId, clientId);
}

/**
 * Confirma la compra definitiva de un conjunto de sillas bloqueadas ("Todo o Nada").
 */
export async function confirmBooking(seatIds, clientId, customerName, customerEmail) {
  const proxy = await getBookingServiceProxy();
  return await proxy.confirmBooking(seatIds, clientId, customerName, customerEmail);
}

/**
 * Consulta las sillas que se encuentran actualmente bloqueadas por este cliente.
 */
export async function getMyLockedSeats(clientId) {
  const proxy = await getBookingServiceProxy();
  return await proxy.getMyLockedSeats(clientId);
}

/**
 * Consulta el historial de compras confirmadas de este cliente.
 */
export async function getMyBookings(clientId) {
  const proxy = await getBookingServiceProxy();
  return await proxy.getMyBookings(clientId);
}

/**
 * Reinicia el inventario a su estado inicial disponible (operación de pruebas).
 */
export async function resetSeats() {
  const proxy = await getBookingServiceProxy();
  return await proxy.resetSeats();
}
