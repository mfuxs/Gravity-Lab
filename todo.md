# Projekt Roadmap & TODOs
## Anweisungen für die ToDos
- Wenn ein ToDO zu groß für ein Druchlauf ist, teil es in kleinere ToDos auf.
- 

## 🚨 Priorität 0: Bugfixes & Akute Probleme
- [x] **Orbit Planer Validierung**: Prüfe den Orbit Planer auf Fehler bei bewegten Objekten.
- [x] **Kollisions-Warnung**: Färbe den Orbit-Pfad rot, wenn eine Kollision vorausberechnet wird.
- [x] **Performance**: Optimierung der Physik-Loop (Spatial Partitioning oder WebWorker), da O(N^2) bei vielen Objekten (>500) laggt.

## 🏗️ Priorität 1: Architektur & Refactoring (Dringend!)
- [ ] **Monolith aufbrechen**: `GravitySimV10.jsx` (>1700 Zeilen) muss zerlegt werden.
    - [x] `PhysicsEngine.js`: Auslagerung von `Body`, `Particle` und `physicsStep`.
    - [x] `Renderer.js`: Canvas-Zeichnungslogik auslagern.
    - [x] `InputHandler.js`: Maus- und Tastatur-Logik trennen.
    - [x] `MissionControl.js`: Die gesamte Raketen-Autopilot-Logik isolieren.
- [x] **State Management**: Einführung eines Contexts oder Stores (z.B. Zustand) für den Simulations-Status, um Prop-Drilling zu vermeiden.
- [x] **Testing**: Implementierung von Unit-Tests für die wichtigsten Funktionen.
    - [x] `index.css`: Test der CSS-Styles.
    - [x] Analyse welche testes Wichtig sind um die Funktonisweise der ausfürlich zu testen und schreiben der nötigen Tests in die TODOs und Testing.
    - [x] `PhysicsEngine.js`: Test der Berechnungen.
    - [ ] `Renderer.js`: Test der Zeichnungslogik.
    - [x] `InputHandler.js`: Test der Interaktion.
    - [x] `MissionControl.js`: Test der Autopilot-Logik.
    - [ ] `GravitySimV10.jsx`: Test der Simulationslogik.
    - [ ] `ausführliche Analyse ob alle wichtigen Funktionen getestet sind und ob die TODOs und Testing genügend sind.

## 🌟 Priorität 2: Fehlende Kern-Features (lt. Projekt.md)
### Interaktion & Werkzeuge
- [x] **Objekt-Inspektor**: Klick auf ein Objekt öffnet ein Panel mit Details (Masse, Radius, Geschw., Position).
    - [x] Editierbare Werte: Ermögliche das Ändern von Masse/Geschwindigkeit zur Laufzeit.
- [x] **Zeit-Steuerung (Time Warp)**: Slider für Simulationsgeschwindigkeit (0.1x bis 100x) statt nur "High Precision".
- [x] **Informations-Layer**:
    - [x] Geschwindigkeitsvektoren einblenden.
    - [x] Hill-Sphären / Einflusssphären visualisieren.
    - [ ] Gravitations-Potential (optional als Heatmap).
    - [x] **Globale Orbit-Vorschau**: Toggle, der die vorausberechneten Bahnen *aller* Objekte anzeigt (nicht nur beim Erstellen).

### Szenarien & Lerninhalte
- [x] **Szenarien-Manager**: Menü zum Laden vordefinierter Situationen.
    - [x] *Asteroiden-Flyby*: Setup mit Planet und vorbeifliegendem Asteroiden.
    - [x] *Sonnenfinsternis*: Sonne-Erde-Mond Ausrichtung.
    - [x] *Instabiles System*: 3-Körper-Problem Demo.
- [ ] **Maßstabs-Anzeige**: Visuelle Skala (km / AU) unten rechts, die sich dem Zoom anpasst.


### UI/UX & Immersion
- [ ] **Analyse der jetzigen UI/UX & Implementation**:
    - [x] Analyse durchgeführt (Screenshots & Code-Review).
    - [x] Konsistenz geprüft: "Glassmorphism" Style ist weitgehend konsistent.
    - [x] Überlappungen behoben: Object Inspector nach unten links verschoben.
    - [x] UI Konsolidierung: View Settings in "Optionen" Panel integriert.
    - [x] Header bereinigt: Doppelte Buttons entfernt.
    - [x] Toolbar Toggle: "Werkzeuge" Button im Header implementiert.
    - [x] Fehlende Tools: Binär, W. Zwerg, Black Hole hinzugefügt.
    - [x] Lagrange Pilot: Toggle-Logik korrigiert.
    - [x] UI Cleanup: Untere Toolbar entfernt.
- [ ] **UI/UX Critical Analysis & Optimizations**:
    - [x] **Remove Redundant Top-Right Buttons**: "Orbit Planer" and "Lagrange Punkte" are duplicated in the Toolbar. Remove the top-right container to clear the view.
    - [x] **Fuel & Delta-v Display**: Essential for the rocket mission mode.
    - [ ] **Onboarding/Tutorial**: A simple "Guide" mode to explain the tools.
- [x] **Refactoring & Verbesserungen**:
    - [x] **Toolbar Refactoring**: Extrahiere die Top-Left Buttons in `src/Toolbar.jsx`. Gruppiere Tools und Toggles logisch.
    - [x] **Mission HUD Refactoring**: Extrahiere den Raketen-Status in `src/MissionHUD.jsx`. Verbessere das Layout (Grid statt Liste).
    - [x] **Styling Standardisierung**: Stelle sicher, dass alle Panels (Toolbar, MissionHUD) die gleichen CSS-Klassen nutzen (`bg-slate-900/90`, `backdrop-blur-sm`, `rounded-xl`).
    - [x] **Time Controls**: Prüfe Klickbarkeit (Z-Index) und Positionierung.
    - [x] **Shadow Simulation**: Implementierung einer Sonnenlicht-Simulation, die bei Bedarf eingeschaltet werden kann (Schattenkegel). 
    - [x] **kern schatten simulation**: erweiter die schatten simulation mit kernschatten und schatten der objekte. Pass eventruell auch die abstände bei dem sonnenfinsternis zenario an, so dass die objekte nicht zu nah an der sonne platziert werden und es realistische verhältnisse gibt.
    - [x] **Geschwindikeits kontrolle ** : man soll die simulation nicht nur stopen, schneller machen können sondern auch langsamer machen. 
    - [x] ** vor und zurück**: man soll die simulation auch vor und zurück laufen lassen. Der scheibe regeler, der grade die geschwindigkeit steuert, soll die simulation vor und zurück laufen lassen. 
    - [/] ** Fokus button ** : wenn man den drückt wird man auf das objekt fokussiert was entweder die meiste masse hat oder das obejt was am zentrum platziert ist. <!-- id: 5 -->
    - [/] ** Move button ** : wenn man den drückt, sollen keine objekte mehr plaziert werden und man kann mit linkeklick und zihene die karte verscheiben. <!-- id: 6 --> 

## 🚀 Priorität 3: Raketen & Missionen (Vertiefung)
- [ ] **Treibstoff & Delta-v**: Anzeige von Delta-v Budget im HUD. Begrenzter Treibstoff mit Nachfüll-Möglichkeit (Cheat/Station).
- [ ] **Startfenster-Visualisierung**: Grafische Anzeige des optimalen Startfensters (Phase Angle) im Mission Planner, nicht nur als Text im Log.
- [ ] **Manuelle Manöver-Nodes**: Wie in KSP – Setzen eines geplanten Burns auf dem Orbit und Visualisierung der neuen Bahn (Erweiterung des Orbit Planers).

## 🎨 Priorität 4: UI/UX & Immersion
- [ ] **Speichern/Laden**: Export und Import des aktuellen System-Zustands als JSON.
- [ ] **Audio**: Soundeffekte für Raketenstarts, Kollisionen, UI-Interaktion.
- [ ] **Einstellungen**: Grafik-Optionen (Trail-Länge, Partikel-Anzahl) für Performance.
- [ ] **Mobile Support**: Touch-Controls für Zoom/Pan und Buttons optimieren.

## ✅ Erledigt
- [x] **Lagrange Punkte Rendering**
- [x] **Lagrange Pilot (Snap)**
- [x] **Planeten Benennung**
- [x] **Zoom mit Mauszeiger-Fokus**
- [x] **Basis-Raketen-Missionen (Start, Orbit, Transfer)**