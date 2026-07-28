// Einziger Ort, der Beziehungswerte veraendert (Kap. 15).

import { getState, notifyStateChanged } from "../state/gameState.js";
import { emit } from "../state/eventBus.js";

export const BEZIEHUNGSSTUFEN = ["neutral", "kollegial", "vertraut", "romantisch", "eskaliert"];

export function getBeziehungswert(npcId) {
  return getState().npcBeziehungen[npcId] ?? 0;
}

export function getBeziehungsstufe(npcId) {
  const wert = getBeziehungswert(npcId);
  if (wert >= 80) return "eskaliert";
  if (wert >= 60) return "romantisch";
  if (wert >= 35) return "vertraut";
  if (wert >= 15) return "kollegial";
  return "neutral";
}

export function changeBeziehungswert(npcId, delta) {
  if (!delta) return;
  const state = getState();
  const aktuell = state.npcBeziehungen[npcId] ?? 0;
  state.npcBeziehungen[npcId] = Math.max(0, Math.min(100, aktuell + delta));
  notifyStateChanged();
  emit("relationship:changed", { npcId, wert: state.npcBeziehungen[npcId] });
}
