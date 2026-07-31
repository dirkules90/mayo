// Begehbare Stadtkarte im Pokemon-Stil (Nutzer-Wunsch: "wie beim alten
// Pokemon, mit Kamera die mitscrollt"). Die Kachel-Welt ist groesser als
// der sichtbare Ausschnitt; eine "Kamera" folgt Mayo und scrollt die Welt
// per CSS-Transform, begrenzt an den Kartenraendern - genau wie im
// Game-Boy-Original. Steuerung per Pfeiltasten UND per Touch-D-Pad
// (Pfeiltasten allein funktionieren auf Handys ohne Tastatur nicht).
//
// Kollisionsregeln (Nutzer-Wunsch: klassisches Pokemon-Verhalten):
// - Auf ein Landmark-Feld zulaufen betritt automatisch die Location (wie eine
//   Tuer) - Mayo bleibt dabei auf dem Feld davor stehen (kein Reinlaufen
//   noetig, direktes Anklicken bleibt zusaetzlich moeglich).
// - Dekorationen (Haeuser, Baeume) sind solide: man laeuft dagegen, bleibt
//   aber stehen (nur Blickrichtung dreht sich).
// - NPCs auf der Karte sind ebenfalls solide. Man laeuft bis direkt vor sie
//   und spricht sie ueber den "Sprechen"-Button an (A/B-Button-Wunsch).

import { getLevel } from "../../state/contentStore.js";
import { getState, notifyStateChanged } from "../../state/gameState.js";
import { getNpc } from "../../state/contentStore.js";

let containerEl = null;
let onLandmarkBetreten = null;
let onNpcAngesprochen = null;
let tastaturHandler = null;
let aktuelleKarte = null;

export function initMapScreen(container, callbackBeiLandmarkBetreten, callbackBeiNpcAnsprechen) {
  containerEl = container;
  onLandmarkBetreten = callbackBeiLandmarkBetreten;
  onNpcAngesprochen = callbackBeiNpcAnsprechen;
}

export function zeigeKarte(levelId) {
  const level = getLevel(levelId);
  const karte = level.karte;
  aktuelleKarte = karte;

  const state = getState();
  if (!state.kartenPosition || state.kartenPosition.levelId !== levelId) {
    state.kartenPosition = {
      levelId,
      x: karte.startPosition.x,
      y: karte.startPosition.y,
      richtung: "unten",
    };
    notifyStateChanged();
  }
  if (!state.kartenPosition.richtung) {
    state.kartenPosition.richtung = "unten";
  }

  containerEl.hidden = false;
  render(level, karte, state);
  aktiviereTastatur();
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
    if (dekoration.bauTyp) {
      el.appendChild(erzeugeGebaeude(dekoration.bauTyp, "map-dekoration-gebaeude"));
    } else {
      el.textContent = dekoration.emoji;
    }
    layer.appendChild(el);
  }

  for (const landmark of karte.landmarks) {
    const btn = document.createElement("button");
    btn.className = "map-landmark";
    btn.type = "button";
    btn.style.left = `${((landmark.position.x + 0.5) / karte.breiteInTiles) * 100}%`;
    btn.style.top = `${((landmark.position.y + 0.5) / karte.hoeheInTiles) * 100}%`;

    if (landmark.bauTyp) {
      btn.appendChild(erzeugeGebaeude(landmark.bauTyp, "map-landmark-gebaeude"));
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

  for (const npc of karte.npcs ?? []) {
    const btn = document.createElement("button");
    btn.className = "map-npc";
    btn.type = "button";
    btn.style.left = `${((npc.position.x + 0.5) / karte.breiteInTiles) * 100}%`;
    btn.style.top = `${((npc.position.y + 0.5) / karte.hoeheInTiles) * 100}%`;

    const npcDaten = getNpc(npc.npcId);
    const kopf = document.createElement("div");
    kopf.className = "map-npc-kopf";
    if (npcDaten?.portraitDatei) {
      const bild = document.createElement("img");
      bild.src = npcDaten.portraitDatei;
      bild.alt = npc.name;
      kopf.appendChild(bild);
    } else {
      kopf.textContent = "🧍";
    }
    btn.appendChild(kopf);

    const label = document.createElement("span");
    label.className = "map-landmark-label";
    label.textContent = npc.name;
    btn.appendChild(label);

    btn.addEventListener("click", () => onNpcAngesprochen?.(npc.ziel));
    layer.appendChild(btn);
  }

  const mayoToken = document.createElement("div");
  mayoToken.className = "map-mayo-token";
  const mayoBild = document.createElement("img");
  mayoBild.src = "assets/ui/mayo_token.jpg";
  mayoBild.alt = "Mayo";
  mayoToken.appendChild(mayoBild);
  positioniereMayoToken(mayoToken, karte, state);
  layer.appendChild(mayoToken);

  world.appendChild(layer);
  viewport.appendChild(world);
  containerEl.appendChild(viewport);
  aktualisiereKamera(world, karte, state);

  const hinweis = document.createElement("p");
  hinweis.className = "map-hinweis";
  hinweis.textContent = "D-Pad zum Laufen. Vor eine Person laufen und 'Sprechen' druecken, um zu reden.";
  containerEl.appendChild(hinweis);

  containerEl.appendChild(erzeugeSteuerung());
}

// Baut ein rein CSS-basiertes, flaches Retro-Gebaeude (kein Foto/Render) -
// so bleibt der Baustil konsistent mit der Kachel-Optik der Karte, statt wie
// "draufgeklatschte" isometrische Fotos zu wirken (Nutzer-Feedback).
function erzeugeGebaeude(bauTyp, groessenKlasse) {
  const wrapper = document.createElement("div");
  wrapper.className = `${groessenKlasse} pixel-building pixel-building--${bauTyp}`;

  const dach = document.createElement("div");
  dach.className = "pb-dach";
  wrapper.appendChild(dach);

  const koerper = document.createElement("div");
  koerper.className = "pb-koerper";
  const fensterA = document.createElement("div");
  fensterA.className = "pb-fenster pb-fenster--links";
  const fensterB = document.createElement("div");
  fensterB.className = "pb-fenster pb-fenster--rechts";
  const tuer = document.createElement("div");
  tuer.className = "pb-tuer";
  koerper.append(fensterA, fensterB, tuer);
  wrapper.appendChild(koerper);

  return wrapper;
}

function positioniereMayoToken(el, karte, state) {
  el.style.left = `${((state.kartenPosition.x + 0.5) / karte.breiteInTiles) * 100}%`;
  el.style.top = `${((state.kartenPosition.y + 0.5) / karte.hoeheInTiles) * 100}%`;
  el.classList.toggle("facing-links", state.kartenPosition.richtung === "links");
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

function positionsSchluessel(x, y) {
  return `${x},${y}`;
}

// Baut Nachschlage-Tabellen fuer Kollisionen neu (kleine Karten - unkritisch
// fuer Performance, aber vermeidet, das bei jeder Bewegung neu zu berechnen).
function baueKollisionsKarten(karte) {
  const npcAn = new Map();
  for (const npc of karte.npcs ?? []) {
    npcAn.set(positionsSchluessel(npc.position.x, npc.position.y), npc);
  }
  const landmarkAn = new Map();
  for (const landmark of karte.landmarks) {
    landmarkAn.set(positionsSchluessel(landmark.position.x, landmark.position.y), landmark);
  }
  const dekorationBlockiert = new Set();
  for (const dekoration of karte.dekorationen ?? []) {
    dekorationBlockiert.add(positionsSchluessel(dekoration.position.x, dekoration.position.y));
  }
  return { npcAn, landmarkAn, dekorationBlockiert };
}

function richtungAusDelta(dx, dy) {
  if (dx < 0) return "links";
  if (dx > 0) return "rechts";
  if (dy < 0) return "oben";
  return "unten";
}

function deltaAusRichtung(richtung) {
  switch (richtung) {
    case "links":
      return [-1, 0];
    case "rechts":
      return [1, 0];
    case "oben":
      return [0, -1];
    default:
      return [0, 1];
  }
}

function bewege(dx, dy) {
  if (!aktuelleKarte) return;
  const karte = aktuelleKarte;
  const state = getState();
  const pos = state.kartenPosition;

  pos.richtung = richtungAusDelta(dx, dy);

  const zielX = Math.max(0, Math.min(karte.breiteInTiles - 1, pos.x + dx));
  const zielY = Math.max(0, Math.min(karte.hoeheInTiles - 1, pos.y + dy));
  const schluessel = positionsSchluessel(zielX, zielY);
  const { npcAn, landmarkAn, dekorationBlockiert } = baueKollisionsKarten(karte);
  const blockierteTiles = karte.blockierteTiles ?? [];
  const zielTileCode = karte.tiles[zielY][zielX];

  aktualisiereMayoDarstellung(karte, state);

  if (zielX === pos.x && zielY === pos.y) {
    notifyStateChanged();
    return;
  }
  if (blockierteTiles.includes(zielTileCode) || npcAn.has(schluessel) || dekorationBlockiert.has(schluessel)) {
    // Solides Hindernis (NPC oder Dekoration): nur die Blickrichtung dreht
    // sich, Mayo bleibt stehen - wie im Original gegen eine Wand/Person.
    notifyStateChanged();
    return;
  }
  if (landmarkAn.has(schluessel)) {
    // Klassisches "Tuer"-Verhalten: auf das Gebaeudefeld zulaufen betritt es
    // sofort. Position bleibt davor stehen, damit man beim Verlassen nicht
    // sofort wieder hineinlaeuft.
    notifyStateChanged();
    onLandmarkBetreten?.(landmarkAn.get(schluessel).ziel);
    return;
  }

  pos.x = zielX;
  pos.y = zielY;
  aktualisiereMayoDarstellung(karte, state);
  notifyStateChanged();
}

function aktualisiereMayoDarstellung(karte, state) {
  const mayoToken = containerEl.querySelector(".map-mayo-token");
  const world = containerEl.querySelector(".map-world");
  if (mayoToken) positioniereMayoToken(mayoToken, karte, state);
  if (world) aktualisiereKamera(world, karte, state);
}

// "Sprechen"-Button (A/B-Button-Wunsch): prueft das Feld, auf das Mayo
// gerade blickt, und spricht einen dort stehenden NPC an.
function spreche() {
  if (!aktuelleKarte) return;
  const karte = aktuelleKarte;
  const state = getState();
  const pos = state.kartenPosition;
  const [dx, dy] = deltaAusRichtung(pos.richtung);
  const vorX = Math.max(0, Math.min(karte.breiteInTiles - 1, pos.x + dx));
  const vorY = Math.max(0, Math.min(karte.hoeheInTiles - 1, pos.y + dy));
  const schluessel = positionsSchluessel(vorX, vorY);
  const { npcAn } = baueKollisionsKarten(karte);
  const npc = npcAn.get(schluessel);
  if (npc) {
    onNpcAngesprochen?.(npc.ziel);
  }
}

function erzeugeSteuerung() {
  const wrapper = document.createElement("div");
  wrapper.className = "map-steuerung";

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

  wrapper.appendChild(dpad);

  const sprechenBtn = document.createElement("button");
  sprechenBtn.className = "map-sprechen-btn";
  sprechenBtn.type = "button";
  sprechenBtn.textContent = "💬 Sprechen";
  sprechenBtn.addEventListener("click", () => spreche());
  wrapper.appendChild(sprechenBtn);

  return wrapper;
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
    if (event.code === "Space" || event.key === "Enter") {
      event.preventDefault();
      spreche();
      return;
    }
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
