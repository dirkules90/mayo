// Erzeugt Multiple-Choice-Quizfragen zum Thema elektrische
// Energieversorgungstechnik/Energiewende (Kap. 18: Zeitdruck-Quiz-
// Aufgabentyp). Fragen kommen bevorzugt von der KI (per Proxy, mit fest
// vorgegebenen Antwortoptionen statt Freitext - vermeidet unzuverlaessige
// KI-Bewertung von Freitextantworten), fallen aber bei fehlendem Provider
// oder Fehlern auf einen statischen Fragenpool zurueck (Kap. 19.5 -
// Spiel bleibt immer vollstaendig spielbar).

import { getProxyUrl } from "../ai/aiConfig.js";
import { getContent } from "../state/contentStore.js";

let fallbackIndex = 0;

export async function generiereQuizFrage(schwierigkeit) {
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) {
    return naechsteFallbackFrage();
  }

  try {
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: baueQuizSystemPrompt(schwierigkeit),
        history: [],
        userMessage: "Erstelle jetzt eine neue Quizfrage.",
      }),
    });

    if (!response.ok) {
      throw new Error(`Proxy antwortete mit Status ${response.status}`);
    }

    const data = await response.json();
    const frage = parseQuizAntwort(data.text);
    if (!frage) {
      throw new Error("Konnte KI-Antwort nicht als Quizfrage lesen");
    }
    return frage;
  } catch (fehler) {
    console.warn("KI-Quizfrage nicht verfuegbar, nutze Fallback-Fragenpool:", fehler);
    return naechsteFallbackFrage();
  }
}

function baueQuizSystemPrompt(schwierigkeit) {
  return `Du erstellst eine einzelne Multiple-Choice-Quizfrage zum Thema elektrische Energieversorgungstechnik und Energiewende (z. B. Netzausbau, Windenergie, Speichertechnologien, Sektorkopplung) fuer ein humorvoll-satirisches Consulting-Spiel. Schwierigkeitsstufe: ${schwierigkeit}. Die Frage muss nicht fachlich perfekt sein, aber glaubwuerdig klingen, gerne mit einem Augenzwinkern Richtung Consulting-Jargon. Halte dich kurz.\n\nAntworte AUSSCHLIESSLICH mit einem JSON-Objekt in genau diesem Format, ohne jeglichen weiteren Text:\n{"frage": "...", "optionen": ["...", "...", "...", "..."], "richtigIndex": 0}\n\nGenau 4 Antwortoptionen, richtigIndex ist der 0-basierte Index der korrekten Antwort.`;
}

function parseQuizAntwort(text) {
  try {
    const bereinigt = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(bereinigt);
    if (
      typeof parsed.frage === "string" &&
      Array.isArray(parsed.optionen) &&
      parsed.optionen.length === 4 &&
      typeof parsed.richtigIndex === "number"
    ) {
      return parsed;
    }
  } catch {
    // ungueltiges JSON - Fallback greift
  }
  return null;
}

function naechsteFallbackFrage() {
  const pool = getContent().quizfragen ?? [];
  if (pool.length === 0) {
    return { frage: "Aktuell ist keine Frage verfuegbar.", optionen: ["OK", "OK", "OK", "OK"], richtigIndex: 0 };
  }
  const frage = pool[fallbackIndex % pool.length];
  fallbackIndex += 1;
  return frage;
}
