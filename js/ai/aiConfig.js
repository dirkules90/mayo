// Aufloesung, welcher KI-Provider aktuell genutzt werden soll.
//
// WICHTIG (siehe Lastenheft Kap. 28/32 und Architektur-Entscheidung mit dem
// Nutzer): Das Spiel ist eine rein statische GitHub-Pages-Seite ohne eigenen
// Server. Ein Anbieter-Key darf deshalb NIEMALS direkt im Frontend-Code oder
// Repo liegen - er waere fuer jeden Besucher im Quelltext/Netzwerk-Tab
// sichtbar. Die gewaehlte Loesung: ein kleiner serverloser Proxy (Cloudflare
// Worker o.ae.) haelt den echten Key serverseitig als Secret; das Frontend
// ruft nur die Proxy-URL auf. Wird in Phase 2 implementiert (js/ai/providers/
// groqProvider.js ruft dann PROXY_URL statt die Anbieter-API direkt auf).
//
// Bis Phase 2 liefert getProvider() bewusst null zurueck, damit
// dialogSystem.js/aiChat.js ausschliesslich auf die statischen
// Fallback-Dialoge zurueckgreifen (Kap. 19.5 - das Spiel muss auch ohne
// KI-Anbindung vollstaendig funktionsfaehig sein).

export function getProvider() {
  return null;
}
