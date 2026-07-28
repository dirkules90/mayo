// Lädt alle Content-Daten (data/*.json) einmalig per fetch und hält sie im
// Speicher. Bewusst kein JSON-Import-Assertion-Syntax verwendet, da dessen
// Browser-Unterstuetzung (v.a. Safari) noch uneinheitlich ist (Kap. 28).

const content = {
  npcs: null,
  levels: null,
  items: null,
  endings: null,
  dialogues: {}, // keyed nach Level-/Stadt-ID
};

async function fetchJson(pfad) {
  const antwort = await fetch(pfad);
  if (!antwort.ok) {
    throw new Error(`Konnte Content-Datei nicht laden: ${pfad}`);
  }
  return antwort.json();
}

export async function loadAllContent() {
  const [npcs, levels, items, endings] = await Promise.all([
    fetchJson("data/npcs.json"),
    fetchJson("data/levels.json"),
    fetchJson("data/items.json"),
    fetchJson("data/endings.json"),
  ]);
  content.npcs = npcs;
  content.levels = levels;
  content.items = items;
  content.endings = endings;
  return content;
}

export async function loadDialoguesForLevel(levelId) {
  if (content.dialogues[levelId]) {
    return content.dialogues[levelId];
  }
  const daten = await fetchJson(`data/dialogues/${levelId}.json`);
  content.dialogues[levelId] = daten;
  return daten;
}

export function getContent() {
  return content;
}

export function getNpc(npcId) {
  return content.npcs?.find((npc) => npc.id === npcId);
}

export function getLevel(levelId) {
  return content.levels?.find((level) => level.id === levelId);
}

export function getItem(itemId) {
  return content.items?.find((item) => item.id === itemId);
}
