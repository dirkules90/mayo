// Einziger Ort, der Geld/Vermoegen/Reputation/Status veraendert (Kap. 13, 15).

import { getState, notifyStateChanged } from "../state/gameState.js";
import { emit } from "../state/eventBus.js";

export function addGeld(betrag) {
  const state = getState();
  state.geld += betrag;
  notifyStateChanged();
  emit("economy:geld_changed", state.geld);
}

export function canAfford(betrag) {
  return getState().geld >= betrag;
}

export function spendGeld(betrag) {
  if (!canAfford(betrag)) {
    return false;
  }
  addGeld(-betrag);
  return true;
}

export function addVermoegen(betrag) {
  const state = getState();
  state.vermoegen += betrag;
  recalculateStatus();
  notifyStateChanged();
}

export function addReputation(delta) {
  const state = getState();
  state.reputation = Math.max(0, Math.min(100, state.reputation + delta));
  recalculateStatus();
  notifyStateChanged();
}

// Status ergibt sich aus Vermoegen (gestaucht, damit er nicht unbegrenzt
// waechst) + Reputation (Kap. 15).
export function recalculateStatus() {
  const state = getState();
  const vermoegenAnteil = Math.min(60, Math.floor(state.vermoegen / 1000));
  const reputationAnteil = Math.round(state.reputation * 0.4);
  state.status = Math.max(0, Math.min(100, vermoegenAnteil + reputationAnteil));
}

export function buyItem(item) {
  if (!spendGeld(item.preis)) {
    return false;
  }
  const state = getState();
  state.inventar.push(item.id);
  addVermoegen(item.vermoegenswert || 0);
  return true;
}
