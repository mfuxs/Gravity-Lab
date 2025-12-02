# Projekt Roadmap & TODOs

## Priorität 0 – Stabilisierung & Sicherheit
- [x] **Input-Handling härten (S)**: Event-Listener ohne anonyme Funktionen registrieren, `detach` reparieren und Pointer-/Keyboard-States gegen Leaks und Race-Conditions absichern; automatisierte Tests ergänzen.
- [x] **Renderer entlasten (M)**: Orbit-Vorschau aus dem Render-Loop auslagern (Worker oder Memoization), Schrittanzahl konfigurierbar machen und Fallback bei vielen Bodies einführen, damit Frames nicht blockieren.
- [x] **Missions-Autopilot robust machen (M)**: Schutz vor fehlenden Zielkörpern/Planetendaten, doppelte Schub-Anwendung entfernen, Treibstoff-/Massenmodell zentralisieren und Logs/Fehlerzustände für HUD bereitstellen.
- [x] **Physik-Governance (M)**: Quadtree- bzw. N-Body-Schritte gegen entgrenzte Werte absichern (NaN/Infinity-Watchdog, Softening-/Zeitschritt-Konfiguration), Validierung bei Body-Erzeugung und Kollisionen einziehen.

## Priorität 1 – Architektur, Wartbarkeit & Tests
- [ ] **GravitySimV10 zerlegen (L)**: Rendering-/Physik-Schleife, UI/Overlay-Logik, Missions-Flow und Scenario-Management in eigene Hooks/Module trennen; gemeinsame Konstanten/Konfiguration extrahieren.
- [ ] **Typisierung & Verträge (M)**: PropTypes oder TypeScript für Komponenten (Toolbar, MissionHUD, ObjectInspector, TimeControls) und Datenstrukturen (Bodies, Scenarios, Store-State) ergänzen; Eingabewerte validieren.
- [ ] **Beobachtbarkeit & Fehlertoleranz (M)**: Logging/Telemetry für kritische Events (Kollision, Autopilot, Scenario-Load), Error-Boundary um Simulationsansicht sowie UI-States für Lade-/Fehlerfälle einführen.
- [ ] **Testabdeckung ausbauen (M)**: Renderer (Orbit-/Shadow-Layer), GravitySim-Interaktionen (Toolwechsel, Scenario-Load), MissionControl-Phasen, TimeControls-Slider und Store-Actions mit Unit-/Integration-Tests abdecken.
- [ ] **Style-/Layout-Aufräumung (S)**: Veraltetes `App.css` entfernen oder durch globale Layout-Regeln ersetzen, Tailwind-Basis vereinheitlichen und z-Index/Responsiveness dokumentieren.

## Priorität 2 – Features & Nutzererlebnis
- [ ] **Maßstabs-/Einheitenanzeige (M)**: Dynamische Skala passend zum Zoom und konsistente Einheiten im HUD.
- [ ] **Zustände speichern/laden (M)**: Szenarien und Benutzer-Setups als JSON exportieren/importieren, optional Auto-Save im LocalStorage.
- [ ] **Onboarding/Tutorial (M)**: Geführter Ablauf (erste Objekte, TimeControls, Mission-Start) mit Skip-Option und Hinweis-Layer.
- [ ] **Bedienkomfort (S)**: Tasten-Shortcuts für Tool-Wahl/Zoom/Play-Pause sowie barrierearme Fokus-States ergänzen.

## Priorität 3 – Betriebsfähigkeit & Dokumentation
- [ ] **CI/CD-Pipeline (M)**: Automatisierte Lint-/Test-/Build-Pipeline (z.B. GitHub Actions) und Preview-Deploy für Branches.
- [ ] **Projekt-Dokumentation (M)**: README/Projekt.md um Architektur-Überblick, Simulationsannahmen, Performance-Tuning, Known-Issues und lokale Setup-/Test-Hinweise erweitern.
