// Einfacher Abschluss-Screen fuer das Ende einer Ausbaustufe (Phase 0 endet
// nach dem Prolog; ab Phase 1 wird dieser Screen fuer echte Level-Abschluesse
// wiederverwendet, siehe Kap. 6 "Level-Abschluss").

import { speichereSpiel } from "../../persistence/saveLoad.js";

export function initCompletionScreen(container) {
  return function zeige(nachricht) {
    container.hidden = false;
    container.innerHTML = "";

    const text = document.createElement("p");
    text.textContent = nachricht;
    container.appendChild(text);

    const speichernBtn = document.createElement("button");
    speichernBtn.textContent = "Spielstand speichern";
    speichernBtn.addEventListener("click", () => {
      speichereSpiel(1);
      speichernBtn.textContent = "Gespeichert ✓";
      speichernBtn.disabled = true;
    });
    container.appendChild(speichernBtn);
  };
}
