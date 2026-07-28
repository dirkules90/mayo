# MAYO – Consulting, Chaos & Champagner

Ein satirisches Point-and-Click-Adventure als Browser-Spiel. Mayo, frisch
promovierter Junior Consultant fuer Energiewende-Projekte, jongliert zwischen
Kundenauftraegen, Statussymbolen, Partynaechten und Beziehungen quer durch
Duesseldorf, Hamburg, Muenchen und Ibiza.

Die vollstaendigen Anforderungen stehen im Lastenheft ("MAYO – Consulting,
Chaos & Champagner"), das dieser Implementierung zugrunde liegt.

## Aktueller Stand

**Phase 0 – Grundgeruest & Prolog** ist umgesetzt: Projektstruktur, zentrales
`gameState`, generischer Szenen-Renderer, Dialogsystem, Speicherstaende und
die Wuppertal-Prolog-Szene (Tutorial fuer Klicken, Dialoge und die erste
Arbeit-vs-Vergnuegen-Entscheidung). Level 1 (Duesseldorf) folgt in der
naechsten Ausbaustufe.

## Lokal ausfuehren

Das Spiel ist reines HTML/CSS/JavaScript (ES-Module, kein Build-Schritt).
Da `fetch()` fuer die Content-Dateien und ES-Module keinen `file://`-Zugriff
erlauben, muss lokal ein einfacher Webserver laufen, z. B.:

```bash
python3 -m http.server 8080
# oder: npx serve .
```

Anschliessend im Browser `http://localhost:8080` oeffnen.

## Projektstruktur

```
/
├── index.html
├── css/                 # Styles (global, Stadt-Themes, Screens)
├── js/
│   ├── state/           # gameState, eventBus, contentStore
│   ├── engine/           # Zeit-, Geld-, Beziehungs-, Task- und Ending-Logik
│   ├── dialog/           # Dialogbaum-Runner + KI-Chat-Orchestrierung
│   ├── ai/providers/     # Anbieter-Anbindung (ab Phase 2, z. B. Groq)
│   ├── persistence/      # Save/Load (localStorage)
│   └── ui/               # Screens & Komponenten
└── data/                 # Content-Daten: NPCs, Level, Dialoge, Items, Enden
```

Code und Inhalte sind strikt getrennt: Alle Texte, Dialoge, NPC- und
Level-Konfigurationen liegen in `data/*.json` und lassen sich ohne
Code-Aenderungen anpassen.

## KI-Chat-System & API-Keys

Das Dialogsystem funktioniert vollstaendig offline mit statischen
Fallback-Dialogen. Fuer den dynamischen KI-Chat (ab Phase 2) gilt:

- **Kein API-Key wird jemals im Repository oder im ausgelieferten
  Frontend-Code hinterlegt.** Da dieses Repository oeffentlich ist und das
  Spiel als reine statische Seite ueber GitHub Pages laeuft, waere jeder im
  Code eingebettete Key fuer alle Besucher einsehbar.
- Stattdessen ruft das Spiel einen kleinen, separat gehosteten serverlosen
  Proxy auf, der den eigentlichen Anbieter-Key serverseitig als Secret
  haelt. Details und Deployment-Anleitung folgen mit der Phase-2-Umsetzung.
- Ohne erreichbaren Proxy/Provider greift automatisch der statische
  Fallback-Dialog – das Spiel bleibt dadurch jederzeit vollstaendig
  spielbar.

## Lizenz

Noch nicht final festgelegt (siehe Roadmap Phase 6).
