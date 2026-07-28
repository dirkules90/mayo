// Speicherstaende (Kap. 26): kompletter gameState als JSON in localStorage,
// 3 Slots, kein Backend/Cloud-Sync noetig.

import { getState, loadState } from "../state/gameState.js";

const STORAGE_PREFIX = "mayo_save_slot_";
export const ANZAHL_SLOTS = 3;

export function speichereSpiel(slot = 1) {
  const state = getState();
  localStorage.setItem(`${STORAGE_PREFIX}${slot}`, JSON.stringify(state));
}

export function ladeSpiel(slot = 1) {
  const roh = localStorage.getItem(`${STORAGE_PREFIX}${slot}`);
  if (!roh) return false;
  try {
    loadState(JSON.parse(roh));
    return true;
  } catch (fehler) {
    console.error("Speicherstand konnte nicht gelesen werden:", fehler);
    return false;
  }
}

export function hatSpeicherstand(slot = 1) {
  return localStorage.getItem(`${STORAGE_PREFIX}${slot}`) !== null;
}

export function loescheSpeicherstand(slot = 1) {
  localStorage.removeItem(`${STORAGE_PREFIX}${slot}`);
}
