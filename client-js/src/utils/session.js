/**
 * Módulo de gestión de sesión del cliente web.
 * Genera y persiste un identificador tipo "WEB-XXXXXX" en sessionStorage
 * para conservar los bloqueos activos de la pestaña ante recargas (F5).
 */
const SESSION_KEY = 'icesi_arena_client_id';

export function getClientId() {
  let clientId = sessionStorage.getItem(SESSION_KEY);
  if (!clientId || !clientId.startsWith('WEB-')) {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    clientId = `WEB-${randomSuffix}`;
    sessionStorage.setItem(SESSION_KEY, clientId);
  }
  return clientId;
}

export function resetClientId() {
  sessionStorage.removeItem(SESSION_KEY);
  return getClientId();
}
