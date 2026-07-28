// Rendert den aktiven Dialog-Node: Sprechertext, Auswahloptionen,
// Freitextfeld (Kap. 19.2/20.1) und die abschliessende KI- bzw.
// Fallback-Antwort.

import { on } from "../../state/eventBus.js";
import { waehleOption, sendeFreitext, bestaetigeEnde } from "../../dialog/dialogSystem.js";
import { getNpc } from "../../state/contentStore.js";

let containerEl = null;

export function initDialogBox(container) {
  containerEl = container;
  on("dialog:node", renderNode);
  on("dialog:ai_antwort", renderAiAntwort);
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
  } else {
    node.optionen.forEach((option, index) => {
      if (option.typ === "freitext") {
        optionenEl.appendChild(erzeugeFreitextFeld());
      } else {
        const btn = document.createElement("button");
        btn.className = "dialog-option-btn";
        btn.textContent = option.label;
        btn.addEventListener("click", () => waehleOption(index));
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
    sendeFreitext(text);
    input.value = "";
    input.disabled = true;
    submit.disabled = true;
  });

  return wrapper;
}

function renderAiAntwort(antwort) {
  const p = document.createElement("p");
  p.className = antwort.viaFallback ? "dialog-text dialog-text--fallback" : "dialog-text";
  p.textContent = antwort.text;
  containerEl.appendChild(p);
}
