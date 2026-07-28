// Startbildschirm (Kap. 20.1): Titel, "Neues Spiel", "Fortsetzen".

import { hatSpeicherstand, ladeSpiel } from "../../persistence/saveLoad.js";
import { resetState } from "../../state/gameState.js";

export function initStartScreen(container, onStart) {
  render();

  function render() {
    container.hidden = false;
    container.innerHTML = "";

    const titel = document.createElement("h1");
    titel.textContent = "MAYO – Consulting, Chaos & Champagner";
    container.appendChild(titel);

    const untertitel = document.createElement("p");
    untertitel.textContent = "Ein satirisches Point-and-Click-Adventure.";
    container.appendChild(untertitel);

    const neuesSpielBtn = document.createElement("button");
    neuesSpielBtn.textContent = "Neues Spiel";
    neuesSpielBtn.addEventListener("click", () => {
      resetState();
      starteSpiel();
    });
    container.appendChild(neuesSpielBtn);

    if (hatSpeicherstand(1)) {
      const fortsetzenBtn = document.createElement("button");
      fortsetzenBtn.textContent = "Fortsetzen";
      fortsetzenBtn.addEventListener("click", () => {
        ladeSpiel(1);
        starteSpiel();
      });
      container.appendChild(fortsetzenBtn);
    }
  }

  function starteSpiel() {
    container.hidden = true;
    onStart();
  }
}
