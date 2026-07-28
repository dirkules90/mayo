// Generische Szenen-Render-Funktion (Kap. 21.2): liest die Konfiguration
// einer Location aus den Content-Daten und baut daraus Hintergrund + Hotspots.
// Neue Locations/Staedte brauchen dadurch keinen neuen Rendering-Code,
// nur neue Eintraege in data/levels.json.

import { getState } from "../state/gameState.js";
import { emit } from "../state/eventBus.js";

export function renderScene(container, level, locationId) {
  const location = level.locations[locationId];
  if (!location) {
    console.error(`Unbekannte Location "${locationId}" in Level "${level.id}"`);
    return;
  }

  container.innerHTML = "";
  container.className = `scene theme-${level.id}`;
  container.style.backgroundImage = location.background ? `url(${location.background})` : "";

  const titel = document.createElement("h2");
  titel.className = "scene-title";
  titel.textContent = location.name;
  container.appendChild(titel);

  const hotspotLayer = document.createElement("div");
  hotspotLayer.className = "hotspot-layer";

  const state = getState();
  for (const hotspot of location.hotspots) {
    if (!istHotspotSichtbar(hotspot, state)) continue;
    hotspotLayer.appendChild(erzeugeHotspotElement(hotspot));
  }

  container.appendChild(hotspotLayer);
}

function istHotspotSichtbar(hotspot, state) {
  const bedingung = hotspot.bedingung;
  if (!bedingung) return true;
  if (bedingung.minTag && state.aktuellerTag < bedingung.minTag) return false;
  if (bedingung.flagErforderlich && !state.eventFlags[bedingung.flagErforderlich]) return false;
  if (bedingung.flagVerboten && state.eventFlags[bedingung.flagVerboten]) return false;
  return true;
}

function erzeugeHotspotElement(hotspot) {
  const el = document.createElement("button");
  el.className = `hotspot hotspot--${hotspot.typ}`;
  el.style.left = `${hotspot.position.x}%`;
  el.style.top = `${hotspot.position.y}%`;
  el.textContent = hotspot.label;
  el.addEventListener("click", () => emit("hotspot:clicked", hotspot));
  return el;
}
