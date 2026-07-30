// Aufloesung, welcher KI-Provider aktuell genutzt werden soll.
//
// Sicherheitsprinzip (Kap. 28/32): Das Spiel ist eine rein statische
// GitHub-Pages-Seite ohne eigenen Server. Der Groq-API-Key darf deshalb
// NIEMALS direkt im Frontend-Code oder Repo liegen. Stattdessen ruft das
// Spiel einen kleinen Cloudflare-Worker-Proxy auf (siehe /worker), der den
// Key serverseitig als Secret haelt - PROXY_URL unten ist die oeffentliche
// URL dieses Workers, kein Geheimnis.
//
// Solange PROXY_URL leer ist, liefert getProvider() null zurueck, und
// dialogSystem.js/aiChat.js greifen ausschliesslich auf die statischen
// Fallback-Dialoge zurueck (Kap. 19.5 - das Spiel bleibt so immer
// vollstaendig spielbar, auch ohne KI-Anbindung).

import { groqProvider } from "./providers/groqProvider.js";

const PROXY_URL = "https://mayo-ai-proxy.dirk-baumeister.workers.dev/";

export function getProvider() {
  if (!PROXY_URL) {
    return null;
  }
  return groqProvider(PROXY_URL);
}
