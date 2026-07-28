// Orchestriert KI-Chat-Anfragen (Kap. 19). Kennt keinen konkreten Anbieter,
// sondern spricht ausschliesslich mit der providers/*-Schnittstelle
// (generateNpcReply). Faellt bei fehlendem Provider oder Fehlern immer auf
// den in den Dialog-Daten hinterlegten statischen Text zurueck.

import { getProvider } from "../ai/aiConfig.js";

const STANDARD_FALLBACK = "Mayo nuschelt etwas Unverstaendliches und wechselt schnell das Thema.";

export async function requestAiReply(npc, spielerNachricht, fallbackText) {
  const provider = getProvider();
  if (!provider) {
    return { text: fallbackText || STANDARD_FALLBACK, beziehungswertAenderung: 0, viaFallback: true };
  }
  try {
    return await provider.generateNpcReply({ npc, spielerNachricht });
  } catch (fehler) {
    console.warn("KI-Chat nicht erreichbar, nutze Fallback-Dialog:", fehler);
    return { text: fallbackText || STANDARD_FALLBACK, beziehungswertAenderung: 0, viaFallback: true };
  }
}
