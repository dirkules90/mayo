// Wertet am Ende von Level 4 (Ibiza) die Endings-Tabelle aus Kap. 25.2 aus.
// Wird in Phase 4 implementiert, sobald data/endings.json befuellt ist.

import { getContent } from "../state/contentStore.js";
import { getState } from "../state/gameState.js";

export function evaluateEnding() {
  const state = getState();
  const endings = getContent().endings ?? [];
  for (const ending of endings) {
    if (erfuelltBedingung(ending.bedingung, state)) {
      return ending.id;
    }
  }
  return null;
}

function erfuelltBedingung(bedingung, state) {
  if (!bedingung) return false;
  return Object.entries(bedingung).every(([pfad, grenze]) => {
    const wert = pfad.split(".").reduce((obj, schluessel) => obj?.[schluessel], state);
    return typeof wert === "number" && wert >= grenze;
  });
}
