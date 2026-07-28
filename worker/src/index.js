// Cloudflare Worker: haelt den Groq-API-Key serverseitig als Secret und
// reicht Chat-Anfragen des Spiels an Groq weiter. Der Key steht NIEMALS im
// Frontend-Code - nur die (oeffentliche) URL dieses Workers wird im Spiel
// hinterlegt (siehe js/ai/aiConfig.js).
//
// Deployment-Anleitung: worker/README.md

const ALLOWED_ORIGIN = "https://dirkules90.github.io";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_USER_MESSAGE_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 10;
const MAX_TOKENS = 300;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "Nur POST erlaubt" }, 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Ungueltiges JSON" }, 400, origin);
    }

    const { systemPrompt, history, userMessage } = body || {};
    if (typeof systemPrompt !== "string" || typeof userMessage !== "string") {
      return jsonResponse({ error: "systemPrompt und userMessage sind erforderlich" }, 400, origin);
    }
    if (userMessage.length > MAX_USER_MESSAGE_LENGTH) {
      return jsonResponse({ error: "Nachricht zu lang" }, 400, origin);
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-MAX_HISTORY_MESSAGES) : []),
      { role: "user", content: userMessage },
    ];

    let groqResponse;
    try {
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.8,
          max_tokens: MAX_TOKENS,
        }),
      });
    } catch {
      return jsonResponse({ error: "Groq nicht erreichbar" }, 502, origin);
    }

    if (!groqResponse.ok) {
      return jsonResponse({ error: `Groq-Fehler: ${groqResponse.status}` }, 502, origin);
    }

    const data = await groqResponse.json();
    const rawText = data.choices?.[0]?.message?.content ?? "";
    const { text, beziehungswertAenderung } = parseStructuredReply(rawText);

    return jsonResponse({ text, beziehungswertAenderung }, 200, origin);
  },
};

// Entfernt Markdown-Codeblock-Fences und extrahiert das optionale
// abschliessende JSON-Objekt mit "beziehungswert_aenderung" (Kap. 19.4/22.3).
function parseStructuredReply(rawText) {
  const jsonMatch = rawText.match(/\{[^{}]*"beziehungswert_aenderung"[^{}]*\}/);
  let beziehungswertAenderung = 0;
  let text = rawText;

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.beziehungswert_aenderung === "number") {
        beziehungswertAenderung = Math.max(-5, Math.min(5, parsed.beziehungswert_aenderung));
      }
    } catch {
      // ungueltiges JSON im Modell-Output - Fallback bleibt 0
    }
    text = rawText.slice(0, jsonMatch.index).trim();
  }

  return { text: text.replace(/```json|```/g, "").trim(), beziehungswertAenderung };
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(payload, status, origin) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}
