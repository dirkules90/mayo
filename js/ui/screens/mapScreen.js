// Begehbare Stadtkarte im Pokemon-Stil (Nutzer-Wunsch: "wie bei Pokemon
// Blau und Rot, in Farbe"): echtes Kachel-Raster aus Terrain-Tiles (Gras/
// Weg/Wasser) statt eines einzelnen gemalten Panoramabilds, darauf Mayo
// als Token per Pfeiltasten beweglich. Landmarks sind zusaetzlich direkt
// anklickbar (schnellerer Zugriff, kein exaktes "Draufsteppen" noetig).
// Betreten eines Landmarks fuehrt in die bestehende Szenen-Hotspot-Ansicht
// (sceneScreen.js) fuer diese Location.

import { getLevel } from "../../state/contentStore.js";
import { getState, notifyStateChanged } from "../../state/gameState.js";

let containerEl = null;
let onLandmarkBetreten = null;
let tastaturHandler = null;

export function initMapScreen(container, callbackBeiLandmarkBetreten) {
  containerEl = container;
  onLandmarkBetreten = callbackBeiLandmarkBetreten;
}

export function zeigeKarte(levelId) {
  const level = getLevel(levelId);
  const karte = level.karte;

  const state = getState();
  if (!state.kartenPosition || state.kartenPosition.levelId !== levelId) {
    state.kartenPosition = { levelId, x: karte.startPosition.x, y: karte.startPosition.y };
    notifyStateChanged();
  }

  containerEl.hidden = false;
  render(level, karte, state);
  aktiviereTastatur(karte);
}

export function versteckeKarte() {
  containerEl.hidden = true;
  deaktiviereTastatur();
}

function render(level, karte, state) {
  containerEl.innerHTML = "";
  containerEl.className = `map-screen theme-${level.id}`;

  const terrain = document.createElement("div");
  terrain.className = "map-terrain";
  terrain.style.gridTemplateColumns = `repeat(${karte.breiteInTiles}, 1fr)`;
  terrain.style.gridTemplateRows = `repeat(${karte.hoeheInTiles}, 1fr)`;

  for (let y = 0; y < karte.hoeheInTiles; y++) {
    const zeile = karte.tiles[y];
    for (let x = 0; x < karte.breiteInTiles; x++) {
      const tileCode = zeile[x];
      const tile = document.createElement("div");
      tile.className = "map-tile";
      tile.style.backgroundImage = `url(${karte.tileArt[tileCode]})`;
      terrain.appendChild(tile);
    }
  }
  containerEl.appendChild(terrain);

  const layer = document.createElement("div");
  layer.className = "map-layer";

  for (const landmark of karte.landmarks) {
    const btn = document.createElement("button");
    btn.className = "map-landmark";
    btn.style.left = `${((landmark.position.x + 0.5) / karte.breiteInTiles) * 100}%`;
    btn.style.top = `${((landmark.position.y + 0.5) / karte.hoeheInTiles) * 100}%`;

    const emoji = document.createElement("span");
    emoji.className = "map-landmark-emoji";
    emoji.textContent = landmark.emoji;
    const label = document.createElement("span");
    label.className = "map-landmark-label";
    label.textContent = landmark.name;

    btn.append(emoji, label);
    btn.addEventListener("click", () => onLandmarkBetreten?.(landmark.ziel));
    layer.appendChild(btn);
  }

  const mayoToken = document.createElement("img");
  mayoToken.className = "map-mayo-token";
  mayoToken.src = "assets/ui/mayo_token.jpg";
  mayoToken.alt = "Mayo";
  positioniereMayoToken(mayoToken, karte, state);
  layer.appendChild(mayoToken);

  containerEl.appendChild(layer);

  const hinweis = document.createElement("p");
  hinweis.className = "map-hinweis";
  hinweis.textContent = "Mit den Pfeiltasten laufen oder direkt auf einen Ort klicken.";
  containerEl.appendChild(hinweis);
}

function positioniereMayoToken(el, karte, state) {
  el.style.left = `${((state.kartenPosition.x + 0.5) / karte.breiteInTiles) * 100}%`;
  el.style.top = `${((state.kartenPosition.y + 0.5) / karte.hoeheInTiles) * 100}%`;
}

function aktiviereTastatur(karte) {
  deaktiviereTastatur();
  tastaturHandler = (event) => {
    const RICHTUNGEN = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const richtung = RICHTUNGEN[event.key];
    if (!richtung) return;
    event.preventDefault();

    const state = getState();
    const pos = state.kartenPosition;
    pos.x = Math.max(0, Math.min(karte.breiteInTiles - 1, pos.x + richtung[0]));
    pos.y = Math.max(0, Math.min(karte.hoeheInTiles - 1, pos.y + richtung[1]));

    const mayoToken = containerEl.querySelector(".map-mayo-token");
    if (mayoToken) {
      positioniereMayoToken(mayoToken, karte, state);
    }
    notifyStateChanged();
  };
  window.addEventListener("keydown", tastaturHandler);
}

function deaktiviereTastatur() {
  if (tastaturHandler) {
    window.removeEventListener("keydown", tastaturHandler);
    tastaturHandler = null;
  }
}
