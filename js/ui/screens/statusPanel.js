// Permanente Statusanzeige: Geld, Reputation, Status, Tag/Slot (Kap. 20.2).

import { getState } from "../../state/gameState.js";
import { on } from "../../state/eventBus.js";

export function initStatusPanel(container) {
  render();
  on("state:changed", render);

  function render() {
    const state = getState();
    container.innerHTML = `
      <span class="status-item" title="Geld">Geld: ${state.geld.toLocaleString("de-DE")} €</span>
      <span class="status-item" title="Reputation">Reputation: ${state.reputation}/100</span>
      <span class="status-item" title="Status">Status: ${state.status}/100</span>
      <span class="status-item" title="Tag & Zeit-Slot">Tag ${state.aktuellerTag} – ${grossBuchstabe(state.aktuellerSlot)}</span>
    `;
  }
}

function grossBuchstabe(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
