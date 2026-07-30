// Orchestriert KI-Chat-Anfragen (Kap. 19). Kennt keinen konkreten Anbieter,
// sondern spricht ausschliesslich mit der providers/*-Schnittstelle
// (generateNpcReply). Faellt bei fehlendem Provider oder Fehlern immer auf
// den in den Dialog-Daten hinterlegten statischen Text zurueck. Haelt
// zusaetzlich die Chat-Historie pro NPC im gameState (Kap. 19.5), gekuerzt
// auf die letzten Nachrichten, um das Tokenlimit einzuhalten.

import { getProvider } from "../ai/aiConfig.js";
import { getState, notifyStateChanged } from "../state/gameState.js";

const STANDARD_FALLBACK = "Mayo nuschelt etwas Unverstaendliches und wechselt schnell das Thema.";
const MAX_HISTORY_MESSAGES = 10;

export async function requestAiReply(npc, spielerNachricht, fallbackText, konversationsKontext = null) {
  const provider = getProvider();
  if (!provider) {
    return { text: fallbackText || STANDARD_FALLBACK, beziehungswertAenderung: 0, viaFallback: true };
  }

  const state = getState();
  const historie = state.npcChatHistory[npc.id] ?? [];

  try {
    const antwort = await provider.generateNpcReply({ npc, spielerNachricht, historie, konversationsKontext });
    aktualisiereHistorie(npc.id, spielerNachricht, antwort.text);
    return { ...antwort, viaFallback: false };
  } catch (fehler) {
    console.warn("KI-Chat nicht erreichbar, nutze Fallback-Dialog:", fehler);
    return { text: fallbackText || STANDARD_FALLBACK, beziehungswertAenderung: 0, viaFallback: true };
  }
}

function aktualisiereHistorie(npcId, spielerNachricht, npcAntwort) {
  const state = getState();
  const historie = state.npcChatHistory[npcId] ?? [];
  historie.push({ role: "user", content: spielerNachricht }, { role: "assistant", content: npcAntwort });
  state.npcChatHistory[npcId] = historie.slice(-MAX_HISTORY_MESSAGES);
  notifyStateChanged();
}
