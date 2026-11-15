function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (value && typeof value.toNumber === 'function') {
    const number = value.toNumber();
    return Number.isFinite(number) ? number : null;
  }

  return null;
}

export function getSeatExpiresAt(seat) {
  const expiresAt = toNumber(seat.expiresAt);
  if (expiresAt !== null) {
    return expiresAt;
  }

  const lockTimestamp = toNumber(seat.lockTimestamp);
  const lockDurationSeconds = toNumber(seat.lockDurationSeconds);
  if (lockTimestamp === null || lockDurationSeconds === null) {
    return null;
  }

  return lockTimestamp + lockDurationSeconds * 1000;
}

export function formatRemainingTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}
