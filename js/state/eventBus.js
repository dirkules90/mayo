// Minimaler Pub/Sub-Bus, über den alle Module lose gekoppelt kommunizieren.
// Business-Logik (economy, relationships, timeSystem, ...) feuert Events,
// UI-Module hören zu und rendern neu - keine direkten Modul-zu-Modul-Aufrufe.

const listeners = new Map();

export function on(eventName, handler) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }
  listeners.get(eventName).add(handler);
  return () => off(eventName, handler);
}

export function off(eventName, handler) {
  listeners.get(eventName)?.delete(handler);
}

export function emit(eventName, payload) {
  listeners.get(eventName)?.forEach((handler) => handler(payload));
}
