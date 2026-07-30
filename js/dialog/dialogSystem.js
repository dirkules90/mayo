// Statischer Dialogbaum-Runner (Kap. 19/33): laeuft JSON-Dialogbaeume durch,
// wendet Effekte an und uebergibt bei Freitext-Optionen an aiChat.js.
// Dieselbe Engine wird spaeter fuer alle Staedte/NPCs wiederverwendet -
// neue Dialoge sind reine Content-Aenderungen in data/dialogues/*.json.

import { getContent, getNpc } from "../state/contentStore.js";
import { addReputation, addGeld, spendGeld } from "../engine/economy.js";
import { changeBeziehungswert } from "../engine/relationships.js";
import { setFlag } from "../state/gameState.js";
import { emit } from "../state/eventBus.js";
import { requestAiReply } from "./aiChat.js";

let aktiverBaum = null;
let aktiveNode = null;
let onDialogEnde = null;
let aktiveKiKonversation = null;

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

// Ein Node mit "gespraechsziel" ist eine mehrstufige KI-Konversation (Kap.
// 19): JEDE Option (egal ob vorgefertigter Button oder Freitext) startet
// dieselbe Runden-Schleife, statt einzelne Optionen direkt zum naechsten
// Node springen zu lassen.
export function waehleOption(index) {
  if (aktiveKiKonversation) return;
  const auswahl = aktiveNode.optionen[index];
  emit("dialog:spieler_nachricht", auswahl.label);
  wendeEffekteAn(auswahl.effekte);

  if (aktiveNode.gespraechsziel) {
    starteKiKonversation(auswahl.label);
    return;
  }

  geheWeiterZu(auswahl.naechster);
}

export async function sendeFreitext(text) {
  emit("dialog:spieler_nachricht", text);

  if (aktiveKiKonversation) {
    await fuehreKiKonversationsRundeAus(text);
    return;
  }

  if (aktiveNode.gespraechsziel) {
    await starteKiKonversation(text);
    return;
  }

  // Einweg-Antwort (kein Gespraechsziel auf dem Node hinterlegt): eine
  // Antwort, dann weiter - fuer einfache, nicht-konversationelle Szenen.
  const freitextOption = aktiveNode.optionen.find((option) => option.typ === "freitext");
  const npc = getNpc(aktiveNode.sprecher);
  const antwort = await requestAiReply(npc, text, freitextOption?.fallback);
  emit("dialog:ai_antwort", antwort);
  if (npc) {
    changeBeziehungswert(npc.id, antwort.beziehungswertAenderung ?? 0);
  }
  geheWeiterZu(freitextOption?.naechster);
}

function starteKiKonversation(ersteNachricht) {
  const npc = getNpc(aktiveNode.sprecher);
  const freitextOption = aktiveNode.optionen?.find((option) => option.typ === "freitext");
  aktiveKiKonversation = {
    npc,
    gespraechsziel: aktiveNode.gespraechsziel,
    maxAustausche: aktiveNode.maxAustausche ?? 3,
    aktuelleRunde: 0,
    naechsterNodeId: aktiveNode.naechster,
    fallback: aktiveNode.fallback || freitextOption?.fallback,
  };
  return fuehreKiKonversationsRundeAus(ersteNachricht);
}

// Mehrstufige KI-Konversation (Kap. 19): laeuft bis zu maxAustausche Runden,
// bevor sie natuerlich zum naechsten Dialog-Node ueberleitet. Bricht bei
// einem Fallback (KI nicht erreichbar) sofort ab, statt denselben
// statischen Text mehrfach zu wiederholen.
async function fuehreKiKonversationsRundeAus(text) {
  const konversation = aktiveKiKonversation;
  konversation.aktuelleRunde += 1;
  const istLetzteRunde = konversation.aktuelleRunde >= konversation.maxAustausche;

  const antwort = await requestAiReply(konversation.npc, text, konversation.fallback, {
    gespraechsziel: konversation.gespraechsziel,
    aktuelleRunde: konversation.aktuelleRunde,
    maxAustausche: konversation.maxAustausche,
    istLetzteRunde,
  });

  emit("dialog:ai_antwort", antwort);
  if (konversation.npc) {
    changeBeziehungswert(konversation.npc.id, antwort.beziehungswertAenderung ?? 0);
  }

  if (istLetzteRunde || antwort.viaFallback) {
    const naechsterNodeId = konversation.naechsterNodeId;
    aktiveKiKonversation = null;
    geheWeiterZu(naechsterNodeId);
  } else {
    emit("dialog:freitext_erwartet");
  }
}

export function bestaetigeEnde() {
  beendeDialog();
}

// Generischer "Kauf"-Node (z. B. Promotionsfeier, spaeter Shop-Items):
// zieht den Preis vom liquiden Geld ab und geht erst bei Erfolg weiter
// (Kap. 13 Bankrott-Mechanik - reicht das Geld nicht, bleibt der Spieler
// auf dem Node stehen).
export function bestaetigeKauf() {
  const node = aktiveNode;
  const erfolgreich = spendGeld(node.preis);
  if (!erfolgreich) {
    emit("dialog:kauf_fehlgeschlagen", node.preis);
    return;
  }
  geheWeiterZu(node.naechster);
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
  aktiveKiKonversation = null;
  emit("dialog:ende");
  if (callback) callback();
}
