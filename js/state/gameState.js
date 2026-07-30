// Zentrales, serialisierbares gameState-Objekt (Lastenheft Kap. 21.2 / 22.1).
// Nur economy.js, relationships.js und timeSystem.js mutieren den State direkt;
// alle anderen Module lesen über getState() und reagieren auf "state:changed".

import { emit } from "./eventBus.js";

const SAVE_VERSION = 1;

function erzeugeStandardState() {
  return {
    saveVersion: SAVE_VERSION,
    aktuellesLevel: "wuppertal_prolog",
    aktuellerTag: 1,
    aktuellerSlot: "vormittag",
    geld: 2500,
    vermoegen: 0,
    reputation: 50,
    status: 20,
    inventar: [],
    npcBeziehungen: {},
    npcChatHistory: {},
    kontakte: [],
    kartenPosition: null,
    levelFortschritt: {},
    eventFlags: {},
    currentEnding: null,
  };
}

let state = erzeugeStandardState();

export function getState() {
  return state;
}

export function resetState() {
  state = erzeugeStandardState();
  emit("state:changed", state);
  return state;
}

export function loadState(gespeicherterState) {
  state = { ...erzeugeStandardState(), ...gespeicherterState };
  emit("state:changed", state);
  return state;
}

export function setFlag(flagName, wert = true) {
  state.eventFlags[flagName] = wert;
  emit("state:changed", state);
}

export function hasFlag(flagName) {
  return Boolean(state.eventFlags[flagName]);
}

export function notifyStateChanged() {
  emit("state:changed", state);
}

// Zentraler Level-Wechsel (z. B. Prolog -> Duesseldorf): setzt Level, Tag
// und Slot zurueck und informiert alle Module.
export function wechsleLevel(neuesLevelId, startTag = 1, startSlot = "vormittag") {
  state.aktuellesLevel = neuesLevelId;
  state.aktuellerTag = startTag;
  state.aktuellerSlot = startSlot;
  emit("state:changed", state);
  emit("level:gewechselt", neuesLevelId);
}
