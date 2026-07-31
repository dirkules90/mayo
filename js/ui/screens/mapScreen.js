// Begehbare Stadtkarte im Pokemon-Stil (Nutzer-Wunsch: "wie beim alten
// Pokemon, mit Kamera die mitscrollt"). Die Kachel-Welt ist groesser als
// der sichtbare Ausschnitt; eine "Kamera" folgt Mayo und scrollt die Welt
// per CSS-Transform, begrenzt an den Kartenraendern - genau wie im
// Game-Boy-Original. Steuerung per Pfeiltasten UND per Touch-D-Pad
// (Pfeiltasten allein funktionieren auf Handys ohne Tastatur nicht).
// Landmarks sind zusaetzlich direkt anklickbar. Betreten eines Landmarks
// fuehrt in die bestehende Szenen-Hotspot-Ansicht (sceneScreen.js).

import { getLevel } from "../../state/contentStore.js";
import { getState, notifyStateChanged } from "../../state/gameState.js";

let containerEl = null;
let onLandmarkBetreten = null;
let tastaturHandler = null;
let aktuelleKarte = null;

export function initMapScreen(container, callbackBeiLandmarkBetreten) {
  containerEl = container;
  onLandmarkBetreten = callbackBeiLandmarkBetreten;
}

export function zeigeKarte(levelId) {
  const level = getLevel(levelId);
  const karte = level.karte;
  aktuelleKarte = karte;

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

  const viewport = document.createElement("div");
  viewport.className = "map-viewport";
  viewport.style.aspectRatio = `${karte.sichtbarBreiteInTiles} / ${karte.sichtbarHoeheInTiles}`;

  const world = document.createElement("div");
  world.className = "map-world";
  world.style.width = `${(karte.breiteInTiles / karte.sichtbarBreiteInTiles) * 100}%`;
  world.style.height = `${(karte.hoeheInTiles / karte.sichtbarHoeheInTiles) * 100}%`;

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
  world.appendChild(terrain);

  const layer = document.createElement("div");
  layer.className = "map-layer";

  for (const dekoration of karte.dekorationen ?? []) {
    const el = document.createElement("div");
    el.className = "map-dekoration";
    el.style.left = `${((dekoration.position.x + 0.5) / karte.breiteInTiles) * 100}%`;
    el.style.top = `${((dekoration.position.y + 0.5) / karte.hoeheInTiles) * 100}%`;
    if (dekoration.gebaeude) {
      const bild = document.createElement("img");
      bild.className = "map-dekoration-gebaeude";
      bild.src = dekoration.gebaeude;
      bild.alt = "";
      el.appendChild(bild);
    } else {
      el.textContent = dekoration.emoji;
    }
    layer.appendChild(el);
  }

  for (const landmark of karte.landmarks) {
    const btn = document.createElement("button");
    btn.className = "map-landmark";
    btn.style.left = `${((landmark.position.x + 0.5) / karte.breiteInTiles) * 100}%`;
    btn.style.top = `${((landmark.position.y + 0.5) / karte.hoeheInTiles) * 100}%`;

    if (landmark.gebaeude) {
      const bild = document.createElement("img");
      bild.className = "map-landmark-gebaeude";
      bild.src = landmark.gebaeude;
      bild.alt = landmark.name;
      btn.appendChild(bild);
    } else {
      const emoji = document.createElement("span");
      emoji.className = "map-landmark-emoji";
      emoji.textContent = landmark.emoji;
      btn.appendChild(emoji);
    }

    const label = document.createElement("span");
    label.className = "map-landmark-label";
    label.textContent = landmark.name;
    btn.appendChild(label);
    btn.addEventListener("click", () => onLandmarkBetreten?.(landmark.ziel));
    layer.appendChild(btn);
  }

  const mayoToken = document.createElement("img");
  mayoToken.className = "map-mayo-token";
  mayoToken.src = "assets/ui/mayo_token.jpg";
  mayoToken.alt = "Mayo";
  positioniereMayoToken(mayoToken, karte, state);
  layer.appendChild(mayoToken);

  world.appendChild(layer);
  viewport.appendChild(world);
  containerEl.appendChild(viewport);
  aktualisiereKamera(world, karte, state);

  const hinweis = document.createElement("p");
  hinweis.className = "map-hinweis";
  hinweis.textContent = "Pfeiltasten oder D-Pad zum Laufen, oder direkt auf einen Ort klicken.";
  containerEl.appendChild(hinweis);

  containerEl.appendChild(erzeugeDpad(karte));
}

function positioniereMayoToken(el, karte, state) {
  el.style.left = `${((state.kartenPosition.x + 0.5) / karte.breiteInTiles) * 100}%`;
  el.style.top = `${((state.kartenPosition.y + 0.5) / karte.hoeheInTiles) * 100}%`;
}

// Kamera folgt Mayo, bleibt aber innerhalb der Kartengrenzen stehen
// (klassisches Game-Boy-Verhalten: Spieler kann nahe am Rand aus der Mitte
// wandern, die Kamera scrollt aber nicht ueber die Karte hinaus).
function berechneKameraPosition(karte, state) {
  const halbBreite = karte.sichtbarBreiteInTiles / 2;
  const halbHoehe = karte.sichtbarHoeheInTiles / 2;
  let camX = state.kartenPosition.x + 0.5 - halbBreite;
  let camY = state.kartenPosition.y + 0.5 - halbHoehe;
  camX = Math.max(0, Math.min(karte.breiteInTiles - karte.sichtbarBreiteInTiles, camX));
  camY = Math.max(0, Math.min(karte.hoeheInTiles - karte.sichtbarHoeheInTiles, camY));
  return { camX, camY };
}

function aktualisiereKamera(world, karte, state) {
  const { camX, camY } = berechneKameraPosition(karte, state);
  const verschiebungX = (camX / karte.breiteInTiles) * 100;
  const verschiebungY = (camY / karte.hoeheInTiles) * 100;
  world.style.transform = `translate(${-verschiebungX}%, ${-verschiebungY}%)`;
}

function bewege(dx, dy) {
  if (!aktuelleKarte) return;
  const karte = aktuelleKarte;
  const state = getState();
  const pos = state.kartenPosition;
  pos.x = Math.max(0, Math.min(karte.breiteInTiles - 1, pos.x + dx));
  pos.y = Math.max(0, Math.min(karte.hoeheInTiles - 1, pos.y + dy));

  const mayoToken = containerEl.querySelector(".map-mayo-token");
  const world = containerEl.querySelector(".map-world");
  if (mayoToken) positioniereMayoToken(mayoToken, karte, state);
  if (world) aktualisiereKamera(world, karte, state);

  notifyStateChanged();
}

function erzeugeDpad() {
  const dpad = document.createElement("div");
  dpad.className = "map-dpad";

  const RICHTUNGEN = [
    { klasse: "map-dpad-up", label: "↑", dx: 0, dy: -1 },
    { klasse: "map-dpad-left", label: "←", dx: -1, dy: 0 },
    { klasse: "map-dpad-right", label: "→", dx: 1, dy: 0 },
    { klasse: "map-dpad-down", label: "↓", dx: 0, dy: 1 },
  ];

  RICHTUNGEN.forEach(({ klasse, label, dx, dy }) => {
    const btn = document.createElement("button");
    btn.className = `map-dpad-btn ${klasse}`;
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", () => bewege(dx, dy));
    dpad.appendChild(btn);
  });

  return dpad;
}

function aktiviereTastatur() {
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
    bewege(richtung[0], richtung[1]);
  };
  window.addEventListener("keydown", tastaturHandler);
}

function deaktiviereTastatur() {
  if (tastaturHandler) {
    window.removeEventListener("keydown", tastaturHandler);
    tastaturHandler = null;
  }
}
