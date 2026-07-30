// Handy/Kontakte-System (Nutzer-Wunsch, angelehnt an Kap. 6
// "Zwischenereignisse" und Kap. 19 KI-Chat). Random-NPCs oder Story-NPCs
// werden zu Kontakten, sobald man sie im Level anspricht; danach kann man
// ihnen jederzeit per Handy schreiben. Nutzt fuer Chat-Historie und
// KI-Anbindung dieselbe Pipeline wie das Szenen-Dialogsystem
// (aiChat.requestAiReply), damit ein Kontakt sich an persoenliche
// Gespraeche UND SMS gleichermassen "erinnert".

import { getState, notifyStateChanged } from "../state/gameState.js";
import { emit } from "../state/eventBus.js";
import { getNpc } from "../state/contentStore.js";
import { requestAiReply } from "../dialog/aiChat.js";
import { changeBeziehungswert } from "./relationships.js";

export function fuegeKontaktHinzu(npcId) {
  const state = getState();
  if (!state.kontakte.includes(npcId)) {
    state.kontakte.push(npcId);
    notifyStateChanged();
  }
}

export function istKontakt(npcId) {
  return getState().kontakte.includes(npcId);
}

// Scriptgetriggerte/ambiente Nachricht (z. B. Ramsis Begruessung in
// Duesseldorf), die als Handy-Benachrichtigung eintrifft, ohne dass der
// Spieler etwas geschrieben hat.
export function empfangeNachricht(npcId, text) {
  fuegeKontaktHinzu(npcId);
  const state = getState();
  const historie = state.npcChatHistory[npcId] ?? [];
  historie.push({ role: "assistant", content: text });
  state.npcChatHistory[npcId] = historie.slice(-10);
  notifyStateChanged();

  const npc = getNpc(npcId);
  emit("phone:neue_nachricht", { npcId, npcName: npc?.name ?? "Unbekannt", text });
}

// Spieler schreibt einem Kontakt - laeuft ueber dieselbe KI-Anbindung wie
// Szenen-Dialoge (inkl. Fallback, falls kein Provider konfiguriert ist).
export async function sendeNachricht(npcId, text) {
  const npc = getNpc(npcId);
  const antwort = await requestAiReply(npc, text, `${npc?.name ?? "Der Kontakt"} antwortet gerade nicht.`);
  if (npc) {
    changeBeziehungswert(npc.id, antwort.beziehungswertAenderung ?? 0);
  }
  emit("phone:antwort", { npcId, antwort });
  return antwort;
}
