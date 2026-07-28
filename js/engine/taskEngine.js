// Plugin-Registry fuer die Consulting-Minispiel-Typen aus Kap. 18
// (Entscheidungsbaum, Prioritaeten-Sortierung, Buzzword-Bingo, Zeitdruck-Quiz).
// Wird ab Phase 1 (Level Duesseldorf) mit konkreten Handlern befuellt.

const registry = new Map();

export function registerTaskType(typeId, handler) {
  registry.set(typeId, handler);
}

export function startTask(taskConfig, onComplete) {
  const handler = registry.get(taskConfig.type);
  if (!handler) {
    console.warn(`Unbekannter Task-Typ: ${taskConfig.type}`);
    onComplete({ ergebnis: "uebersprungen" });
    return;
  }
  handler.init(taskConfig, onComplete);
}
