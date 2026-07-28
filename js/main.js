// Bootstrap: laedt Content-Daten, verdrahtet UI-Module und startet den
// Start-Screen. Enthaelt bewusst keine Spiellogik selbst - die liegt in
// engine/, dialog/ und state/.

import { loadAllContent, loadDialoguesForLevel, getLevel } from "./state/contentStore.js";
import { getState } from "./state/gameState.js";
import { on } from "./state/eventBus.js";
import { initStartScreen } from "./ui/screens/startScreen.js";
import { initSceneScreen, zeigeLocation } from "./ui/screens/sceneScreen.js";
import { initStatusPanel } from "./ui/screens/statusPanel.js";
import { initCompletionScreen } from "./ui/screens/completionScreen.js";
import { initDialogBox } from "./ui/components/dialogBox.js";

async function main() {
  await loadAllContent();

  const startScreenEl = document.getElementById("start-screen");
  const sceneScreenEl = document.getElementById("scene-screen");
  const completionScreenEl = document.getElementById("completion-screen");
  const statusPanelEl = document.getElementById("status-panel");
  const dialogBoxEl = document.getElementById("dialog-box");

  initStatusPanel(statusPanelEl);
  initDialogBox(dialogBoxEl);
  initSceneScreen(sceneScreenEl);
  const zeigeCompletion = initCompletionScreen(completionScreenEl);

  on("phase:ende", () => {
    sceneScreenEl.hidden = true;
    zeigeCompletion(
      "Ende von Phase 0 (Grundgeruest & Prolog). Level 1 - Duesseldorf folgt in der naechsten Ausbaustufe."
    );
  });

  initStartScreen(startScreenEl, async () => {
    const state = getState();
    await loadDialoguesForLevel(state.aktuellesLevel);
    const level = getLevel(state.aktuellesLevel);
    const ersteLocation = Object.keys(level.locations)[0];
    zeigeLocation(ersteLocation);
  });
}

main().catch((fehler) => {
  console.error("Spiel konnte nicht gestartet werden:", fehler);
  document.body.innerHTML =
    '<p style="padding:2rem;color:#f66;">Das Spiel konnte nicht geladen werden. Bitte ueber einen lokalen Webserver oeffnen (siehe README), nicht per file://.</p>';
});
