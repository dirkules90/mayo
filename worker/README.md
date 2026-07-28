# MAYO – KI-Chat-Proxy (Cloudflare Worker)

Dieser kleine Worker haelt den Groq-API-Key serverseitig versteckt. Das
Spiel (statische GitHub-Pages-Seite) ruft ausschliesslich diesen Worker
auf; der eigentliche Groq-Key verlaesst nie Cloudflares Server und taucht
im ausgelieferten Frontend-Code nirgends auf.

## Einmaliges Deployment (Dashboard, ohne CLI)

1. Auf [dash.cloudflare.com](https://dash.cloudflare.com) einloggen bzw.
   kostenlosen Account anlegen.
2. Im Menü **Workers & Pages** → **Create** → **Create Worker**.
3. Einen Namen vergeben (z. B. `mayo-ai-proxy`) und erstellen lassen.
4. Im Worker auf **Edit code** (Quick Edit) gehen und den kompletten
   Inhalt von `worker/src/index.js` aus diesem Repo einfügen (die
   automatisch generierte Beispieldatei komplett ersetzen).
5. **Deploy** klicken.
6. Zurück in den Worker-Settings: **Settings → Variables and Secrets** →
   **Add** → Name `GROQ_API_KEY`, Typ **Secret**, Wert = dein Groq-API-Key
   → speichern. (Falls die Umgebung nach dem Hinzufügen ein erneutes
   Deploy verlangt, einmal auf **Deploy** klicken.)
7. Die öffentliche Worker-URL kopieren (Format
   `https://mayo-ai-proxy.<dein-subdomain>.workers.dev`) und mir schicken
   – ich trage sie dann in `js/ai/aiConfig.js` ein.

## Alternative: Deployment via Wrangler-CLI

```bash
cd worker
npx wrangler login
npx wrangler secret put GROQ_API_KEY   # fragt den Wert interaktiv ab
npx wrangler deploy
```

## Sicherheitshinweise

- CORS ist im Worker-Code (`ALLOWED_ORIGIN`) fest auf
  `https://dirkules90.github.io` beschränkt, damit nicht beliebige andere
  Webseiten diesen Proxy (und damit deinen Groq-Key indirekt) missbrauchen
  können.
- Der Worker validiert Nachrichtenlänge und erzwingt ein Token-Limit
  (`MAX_TOKENS`), damit einzelne Anfragen nicht unbegrenzt teuer werden
  können.
- Ändert sich die GitHub-Pages-URL (z. B. bei einem eigenen Domain-Setup),
  muss `ALLOWED_ORIGIN` im Worker-Code entsprechend angepasst und neu
  deployt werden.
