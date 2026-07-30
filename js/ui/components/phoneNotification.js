// GTA-artiges Popup, das bei neuen Handy-Nachrichten kurz einblendet
// (Nutzer-Wunsch). Klick oeffnet direkt den Chat mit diesem Kontakt.

import { on } from "../../state/eventBus.js";

const ANZEIGEDAUER_MS = 8000;

export function initPhoneNotification(container, onOeffnen) {
  on("phone:neue_nachricht", ({ npcId, npcName, text }) => {
    zeigeToast(container, npcId, npcName, text, onOeffnen);
  });
}

function zeigeToast(container, npcId, npcName, text, onOeffnen) {
  const toast = document.createElement("button");
  toast.className = "phone-toast";

  const titel = document.createElement("strong");
  titel.textContent = `📱 ${npcName}`;
  const nachricht = document.createElement("span");
  nachricht.textContent = text;

  toast.append(titel, nachricht);
  toast.addEventListener("click", () => {
    onOeffnen(npcId);
    toast.remove();
  });

  container.appendChild(toast);
  setTimeout(() => toast.remove(), ANZEIGEDAUER_MS);
}
