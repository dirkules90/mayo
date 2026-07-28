// Ruft den Cloudflare-Worker-Proxy auf (siehe /worker), der wiederum Groq
// mit dem serverseitig gehaltenen API-Key anspricht. Implementiert das
// gemeinsame Provider-Interface generateNpcReply (Kap. 19).

export function groqProvider(proxyUrl) {
  return {
    async generateNpcReply({ npc, spielerNachricht, historie = [] }) {
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: baueSystemPrompt(npc),
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

function baueSystemPrompt(npc) {
  return `${npc.chatPersonaPrompt}\n\nGib am Ende deiner Antwort zusaetzlich ein JSON-Objekt zurueck mit dem Feld "beziehungswert_aenderung" (Zahl zwischen -5 und 5), das widerspiegelt, wie die Nachricht des Spielers die Beziehung veraendert.`;
}
