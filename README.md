# Interaktive Gravitation- und Orbital-Simulation

Eine interaktive Web-Anwendung zur Simulation von Gravitationsfeldern und Orbitalmechanik im Browser. Dieses Projekt ermöglicht es Benutzern, die Auswirkungen der Schwerkraft auf Himmelskörper visuell zu erforschen und Raumfahrtmissionen zu planen.

## 🚀 Projektziel

Die Web-App zeigt in einer zweidimensionalen Ansicht, wie sich Gravitationsfelder verschiedener Himmelskörper gegenseitig beeinflussen. Nutzer erhalten ein intuitives Gefühl für Schwerkraft, Orbitalmechanik und Raumfahrtmissionen, ohne tiefgehendes Vorwissen zu benötigen.

## ✨ Kernfunktionen

*   **Interaktives Sonnensystem:** Startet mit einem referenziellen Sonnensystem (Sonne, Planeten, Monde).
*   **Objekterstellung:** Hinzufügen von Planeten, Monden, Asteroiden, Sternen und Schwarzen Löchern mit anpassbaren Parametern (Masse, Radius, Position, Geschwindigkeit).
*   **Realistische Physik:** Echtzeit-Berechnung der Gravitation basierend auf Newtonschem Gesetz.
*   **Orbitalmechanik-Tools:**
    *   **Orbitalplaner:** Vorschläge für Transferbahnen (z.B. Hohmann-Transfer).
    *   **Lagrange-Punkte:** Visualisierung von Stabilitätszonen.
    *   **Informationslayer:** Anzeige von Gravitationspotenzialen und Geschwindigkeitsvektoren.
*   **Missionsplanung:** Simulation von Raketenstarts, Stufentrennung und interplanetaren Transfers.
*   **Zeitsteuerung:** Zeitraffer und Zeitlupe zur Beobachtung langfristiger Effekte.
*   **Zoom & Skalierung:** Stufenloser Zoom vom Raumschiff bis zur Übersicht des Sonnensystems.

## 🛠️ Technologien

*   **Frontend:** [React](https://react.dev/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Testing:** [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/)

## 📦 Installation & Nutzung

Voraussetzung: [Node.js](https://nodejs.org/) ist installiert.

1.  **Repository klonen:**
    ```bash
    git clone https://github.com/mfuxs/Gravity-Lab.git
    cd Gravity-Lab
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

3.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```
    Die App ist nun unter `http://localhost:5173` erreichbar.

4.  **Projekt bauen:**
    ```bash
    npm run build
    ```

## 🧪 Tests

Tests werden mit Vitest ausgeführt:

```bash
npm run test
```

## 🎯 Lernziele

*   Verständnis für den Einfluss von Masse, Abstand und Geschwindigkeit auf Orbits.
*   Erkenntnisse über stabile Umlaufbahnen und Störungen.
*   Grundlagen der Raumfahrt: Fluchtgeschwindigkeit, Hohmann-Transfer, Lagrange-Punkte.
