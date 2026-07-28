// Statischer Dialogbaum-Runner (Kap. 19/33): laeuft JSON-Dialogbaeume durch,
// wendet Effekte an und uebergibt bei Freitext-Optionen an aiChat.js.
// Dieselbe Engine wird spaeter fuer alle Staedte/NPCs wiederverwendet -
// neue Dialoge sind reine Content-Aenderungen in data/dialogues/*.json.

import { getContent, getNpc } from "../state/contentStore.js";
import { addReputation, addGeld } from "../engine/economy.js";
import { changeBeziehungswert } from "../engine/relationships.js";
import { setFlag } from "../state/gameState.js";
import { emit } from "../state/eventBus.js";
import { requestAiReply } from "./aiChat.js";

let aktiverBaum = null;
let aktiveNode = null;
let onDialogEnde = null;

export function starteDialog(levelId, baumId, callbackBeiEnde) {
  const dialoge = getContent().dialogues[levelId];
  aktiverBaum = dialoge?.[baumId];
  if (!aktiverBaum) {
    console.error(`Dialogbaum "${baumId}" nicht gefunden in Level "${levelId}"`);
    if (callbackBeiEnde) callbackBeiEnde();
    return;
  }
  onDialogEnde = callbackBeiEnde;
  zeigeNode(aktiverBaum.startNode);
}

function zeigeNode(nodeId) {
  aktiveNode = aktiverBaum.nodes[nodeId];
  if (!aktiveNode) {
    console.error(`Dialog-Node "${nodeId}" nicht gefunden`);
    beendeDialog();
    return;
  }
  if (aktiveNode.typ === "ende" && aktiveNode.onEnde) {
    wendeEffekteAn(aktiveNode.onEnde);
  }
  emit("dialog:node", aktiveNode);
}

export function waehleOption(index) {
  const auswahl = aktiveNode.optionen[index];
  wendeEffekteAn(auswahl.effekte);
  geheWeiterZu(auswahl.naechster);
}

export async function sendeFreitext(text) {
  const freitextOption = aktiveNode.optionen.find((option) => option.typ === "freitext");
  const npc = getNpc(aktiveNode.sprecher);
  const antwort = await requestAiReply(npc, text, freitextOption?.fallback);
  emit("dialog:ai_antwort", antwort);
  if (npc) {
    changeBeziehungswert(npc.id, antwort.beziehungswertAenderung ?? 0);
  }
  geheWeiterZu(freitextOption?.naechster);
}

export function bestaetigeEnde() {
  beendeDialog();
}

function geheWeiterZu(naechsterNodeId) {
  if (naechsterNodeId) {
    zeigeNode(naechsterNodeId);
  } else {
    beendeDialog();
  }
}

function wendeEffekteAn(effekte = {}) {
  for (const [schluessel, wert] of Object.entries(effekte)) {
    if (schluessel === "reputation") {
      addReputation(wert);
    } else if (schluessel === "geld") {
      addGeld(wert);
    } else if (schluessel.startsWith("beziehung:")) {
      changeBeziehungswert(schluessel.split(":")[1], wert);
    } else if (schluessel.startsWith("flag:")) {
      setFlag(schluessel.split(":")[1], Boolean(wert));
    }
  }
}

function beendeDialog() {
  const callback = onDialogEnde;
  aktiverBaum = null;
  aktiveNode = null;
  onDialogEnde = null;
  emit("dialog:ende");
  if (callback) callback();
}
