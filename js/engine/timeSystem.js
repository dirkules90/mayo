// Zeit-Slot-System (Kap. 12): Vormittag -> Nachmittag -> Abend -> naechster Tag.

import { getState, notifyStateChanged } from "../state/gameState.js";
import { emit } from "../state/eventBus.js";

const SLOT_REIHENFOLGE = ["vormittag", "nachmittag", "abend"];

export function advanceSlot() {
  const state = getState();
  const index = SLOT_REIHENFOLGE.indexOf(state.aktuellerSlot);
  if (index < SLOT_REIHENFOLGE.length - 1) {
    state.aktuellerSlot = SLOT_REIHENFOLGE[index + 1];
  } else {
    state.aktuellerSlot = SLOT_REIHENFOLGE[0];
    state.aktuellerTag += 1;
    emit("day:end", { tag: state.aktuellerTag - 1 });
  }
  notifyStateChanged();
  emit("slot:changed", { tag: state.aktuellerTag, slot: state.aktuellerSlot });
}

// Prueft, ob am letzten Tag eines Levels noch Teilaufgaben offen sind
// (Kap. 12: verpasste Deadline senkt Reputation, loest Krisen-Event aus).
export function checkDeadline(level) {
  const state = getState();
  const fortschritt = state.levelFortschritt[level.id];
  if (!fortschritt) return;
  const istLetzterTag = state.aktuellerTag >= level.tageGesamt;
  const unvollstaendig = fortschritt.teilaufgabenErledigt < fortschritt.teilaufgabenGesamt;
  if (istLetzterTag && unvollstaendig && state.aktuellerSlot === "abend") {
    emit("deadline:missed", { level: level.id });
  }
}
