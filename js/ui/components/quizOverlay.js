// Nebenauftrags-Overlay: Schwierigkeitswahl -> Multiple-Choice-Quiz ueber
// Energiewende-Themen -> Ergebnis mit Geld-/Reputationsbelohnung
// (Kap. 18, Nutzer-Wunsch). Vorgefertigte Antwortoptionen - die KI liefert
// nur die Frage inkl. Optionen, keine Freitext-Bewertung noetig.

import { generiereQuizFrage } from "../../engine/quizGenerator.js";
import { SCHWIERIGKEITEN, sindAuftraegeVerfuegbar, verbleibendeAuftraege, schliesseAuftragAb } from "../../engine/auftragsSystem.js";

let containerEl = null;

export function initQuizOverlay(container) {
  containerEl = container;
}

export function starteAuftragsAnfrage() {
  containerEl.hidden = false;
  if (!sindAuftraegeVerfuegbar()) {
    renderKeineAuftraege();
    return;
  }
  renderSchwierigkeitsauswahl();
}

function schliesseOverlay() {
  containerEl.hidden = true;
  containerEl.innerHTML = "";
}

function erzeugeSchliessenBtn() {
  const btn = document.createElement("button");
  btn.textContent = "Schliessen";
  btn.className = "quiz-schliessen-btn";
  btn.addEventListener("click", schliesseOverlay);
  return btn;
}

function renderKeineAuftraege() {
  containerEl.innerHTML = "";
  const box = document.createElement("div");
  box.className = "quiz-box";

  const text = document.createElement("p");
  text.textContent = "Aktuell keine Auftraege verfuegbar. Komm spaeter wieder!";
  box.append(text, erzeugeSchliessenBtn());
  containerEl.appendChild(box);
}

function renderSchwierigkeitsauswahl() {
  containerEl.innerHTML = "";
  const box = document.createElement("div");
  box.className = "quiz-box";

  const titel = document.createElement("h3");
  titel.textContent = "💼 Nebenauftrag: Energiewende-Quiz";
  box.appendChild(titel);

  const hinweis = document.createElement("p");
  hinweis.textContent = `Noch ${verbleibendeAuftraege()} Auftraege heute verfuegbar. Waehle eine Schwierigkeit:`;
  box.appendChild(hinweis);

  Object.entries(SCHWIERIGKEITEN).forEach(([key, config]) => {
    const btn = document.createElement("button");
    btn.className = "quiz-schwierigkeit-btn";
    const maxBelohnung = config.anzahlFragen * config.belohnungProRichtig;

    const label = document.createElement("strong");
    label.textContent = config.label;
    const detail = document.createElement("span");
    detail.textContent = `${config.anzahlFragen} Fragen · bis zu ${maxBelohnung.toLocaleString("de-DE")} €`;

    btn.append(label, detail);
    btn.addEventListener("click", () => starteQuizRunde(key, config));
    box.appendChild(btn);
  });

  box.appendChild(erzeugeSchliessenBtn());
  containerEl.appendChild(box);
}

async function starteQuizRunde(schwierigkeitKey, config) {
  let richtigeAntworten = 0;
  for (let index = 0; index < config.anzahlFragen; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    const richtig = await zeigeFrage(schwierigkeitKey, index + 1, config.anzahlFragen);
    if (richtig) {
      richtigeAntworten += 1;
    }
  }

  const belohnung = schliesseAuftragAb({
    richtigeAntworten,
    gesamtFragen: config.anzahlFragen,
    belohnungProRichtig: config.belohnungProRichtig,
  });
  renderErgebnis(richtigeAntworten, config.anzahlFragen, belohnung);
}

function zeigeFrage(schwierigkeitKey, nummer, gesamt) {
  return new Promise((resolve) => {
    containerEl.innerHTML = "";
    const box = document.createElement("div");
    box.className = "quiz-box";

    const fortschritt = document.createElement("p");
    fortschritt.className = "quiz-fortschritt";
    fortschritt.textContent = `Frage ${nummer} von ${gesamt}`;
    box.appendChild(fortschritt);

    const ladehinweis = document.createElement("p");
    ladehinweis.textContent = "Frage wird geladen...";
    box.appendChild(ladehinweis);
    containerEl.appendChild(box);

    generiereQuizFrage(schwierigkeitKey).then((frage) => {
      box.innerHTML = "";
      box.appendChild(fortschritt);

      const frageText = document.createElement("p");
      frageText.className = "quiz-frage-text";
      frageText.textContent = frage.frage;
      box.appendChild(frageText);

      const optionenEl = document.createElement("div");
      optionenEl.className = "quiz-optionen";

      frage.optionen.forEach((option, optionIndex) => {
        const btn = document.createElement("button");
        btn.className = "quiz-option-btn";
        btn.textContent = option;
        btn.addEventListener("click", () => {
          const istRichtig = optionIndex === frage.richtigIndex;
          Array.from(optionenEl.children).forEach((kind, kindIndex) => {
            kind.disabled = true;
            if (kindIndex === frage.richtigIndex) {
              kind.classList.add("quiz-option--richtig");
            } else if (kindIndex === optionIndex) {
              kind.classList.add("quiz-option--falsch");
            }
          });
          setTimeout(() => resolve(istRichtig), 1100);
        });
        optionenEl.appendChild(btn);
      });

      box.appendChild(optionenEl);
    });
  });
}

function renderErgebnis(richtig, gesamt, belohnung) {
  containerEl.innerHTML = "";
  const box = document.createElement("div");
  box.className = "quiz-box";

  const titel = document.createElement("h3");
  titel.textContent = richtig === gesamt ? "Perfekt erledigt!" : "Auftrag erledigt";
  const text = document.createElement("p");
  const bonusHinweis = richtig === gesamt ? " (+2 Reputation Bonus)" : "";
  text.textContent = `${richtig} von ${gesamt} richtig beantwortet. Belohnung: ${belohnung.toLocaleString("de-DE")} €${bonusHinweis}`;

  box.append(titel, text, erzeugeSchliessenBtn());
  containerEl.appendChild(box);
}
