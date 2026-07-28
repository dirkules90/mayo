// Verbindet den generischen sceneRenderer mit Hotspot-Klicks: Dialoge starten,
// zwischen Locations reisen. Shop/Task-Hotspots folgen in Phase 1.

import { renderScene } from "../../engine/sceneRenderer.js";
import { getState } from "../../state/gameState.js";
import { getLevel } from "../../state/contentStore.js";
import { on, emit } from "../../state/eventBus.js";
import { starteDialog } from "../../dialog/dialogSystem.js";

let sceneContainer = null;
let aktuelleLocationId = null;

export function initSceneScreen(container) {
  sceneContainer = container;
  on("hotspot:clicked", handleHotspot);
}

export function zeigeLocation(locationId) {
  aktuelleLocationId = locationId;
  const state = getState();
  const level = getLevel(state.aktuellesLevel);
  sceneContainer.hidden = false;
  renderScene(sceneContainer, level, locationId);
}

function handleHotspot(hotspot) {
  if (hotspot.typ === "dialog") {
    const state = getState();
    starteDialog(state.aktuellesLevel, hotspot.ziel, () => {
      if (hotspot.nachDialog === "phasenende") {
        emit("phase:ende");
      } else {
        zeigeLocation(aktuelleLocationId);
      }
    });
  } else if (hotspot.typ === "reise") {
    zeigeLocation(hotspot.ziel);
  }
}
