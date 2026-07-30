// Ruft den Cloudflare-Worker-Proxy auf (siehe /worker), der wiederum Groq
// mit dem serverseitig gehaltenen API-Key anspricht. Implementiert das
// gemeinsame Provider-Interface generateNpcReply (Kap. 19).

export function groqProvider(proxyUrl) {
  return {
    async generateNpcReply({ npc, spielerNachricht, historie = [], konversationsKontext = null }) {
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: baueSystemPrompt(npc, konversationsKontext),
          history: historie,
          userMessage: spielerNachricht,
        }),
      });

      if (!response.ok) {
        throw new Error(`Proxy antwortete mit Status ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        beziehungswertAenderung: data.beziehungswertAenderung ?? 0,
      };
    },
  };
}

// Globale Kuerze-Regel: gilt fuer JEDE KI-Antwort im gesamten Spiel, egal
// welche NPC-Persona gerade spricht - unabhaengig davon, was im einzelnen
// chatPersonaPrompt steht.
const KUERZE_REGEL =
  "Halte dich unbedingt kurz: maximal 2-3 kurze Saetze, wie eine echte Chat-Nachricht. Keine langen Absaetze.";

function baueSystemPrompt(npc, konversationsKontext) {
  let prompt = `${npc.chatPersonaPrompt}\n\n${KUERZE_REGEL}`;

  if (konversationsKontext) {
    const { gespraechsziel, aktuelleRunde, maxAustausche, istLetzteRunde } = konversationsKontext;
    prompt += `\n\nGespraechsziel dieser Szene: ${gespraechsziel}\nDies ist Austausch ${aktuelleRunde} von ${maxAustausche}.`;
    if (istLetzteRunde) {
      prompt += " Dies ist der letzte Austausch - leite jetzt natuerlich zu einem Abschluss/Abschied ueber.";
    }
  }

  prompt += `\n\nGib am Ende deiner Antwort zusaetzlich ein JSON-Objekt zurueck mit dem Feld "beziehungswert_aenderung" (Zahl zwischen -5 und 5), das widerspiegelt, wie die Nachricht des Spielers die Beziehung veraendert.`;
  return prompt;
}
