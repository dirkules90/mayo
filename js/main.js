// Bootstrap: laedt Content-Daten, verdrahtet UI-Module und startet den
// Start-Screen. Enthaelt bewusst keine Spiellogik selbst - die liegt in
// engine/, dialog/ und state/.

import { loadAllContent, loadDialoguesForLevel, getLevel } from "./state/contentStore.js";
import { getState, wechsleLevel } from "./state/gameState.js";
import { on } from "./state/eventBus.js";
import { initStartScreen } from "./ui/screens/startScreen.js";
import { initSceneScreen, zeigeLocation } from "./ui/screens/sceneScreen.js";
import { initMapScreen, zeigeKarte, versteckeKarte } from "./ui/screens/mapScreen.js";
import { initStatusPanel } from "./ui/screens/statusPanel.js";
import { initCompletionScreen } from "./ui/screens/completionScreen.js";
import { initDialogBox } from "./ui/components/dialogBox.js";
import { initPhoneScreen, oeffnePhone } from "./ui/screens/phoneScreen.js";
import { initPhoneNotification } from "./ui/components/phoneNotification.js";
import { empfangeNachricht } from "./engine/phoneSystem.js";

async function main() {
  await loadAllContent();

  const startScreenEl = document.getElementById("start-screen");
  const sceneScreenEl = document.getElementById("scene-screen");
  const mapScreenEl = document.getElementById("map-screen");
  const completionScreenEl = document.getElementById("completion-screen");
  const statusPanelEl = document.getElementById("status-panel");
  const dialogBoxEl = document.getElementById("dialog-box");
  const phoneScreenEl = document.getElementById("phone-screen");
  const phoneIconBtn = document.getElementById("phone-icon-btn");
  const phoneToastContainerEl = document.getElementById("phone-toast-container");

  initStatusPanel(statusPanelEl);
  initDialogBox(dialogBoxEl);
  initSceneScreen(sceneScreenEl);
  initPhoneScreen(phoneScreenEl);
  initPhoneNotification(phoneToastContainerEl, (npcId) => oeffnePhone(npcId));
  const zeigeCompletion = initCompletionScreen(completionScreenEl);

  initMapScreen(mapScreenEl, (locationId) => {
    versteckeKarte();
    zeigeLocation(locationId);
  });

  phoneIconBtn.addEventListener("click", () => oeffnePhone());

  on("karte:betreten", () => {
    const state = getState();
    zeigeKarte(state.aktuellesLevel);
  });

  on("phase:ende", async () => {
    sceneScreenEl.hidden = true;
    wechsleLevel("duesseldorf");
    await starteAktuellenLevel();
    empfangeNachricht(
      "ramsi_hartmann",
      "Herr Doktor persoenlich in Duesseldorf! Hab schon gehoert, dass du heute bei Rheinnetz anfaengst. Meld dich, wenn du Feierabend hast - ich zeig dir, wo das Leben hier spielt!"
    );
  });

  initStartScreen(startScreenEl, starteAktuellenLevel);

  async function starteAktuellenLevel() {
    const state = getState();
    await loadDialoguesForLevel(state.aktuellesLevel);
    const level = getLevel(state.aktuellesLevel);

    phoneIconBtn.hidden = !level.karte;

    if (level.karte) {
      zeigeKarte(state.aktuellesLevel);
    } else {
      const ersteLocation = Object.keys(level.locations)[0];
      zeigeLocation(ersteLocation);
    }
  }
}

main().catch((fehler) => {
  console.error("Spiel konnte nicht gestartet werden:", fehler);
  document.body.innerHTML =
    '<p style="padding:2rem;color:#f66;">Das Spiel konnte nicht geladen werden. Bitte ueber einen lokalen Webserver oeffnen (siehe README), nicht per file://.</p>';
});
