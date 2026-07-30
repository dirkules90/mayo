// Nebenauftraege (Energiewende-Quiz, Kap. 18) als Geldquelle bei
// Geldmangel (Nutzer-Wunsch: Kontakte bei Stadtwerken anschreiben und
// nach Auftraegen fragen). Begrenzt auf eine feste Anzahl pro Spieltag,
// danach "aktuell keine Auftraege" bis zum naechsten Tag.

import { getState, notifyStateChanged } from "../state/gameState.js";
import { addGeld, addReputation } from "./economy.js";

const MAX_AUFTRAEGE_PRO_TAG = 2;

export const SCHWIERIGKEITEN = {
  leicht: { label: "Leicht", anzahlFragen: 3, belohnungProRichtig: 50 },
  mittel: { label: "Mittel", anzahlFragen: 5, belohnungProRichtig: 100 },
  schwer: { label: "Schwer", anzahlFragen: 7, belohnungProRichtig: 150 },
};

function synchronisiereTag() {
  const state = getState();
  if (state.auftraege.letzterTag !== state.aktuellerTag) {
    state.auftraege.letzterTag = state.aktuellerTag;
    state.auftraege.heuteErledigt = 0;
    notifyStateChanged();
  }
}

export function sindAuftraegeVerfuegbar() {
  synchronisiereTag();
  return getState().auftraege.heuteErledigt < MAX_AUFTRAEGE_PRO_TAG;
}

export function verbleibendeAuftraege() {
  synchronisiereTag();
  return MAX_AUFTRAEGE_PRO_TAG - getState().auftraege.heuteErledigt;
}

// Wertet eine abgeschlossene Quiz-Runde aus: Geld nach Trefferquote und
// Schwierigkeit, kleiner Reputationsbonus bei perfekter Runde.
export function schliesseAuftragAb({ richtigeAntworten, gesamtFragen, belohnungProRichtig }) {
  const belohnung = richtigeAntworten * belohnungProRichtig;
  addGeld(belohnung);
  if (richtigeAntworten === gesamtFragen) {
    addReputation(2);
  }

  const state = getState();
  state.auftraege.heuteErledigt += 1;
  notifyStateChanged();

  return belohnung;
}
