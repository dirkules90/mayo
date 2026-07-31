// Rendert den aktiven Dialog-Node: Sprechertext, Auswahloptionen,
// Freitextfeld (Kap. 19.2/20.1) und die abschliessende KI- bzw.
// Fallback-Antwort. Baut waehrend einer KI-Konversation einen echten,
// wachsenden Chatverlauf auf (Spieler- und NPC-Nachrichten abwechselnd),
// statt bei jeder Runde alles zu leeren.

import { on } from "../../state/eventBus.js";
import { waehleOption, sendeFreitext, bestaetigeEnde, bestaetigeKauf } from "../../dialog/dialogSystem.js";
import { getNpc } from "../../state/contentStore.js";

let containerEl = null;

export function initDialogBox(container) {
  containerEl = container;
  on("dialog:node", renderNode);
  on("dialog:spieler_nachricht", renderSpielerNachricht);
  on("dialog:ai_antwort", renderAiAntwort);
  on("dialog:freitext_erwartet", zeigeWeiteresFreitextfeld);
  on("dialog:kauf_fehlgeschlagen", zeigeKaufFehlgeschlagen);
  on("dialog:ende", () => {
    containerEl.hidden = true;
    containerEl.innerHTML = "";
  });
}

function renderNode(node) {
  containerEl.hidden = false;
  containerEl.innerHTML = "";

  if (node.sprecher) {
    const sprecher = getNpc(node.sprecher);
    const speakerRow = document.createElement("div");
    speakerRow.className = "dialog-speaker-row";

    if (sprecher?.portraitDatei) {
      const portrait = document.createElement("img");
      portrait.className = "dialog-portrait";
      portrait.src = sprecher.portraitDatei;
      portrait.alt = sprecher.name;
      speakerRow.appendChild(portrait);
    }

    const name = document.createElement("div");
    name.className = "dialog-speaker";
    name.textContent = sprecher ? sprecher.name : "Unbekannt";
    speakerRow.appendChild(name);

    containerEl.appendChild(speakerRow);
  }

  const text = document.createElement("p");
  text.className = "dialog-text";
  text.textContent = node.text;
  containerEl.appendChild(text);

  const optionenEl = document.createElement("div");
  optionenEl.className = "dialog-optionen";

  if (node.typ === "ende") {
    const weiterBtn = document.createElement("button");
    weiterBtn.textContent = "Weiter";
    weiterBtn.addEventListener("click", () => bestaetigeEnde());
    optionenEl.appendChild(weiterBtn);
  } else if (node.typ === "kauf") {
    optionenEl.appendChild(erzeugeKaufButton(node));
  } else {
    node.optionen.forEach((option, index) => {
      if (option.typ === "freitext") {
        optionenEl.appendChild(erzeugeFreitextFeld());
      } else {
        const btn = document.createElement("button");
        btn.className = "dialog-option-btn";
        btn.textContent = option.label;
        btn.addEventListener("click", () => {
          sperreOptionen(optionenEl);
          waehleOption(index);
        });
        optionenEl.appendChild(btn);
      }
    });
  }

  containerEl.appendChild(optionenEl);
}

function erzeugeFreitextFeld() {
  const wrapper = document.createElement("form");
  wrapper.className = "dialog-freitext";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Eigene Antwort eingeben...";
  input.maxLength = 200;

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Senden";

  wrapper.append(input, submit);
  wrapper.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    versendeUndSperre(wrapper, text);
  });

  return wrapper;
}

// Sperrt Freitextfeld UND eventuell vorhandene Vorschlag-Buttons gemeinsam,
// damit waehrend einer laufenden KI-Antwort keine Doppel-Eingabe moeglich ist.
function versendeUndSperre(gruppenEl, text) {
  sendeFreitext(text);
  gruppenEl.parentElement?.querySelectorAll("button, input").forEach((el) => {
    el.disabled = true;
  });
}

// KI-generierte Antwort-Vorschlaege (Nutzer-Wunsch: nicht nur bei der ersten
// Gespraechsrunde, sondern in JEDER Runde 1-2 Auswahlmoeglichkeiten anbieten,
// zusaetzlich zum freien Eintippen).
function erzeugeVorschlagButton(text) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dialog-vorschlag-btn";
  btn.textContent = text;
  btn.addEventListener("click", () => versendeUndSperre(btn, text));
  return btn;
}

// Generischer Kauf-Button (Kap. 16/32-Vorlage): Emoji + Label oben,
// Preis in Klammern darunter. Dasselbe Muster kommt spaeter im Shop
// (Uhren, Autos, Geschenke) wieder zum Einsatz.
function erzeugeKaufButton(node) {
  const btn = document.createElement("button");
  btn.className = "dialog-kauf-btn";

  const labelZeile = document.createElement("span");
  labelZeile.className = "dialog-kauf-label";
  labelZeile.textContent = node.kaufEmoji ? `${node.kaufEmoji} ${node.kaufLabel}` : node.kaufLabel;

  const preisZeile = document.createElement("span");
  preisZeile.className = "dialog-kauf-preis";
  preisZeile.textContent = `(-${node.preis.toLocaleString("de-DE")} €)`;

  btn.append(labelZeile, preisZeile);
  btn.addEventListener("click", () => bestaetigeKauf());
  return btn;
}

// Verhindert, dass waehrend einer laufenden KI-Antwort (async) noch eine
// zweite Option angeklickt oder Freitext abgeschickt werden kann.
function sperreOptionen(optionenEl) {
  optionenEl.querySelectorAll("button, input").forEach((el) => {
    el.disabled = true;
  });
}

function zeigeKaufFehlgeschlagen(preis) {
  const p = document.createElement("p");
  p.className = "dialog-text dialog-text--fallback";
  p.textContent = `Dafuer reicht das Geld gerade nicht (${preis.toLocaleString("de-DE")} € noetig).`;
  containerEl.appendChild(p);
}

function renderSpielerNachricht(text) {
  const p = document.createElement("p");
  p.className = "dialog-text dialog-text--spieler";
  p.textContent = `Mayo: ${text}`;
  containerEl.appendChild(p);
}

function renderAiAntwort(antwort) {
  const p = document.createElement("p");
  p.className = antwort.viaFallback ? "dialog-text dialog-text--fallback" : "dialog-text";
  p.textContent = antwort.text;
  containerEl.appendChild(p);
}

// Wird waehrend einer mehrstufigen KI-Konversation (Kap. 19) nach jeder
// Runde aufgerufen, solange noch weitere Austausche anstehen: ersetzt das
// (bereits deaktivierte) alte Eingabefeld durch ein frisches, ohne den
// bisherigen Chatverlauf zu loeschen.
function zeigeWeiteresFreitextfeld(vorschlaege = []) {
  const alteOptionen = containerEl.querySelector(".dialog-optionen");
  if (alteOptionen) {
    alteOptionen.remove();
  }
  const optionenEl = document.createElement("div");
  optionenEl.className = "dialog-optionen";
  vorschlaege.forEach((vorschlag) => {
    optionenEl.appendChild(erzeugeVorschlagButton(vorschlag));
  });
  optionenEl.appendChild(erzeugeFreitextFeld());
  containerEl.appendChild(optionenEl);
}
