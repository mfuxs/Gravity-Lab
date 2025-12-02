export const SCENARIOS = [
  {
    id: 'solar_system',
    name: 'Sonnensystem (Standard)',
    description: 'Unser Sonnensystem mit Sonne, Planeten und Monden.',
    zoom: 0.15,
    pan: { x: 0, y: 0 },
    bodies: [] // Empty means "generate default"
  },
  {
    id: 'asteroid_flyby',
    name: 'Asteroiden-Flyby',
    description: 'Ein Asteroid auf Kollisionskurs mit dem Erde-Mond System.',
    zoom: 0.8,
    pan: { x: 0, y: 0 },
    bodies: [
      { type: 'star', x: -2000, y: 0, vx: 0, vy: 0, mass: 1500, color: '#fbbf24', name: 'Sonne' },
      { type: 'planet', x: 0, y: 0, vx: 0, vy: 0.77, mass: 150, color: '#3b82f6', name: 'Erde' }, // v approx sqrt(0.8*1500/2000) = 0.77
      { type: 'asteroid', x: 100, y: 0, vx: 0, vy: 1.86, mass: 10, color: '#94a3b8', name: 'Mond' }, // v_moon approx 0.77 + sqrt(0.8*150/100) = 0.77 + 1.09 = 1.86
      { type: 'asteroid', x: -300, y: 100, vx: 2.0, vy: 0.5, mass: 5, color: '#ef4444', name: 'Apophis' }
    ]
  },
  {
    id: 'three_body',
    name: '3-Körper Chaos',
    description: 'Drei gleich schwere Sterne in einer instabilen Konfiguration.',
    zoom: 0.4,
    pan: { x: 0, y: 0 },
    bodies: [
      { type: 'star', x: 200, y: 0, vx: 0, vy: 1, mass: 800, color: '#fbbf24', name: 'Alpha' },
      { type: 'star', x: -100, y: 173, vx: -0.866, vy: -0.5, mass: 800, color: '#fbbf24', name: 'Beta' },
      { type: 'star', x: -100, y: -173, vx: 0.866, vy: -0.5, mass: 800, color: '#fbbf24', name: 'Gamma' }
    ]
  },
  {
    id: 'eclipse',
    name: 'Sonnenfinsternis',
    description: 'Perfekte Ausrichtung von Sonne, Mond und Erde.',
    zoom: 1.5,
    pan: { x: 500, y: 0 },
    bodies: [
      { type: 'star', x: -1000, y: 0, vx: 0, vy: 0, mass: 2000, color: '#fbbf24', name: 'Sonne' },
      { type: 'planet', x: 500, y: 0, vx: 0, vy: 1.26, mass: 100, color: '#3b82f6', name: 'Erde' },
      { type: 'asteroid', x: 450, y: 0, vx: 0, vy: 2.52, mass: 5, color: '#94a3b8', name: 'Mond' } // Between Sun and Earth
    ]
  }
];
