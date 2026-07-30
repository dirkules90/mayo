// Vollwertige Handy-Ansicht: Kontaktliste + Chatverlauf pro Kontakt
// (Nutzer-Wunsch, GTA-artiges Handy). Nutzt denselben Chatverlauf
// (npcChatHistory) wie Szenen-Dialoge.

import { getState } from "../../state/gameState.js";
import { getNpc } from "../../state/contentStore.js";
import { sendeNachricht } from "../../engine/phoneSystem.js";
import { on } from "../../state/eventBus.js";

let containerEl = null;
let offenerKontaktId = null;

export function initPhoneScreen(container) {
  containerEl = container;
  on("phone:antwort", ({ npcId }) => {
    if (npcId === offenerKontaktId && !containerEl.hidden) {
      renderThread(npcId);
    }
  });
  on("state:changed", () => {
    if (!containerEl.hidden && !offenerKontaktId) {
      renderKontaktliste();
    }
  });
}

export function oeffnePhone(kontaktIdZumOeffnen = null) {
  containerEl.hidden = false;
  offenerKontaktId = kontaktIdZumOeffnen;
  render();
}

export function schliessePhone() {
  containerEl.hidden = true;
  containerEl.innerHTML = "";
}

export function istPhoneOffen() {
  return !containerEl.hidden;
}

function render() {
  containerEl.innerHTML = "";

  const header = document.createElement("div");
  header.className = "phone-header";

  if (offenerKontaktId) {
    const zurueckBtn = document.createElement("button");
    zurueckBtn.textContent = "←";
    zurueckBtn.className = "phone-icon-nav-btn";
    zurueckBtn.addEventListener("click", () => {
      offenerKontaktId = null;
      render();
    });
    header.appendChild(zurueckBtn);
  }

  const titel = document.createElement("h3");
  titel.textContent = offenerKontaktId ? getNpc(offenerKontaktId)?.name ?? "Kontakt" : "📱 Kontakte";
  header.appendChild(titel);

  const schliessenBtn = document.createElement("button");
  schliessenBtn.textContent = "✕";
  schliessenBtn.className = "phone-icon-nav-btn";
  schliessenBtn.addEventListener("click", schliessePhone);
  header.appendChild(schliessenBtn);

  containerEl.appendChild(header);

  const inhalt = document.createElement("div");
  inhalt.className = "phone-inhalt";
  containerEl.appendChild(inhalt);

  if (offenerKontaktId) {
    renderThread(offenerKontaktId);
  } else {
    renderKontaktliste();
  }
}

function renderKontaktliste() {
  const inhalt = containerEl.querySelector(".phone-inhalt");
  if (!inhalt) return;
  inhalt.innerHTML = "";

  const state = getState();
  if (state.kontakte.length === 0) {
    const hinweis = document.createElement("p");
    hinweis.className = "phone-hinweis";
    hinweis.textContent = "Noch keine Kontakte gespeichert. Sprich mit Leuten in der Stadt.";
    inhalt.appendChild(hinweis);
    return;
  }

  state.kontakte.forEach((npcId) => {
    const npc = getNpc(npcId);
    if (!npc) return;

    const eintrag = document.createElement("button");
    eintrag.className = "phone-kontakt-eintrag";

    if (npc.portraitDatei) {
      const img = document.createElement("img");
      img.src = npc.portraitDatei;
      img.alt = npc.name;
      eintrag.appendChild(img);
    }

    const name = document.createElement("span");
    name.textContent = npc.name;
    eintrag.appendChild(name);

    eintrag.addEventListener("click", () => {
      offenerKontaktId = npcId;
      render();
    });
    inhalt.appendChild(eintrag);
  });
}

function renderThread(npcId) {
  const inhalt = containerEl.querySelector(".phone-inhalt");
  if (!inhalt) return;
  inhalt.innerHTML = "";

  const state = getState();
  const historie = state.npcChatHistory[npcId] ?? [];

  const verlauf = document.createElement("div");
  verlauf.className = "phone-verlauf";
  historie.forEach((eintrag) => {
    const p = document.createElement("p");
    p.className = eintrag.role === "user" ? "dialog-text dialog-text--spieler" : "dialog-text";
    p.textContent = eintrag.role === "user" ? `Mayo: ${eintrag.content}` : eintrag.content;
    verlauf.appendChild(p);
  });
  inhalt.appendChild(verlauf);

  const form = document.createElement("form");
  form.className = "dialog-freitext";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Nachricht schreiben...";
  input.maxLength = 200;

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Senden";

  form.append(input, submit);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.disabled = true;
    submit.disabled = true;

    const spielerBubble = document.createElement("p");
    spielerBubble.className = "dialog-text dialog-text--spieler";
    spielerBubble.textContent = `Mayo: ${text}`;
    verlauf.appendChild(spielerBubble);

    await sendeNachricht(npcId, text);
    renderThread(npcId);
  });
  inhalt.appendChild(form);
}
