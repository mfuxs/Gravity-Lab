import React, { useRef, useEffect, useState } from 'react';
import {
  Play, Pause, RefreshCw, Trash2, Info,
  Disc, MousePointer2, ZoomIn, ZoomOut,
  Orbit, Sun, Activity, Network, Repeat, Anchor,
  Globe, Trophy, Medal, Cpu, Rocket, Target, Crosshair, Wrench
} from 'lucide-react';
import { Body, Particle, physicsStep, G, SOFTENING, TRAIL_LENGTH, PHYSICS_SUBSTEPS } from './PhysicsEngine';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';
import { useSimStore } from './store';
import { ObjectInspector } from './ObjectInspector';
import { TimeControls } from './TimeControls';
import { ScenarioMenu } from './ScenarioMenu';
import { Toolbar } from './Toolbar';
import { MissionHUD } from './MissionHUD';


const GravitySimV10 = () => {
  const canvasRef = useRef(null);

  // --- UI States (from Store) ---
  const {
    tool, setTool,
    isRunning, setIsRunning, toggleRunning,
    showHelp, setShowHelp,
    missionState, setMissionState,
    missionConfig, setMissionConfig, resetMissionConfig,
    timeScale, setTimeScale,
    selectedBody, setSelectedBody,
    showVectors, toggleShowVectors,
    showHillSpheres, toggleShowHillSpheres,
    showOrbitPaths, toggleShowOrbitPaths,
    showShadows, toggleShowShadows,
    currentScenario
  } = useSimStore();

  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

  // Local UI State (Visuals only)
  const [bodyCount, setBodyCount] = useState(0);
  const [showOrbitPreview, setShowOrbitPreview] = useState(false);
  const [showLagrange, setShowLagrange] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [highPrecision, setHighPrecision] = useState(true);

  // Rocket HUD State
  const [rocketStats, setRocketStats] = useState(null);
  const [rocketCount, setRocketCount] = useState(0); // Progression Counter

  // Achievements & Events State
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [notification, setNotification] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null); // For modal events
  const [isPaused, setIsPaused] = useState(false); // Game pause state for events

  // Refs
  const bodiesRef = useRef([]);
  const particlesRef = useRef([]);
  const requestRef = useRef();
  const keysRef = useRef({});
  const cameraTargetRef = useRef(null); // ID des verfolgten Objekts

  // Navigation Refs
  const dragRef = useRef({
    isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0, dragType: 'create'
  });
  const viewRef = useRef({ x: 0, y: 0, zoom: 0.5 });
  const lastPanRef = useRef({ x: 0, y: 0 });
  const timeScaleRef = useRef(0.5); // Dynamic Time Scale
  const historyRef = useRef([]); // Stores simulation states
  const historyIndexRef = useRef(-1); // Current position in history
  const timeAccumulatorRef = useRef(0); // For fractional time steps



  // Achievement Definitions
  const ACHIEVEMENTS = [
    { id: 'first_steps', title: 'Urknall', desc: 'Starte die Simulation.', icon: '💥' },
    { id: 'orbit_master', title: 'Uhrwerk', desc: 'Ein Objekt kreist seit 20s stabil.', icon: '⏱️' },
    { id: 'rocket_launch', title: 'Liftoff', desc: 'Rakete erfolgreich gestartet.', icon: '🚀' },
    { id: 'rocket_orbit', title: 'Raumfahrer', desc: 'Rakete hat einen stabilen Orbit erreicht.', icon: '👨‍🚀' },
    { id: 'moon_landing', title: 'Adler gelandet', desc: 'Rakete hat einen anderen Körper berührt.', icon: '🏁' },
    { id: 'lagrange_master', title: 'Lagrange Punkt', desc: 'Objekt in L4/L5 geparkt.', icon: '⚓' },
    { id: 'space_age', title: 'Weltraumzeitalter', desc: 'Der erste Satellit ist im Orbit.', icon: '🛰️' }
  ];

  const MILESTONES = [
    { count: 1, title: 'Sputnik 1', desc: 'Der erste künstliche Satellit erreicht den Orbit.', icon: '🛰️', type: 'satellite' },
    { count: 3, title: 'Kommunikations-Relais', desc: 'Ein Netzwerk für globale Kommunikation.', icon: '📡', type: 'relay' },
    { count: 5, title: 'Raumstation Kern', desc: 'Das erste Modul einer dauerhaften Station.', icon: '🏠', type: 'station_core' },
    { count: 8, title: 'Forschungsmodul', desc: 'Erweiterung der Station für Experimente.', icon: '🔬', type: 'station_module' },
    { count: 12, title: 'Bemannte Mission', desc: 'Die ersten Menschen im All.', icon: '👨‍🚀', type: 'manned' },
    { count: 15, title: 'Mondbasis Alpha', desc: 'Eine permanente Basis auf dem Mond.', icon: '🌑', type: 'moon_base' },
  ];

  const configRef = useRef({
    isRunning, showOrbitPreview, showLagrange, tool, unlockedAchievements, highPrecision,
    showVectors, showHillSpheres, showOrbitPaths, showShadows
  });

  useEffect(() => {
    configRef.current = {
      isRunning, showOrbitPreview, showLagrange, tool, unlockedAchievements, highPrecision,
      showVectors, showHillSpheres, showOrbitPaths, showShadows
    };
    if (tool === 'lagrange_pilot') setShowLagrange(true);
  }, [isRunning, showOrbitPreview, showLagrange, tool, unlockedAchievements, highPrecision, showVectors, showHillSpheres, showOrbitPaths]);

  // Handle Scenario Loading
  useEffect(() => {
    if (currentScenario) {
      // Clear existing bodies
      bodiesRef.current = [];
      particlesRef.current = [];

      // Load new bodies
      if (currentScenario.bodies.length > 0) {
        currentScenario.bodies.forEach(b => {
          bodiesRef.current.push(new Body(b.x, b.y, b.vx, b.vy, b.mass, b.color, b.type, false, b.name));
        });
      } else {
        // Default System
        initSystem();
      }

      // Update View
      viewRef.current = { x: currentScenario.pan.x, y: currentScenario.pan.y, zoom: currentScenario.zoom };
      setBodyCount(bodiesRef.current.length);
    }
  }, [currentScenario]);

  // Sync Time Scale
  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  // --- Engine ---

  const unlockAchievement = (id) => {
    if (!configRef.current.unlockedAchievements.includes(id)) {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      setUnlockedAchievements(prev => [...prev, id]);
      setNotification(ach);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const spawnParticles = (x, y, color, count, speed) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed;
      particlesRef.current.push(new Particle(x, y, Math.cos(angle) * vel, Math.sin(angle) * vel, color, 20 + Math.random() * 30));
    }
  };


  const checkCollisions = () => {
    const bodies = bodiesRef.current;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const b1 = bodies[i];
        const b2 = bodies[j];
        if (b1.mass === 0 || b2.mass === 0) continue;

        // Grace Period Check: Wenn einer eine Rakete mit Grace ist
        if ((b1.type === 'rocket' && b1.gracePeriod > 0) || (b2.type === 'rocket' && b2.gracePeriod > 0)) continue;

        const dx = b2.x - b1.x; const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < b1.radius + b2.radius) {
          let victim, winner;
          if (b1.type === 'rocket' || b2.type === 'rocket') {
            unlockAchievement('moon_landing');
            victim = b1.type === 'rocket' ? b1 : b2;
            winner = b1.type === 'rocket' ? b2 : b1;
          } else {
            if (b1.mass >= b2.mass) { winner = b1; victim = b2; }
            else { winner = b2; victim = b1; }
          }

          if (!winner.isStatic) {
            const totalMass = winner.mass + victim.mass;
            winner.vx = (winner.vx * winner.mass + victim.vx * victim.mass) / totalMass;
            winner.vy = (winner.vy * winner.mass + victim.vy * victim.mass) / totalMass;
            winner.mass = totalMass;
            if (winner.type !== 'blackhole' && winner.type !== 'rocket') {
              winner.radius = Math.sqrt(totalMass) * (winner.type === 'star' ? 1.2 : 2);
            }
          }
          spawnParticles(victim.x, victim.y, victim.color, 15, 2);
          victim.mass = 0;
        }
      }
    }
    for (let i = bodies.length - 1; i >= 0; i--) {
      if (bodies[i].mass === 0) {
        // If we deleted the camera target, reset lock
        if (bodies[i] === cameraTargetRef.current) cameraTargetRef.current = null;
        bodies.splice(i, 1);
      }
    }
  };

  const physicsLoop = () => {
    if (bodiesRef.current.length > 0) unlockAchievement('first_steps');
    const steps = configRef.current.highPrecision ? PHYSICS_SUBSTEPS : 1;
    const dt = (1 / steps); // Always positive dt for physics calculation

    // Accumulate time debt
    timeAccumulatorRef.current += Math.abs(timeScaleRef.current);

    // How many "frames" of simulation to process this render tick
    const framesToProcess = Math.floor(timeAccumulatorRef.current);

    // We only consume the accumulator if we actually process frames
    // But for < 1 speeds, we might process 0 frames.
    // We should decrement only what we use.
    if (framesToProcess > 0) {
      timeAccumulatorRef.current -= framesToProcess;
    }

    // --- TIME TRAVEL LOGIC ---
    if (timeScaleRef.current > 0) {
      // FORWARD: Calculate Physics & Record

      // If framesToProcess is 0 (slow motion waiting), we don't run physics
      // But we still record the state (duplicate) to maintain playback speed

      if (framesToProcess > 0) {
        const totalSteps = framesToProcess * steps;
        for (let s = 0; s < totalSteps; s++) {
          physicsStep(dt, bodiesRef.current, configRef.current, spawnParticles, keysRef.current, timeScaleRef);
        }
        checkCollisions();
      }

      // Record State (every frame)
      const snapshot = bodiesRef.current.map(b => ({
        id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, mass: b.mass, radius: b.radius,
        color: b.color, type: b.type, isStatic: b.isStatic, name: b.name,
        trail: [...b.trail], // Copy trail
        controller: b.controller ? { fuel: b.controller.fuel } : null
      }));

      // If we were in the past, overwrite the future
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      }

      historyRef.current.push(snapshot);
      historyIndexRef.current++;

      // Limit History Size (e.g., 3600 frames)
      if (historyRef.current.length > 3600) {
        historyRef.current.shift();
        historyIndexRef.current--;
      }

    } else if (timeScaleRef.current < 0) {
      // REWIND: Replay History
      // Skip back 'framesToProcess' frames
      if (framesToProcess > 0) {
        historyIndexRef.current = Math.max(0, historyIndexRef.current - framesToProcess);

        if (historyRef.current[historyIndexRef.current]) {
          const snapshot = historyRef.current[historyIndexRef.current];

          // Restore State
          bodiesRef.current = snapshot.map(s => {
            const b = new Body(s.x, s.y, s.vx, s.vy, s.mass, s.color, s.type, s.isStatic, s.name);
            b.id = s.id;
            b.radius = s.radius;
            b.trail = s.trail;
            if (s.controller && b.controller) {
              b.controller.fuel = s.controller.fuel;
            }
            return b;
          });
          setBodyCount(bodiesRef.current.length);
        }
      }
    }
    // PAUSE (timeScale == 0): Do nothing

    let activeRocket = null;
    let nearestBodyDist = Infinity;

    bodiesRef.current.forEach(b => {
      b.updateTrail();
      if (b.type === 'rocket') {
        activeRocket = b;
        bodiesRef.current.forEach(other => {
          if (b !== other && other.mass > 100) {
            const d = Math.hypot(b.x - other.x, b.y - other.y) - other.radius;
            if (d < nearestBodyDist) nearestBodyDist = d;
          }
        });
        if (b.age > 1000 && nearestBodyDist > 100 && nearestBodyDist < 2000 && b.missionPhase === 'orbit') {
          // Only count if it's a fresh orbit
          if (!b.orbitAchieved) {
            b.orbitAchieved = true;
            unlockAchievement('rocket_orbit');
            setRocketCount(c => {
              const newCount = c + 1;
              checkMilestones(newCount);
              return newCount;
            });
          }
        }
      }
    });

    if (activeRocket) {
      const speed = Math.sqrt(activeRocket.vx ** 2 + activeRocket.vy ** 2);

      // --- ORBITAL PARAMETERS ---
      let apoapsis = '---';
      let periapsis = '---';
      let orbitalPeriod = '---';

      // Find primary attractor
      let primary = null;
      let minGravDist = Infinity;
      bodiesRef.current.forEach(b => {
        if (b !== activeRocket && (b.type === 'planet' || b.type === 'star')) {
          const d = Math.hypot(b.x - activeRocket.x, b.y - activeRocket.y);
          if (d < minGravDist) { minGravDist = d; primary = b; }
        }
      });

      if (primary) {
        const r = minGravDist;
        const v = speed;
        const mu = G * primary.mass;

        // Specific Orbital Energy: E = v^2/2 - mu/r
        const energy = (v * v) / 2 - mu / r;

        if (energy < 0) {
          // Elliptical Orbit
          const sma = -mu / (2 * energy); // Semi-major axis

          // Angular Momentum h = r x v (2D cross product magnitude)
          // We need relative velocity vector
          const dx = activeRocket.x - primary.x;
          const dy = activeRocket.y - primary.y;
          const dvx = activeRocket.vx - primary.vx; // Relative velocity
          const dvy = activeRocket.vy - primary.vy;

          const h = Math.abs(dx * dvy - dy * dvx);

          // Eccentricity e = sqrt(1 + 2*E*h^2 / mu^2)
          const eTerm = 1 + (2 * energy * h * h) / (mu * mu);
          const ecc = eTerm > 0 ? Math.sqrt(eTerm) : 0;

          const rPeri = sma * (1 - ecc);
          const rApo = sma * (1 + ecc);

          periapsis = Math.round(rPeri - primary.radius);
          apoapsis = Math.round(rApo - primary.radius);

          // Period T = 2*pi * sqrt(a^3 / mu)
          const T = 2 * Math.PI * Math.sqrt(Math.pow(sma, 3) / mu);
          orbitalPeriod = Math.round(T);
        } else {
          // Hyperbolic / Parabolic
          periapsis = "Esc";
          apoapsis = "Esc";
        }
      }

      setRocketStats({
        speed: speed.toFixed(2),
        fuel: Math.floor(activeRocket.fuel),
        alt: nearestBodyDist === Infinity ? '---' : Math.floor(nearestBodyDist),
        apoapsis,
        periapsis,
        period: orbitalPeriod,
        locked: !!cameraTargetRef.current,
        phase: activeRocket.missionPhase,
        logs: activeRocket.missionLog,
        fuel: activeRocket.controller ? activeRocket.controller.fuel : 0,
        deltaV: activeRocket.controller ? Math.round(activeRocket.controller.deltaV) : 0
      });
    } else {
      setRocketStats(null);
    }

    particlesRef.current.forEach(p => p.update());
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      if (particlesRef.current[i].life <= 0) particlesRef.current.splice(i, 1);
    }
    setBodyCount(bodiesRef.current.length);
  };

  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // --- Camera Follow Logic ---
    if (cameraTargetRef.current) {
      const target = cameraTargetRef.current;
      // Center the target: panX = ScreenCenter - BodyPos * Zoom
      // We animate zoom changes elsewhere or manually, for now follow pos
      // Smooth lerp for better feel? For precision controlling we want hard lock usually
      const targetX = -target.x * viewRef.current.zoom + canvas.width / 2;
      const targetY = -target.y * viewRef.current.zoom + canvas.height / 2;

      // Soft follow (Lerp)
      viewRef.current.x += (targetX - viewRef.current.x) * 0.1;
      viewRef.current.y += (targetY - viewRef.current.y) * 0.1;
    }

    const { x: panX, y: panY, zoom } = viewRef.current;
    const { showOrbitPreview, showLagrange, tool: currentTool } = configRef.current;
    const { currentX, currentY, isDragging } = dragRef.current;





    Renderer.render(
      canvas, ctx, bodiesRef.current, particlesRef.current, viewRef.current,
      configRef.current, dragRef.current, missionState, missionConfig, configRef.current.tool
    );
  };

  const handleFocus = () => {
    // 1. Try to find the heaviest object (Star/Blackhole)
    let target = bodiesRef.current.reduce((prev, current) => {
      return (prev.mass > current.mass) ? prev : current;
    }, bodiesRef.current[0]);

    // 2. If no bodies, or we want to prioritize center if multiple stars?
    // For now, heaviest is good.

    // 3. Alternatively, find object closest to 0,0 if masses are equal?
    if (!target && bodiesRef.current.length > 0) target = bodiesRef.current[0];

    if (target) {
      cameraTargetRef.current = target;
      // Optional: Zoom in/out to fit?
      // viewRef.current.zoom = 0.5; 
    } else {
      // Reset to center if no bodies
      viewRef.current.x = canvasRef.current.width / 2;
      viewRef.current.y = canvasRef.current.height / 2;
      cameraTargetRef.current = null;
    }
  };

  const tick = () => {
    if (configRef.current.isRunning && !isPaused) physicsLoop();
    renderLoop();
    requestRef.current = requestAnimationFrame(tick);
  };

  const initSystem = () => {
    const w = window.innerWidth; const h = window.innerHeight;
    bodiesRef.current = [];
    setBodyCount(0);
    setRocketCount(0); // Reset Progress
    cameraTargetRef.current = null;
    viewRef.current = { x: w / 2, y: h / 2, zoom: 0.15 }; // Zoom out to see the system

    // 1. Central Star (The Sun)
    const sunMass = 5000;
    const sun = new Body(0, 0, 0, 0, sunMass, '#fbbf24', 'star', false, "Sol"); // Sun is not static, but heavy
    // Give it a tiny velocity to drift? No, keep it central for now.
    bodiesRef.current.push(sun);

    // 2. Generate Planets
    const planetCount = 6 + Math.floor(Math.random() * 4); // 6 to 9 planets
    let currentDist = 600;
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#64748b', '#06b6d4', '#eab308'];
    const planetNames = ["Aether", "Boreas", "Chronos", "Demeter", "Erebus", "Gaia", "Hemera", "Iris", "Nyx", "Oceanus", "Pontus", "Tartarus", "Thalassa", "Uranus"];

    for (let i = 0; i < planetCount; i++) {
      // Distance increases with some randomness
      currentDist += 300 + Math.random() * 300;

      const angle = Math.random() * Math.PI * 2;
      const mass = 50 + Math.random() * 350;
      const radius = Math.sqrt(mass) * 2;
      const color = colors[i % colors.length];
      const name = planetNames[i % planetNames.length];

      const px = Math.cos(angle) * currentDist;
      const py = Math.sin(angle) * currentDist;

      // Circular Orbit Velocity: v = sqrt(G * M / r)
      // We assume Sun is dominant mass.
      const v = Math.sqrt(G * sunMass / currentDist);
      const vx = Math.cos(angle + Math.PI / 2) * v;
      const vy = Math.sin(angle + Math.PI / 2) * v;

      const planet = new Body(px, py, vx, vy, mass, color, 'planet', false, name);
      bodiesRef.current.push(planet);

      // 3. Generate Moons (for larger planets)
      if (mass > 150 && Math.random() > 0.3) {
        const moonCount = 1 + Math.floor(Math.random() * 2); // 1-2 moons
        for (let j = 0; j < moonCount; j++) {
          const mDist = radius + 30 + Math.random() * 40 + (j * 40);
          const mAngle = Math.random() * Math.PI * 2;
          const mMass = 5 + Math.random() * 15;

          const mx = px + Math.cos(mAngle) * mDist;
          const my = py + Math.sin(mAngle) * mDist;

          // Moon Velocity = Planet Velocity + Orbital Velocity around Planet
          const mvOrb = Math.sqrt(G * mass / mDist);
          const mvx = vx + Math.cos(mAngle + Math.PI / 2) * mvOrb;
          const mvy = vy + Math.sin(mAngle + Math.PI / 2) * mvOrb;

          const moon = new Body(mx, my, mvx, mvy, mMass, '#94a3b8', 'asteroid', false, `${name} ${j + 1}`); // Use asteroid type for moons for now or generic
          bodiesRef.current.push(moon);
        }
      }
    }

    setBodyCount(bodiesRef.current.length);
  };

  const checkMilestones = (count) => {
    const milestone = MILESTONES.find(m => m.count === count);
    if (milestone) {
      setIsPaused(true);
      setActiveEvent(milestone);
      spawnEventObject(milestone);
    }
  };

  const spawnEventObject = (milestone) => {
    // Find a stable body to orbit (usually the first planet or star)
    const host = bodiesRef.current.find(b => b.type === 'planet') || bodiesRef.current.find(b => b.type === 'star');
    if (!host) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = host.radius + 100 + (Math.random() * 50); // Low orbit

    const x = host.x + Math.cos(angle) * dist;
    const y = host.y + Math.sin(angle) * dist;

    // Circular orbit velocity
    const v = Math.sqrt(G * host.mass / dist);
    const vx = host.vx + Math.cos(angle + Math.PI / 2) * v;
    const vy = host.vy + Math.sin(angle + Math.PI / 2) * v;

    let type = 'satellite';
    let color = '#a855f7';
    let mass = 5;

    if (milestone.type === 'station_core') { type = 'station'; color = '#e2e8f0'; mass = 20; }

    const obj = new Body(x, y, vx, vy, mass, color, type);
    bodiesRef.current.push(obj);
    if (milestone.type === 'satellite') unlockAchievement('space_age');
  };

  const closeEvent = () => {
    setIsPaused(false);
    setActiveEvent(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    initSystem();
    requestRef.current = requestAnimationFrame(tick);
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const handleKeyDown = (e) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e) => { keysRef.current[e.key] = false; };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Input Handlers ---
  const handleWheel = (e) => {
    e.preventDefault();
    // Disable manual zoom if locked? No, allow user to override zoom level but keep pos locked
    const { x: panX, y: panY, zoom } = viewRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // World coordinates before zoom
    const worldX = (mouseX - panX) / zoom;
    const worldY = (mouseY - panY) / zoom;

    const zoomFactor = 1.1;
    const newZoom = e.deltaY > 0 ? zoom / zoomFactor : zoom * zoomFactor;

    // Clamp zoom
    const clampedZoom = Math.max(0.05, Math.min(8, newZoom));

    // Calculate new pan to keep world point under mouse
    // mouseX = worldX * newZoom + newPanX
    // => newPanX = mouseX - worldX * newZoom
    const newPanX = mouseX - worldX * clampedZoom;
    const newPanY = mouseY - worldY * clampedZoom;

    viewRef.current = { x: newPanX, y: newPanY, zoom: clampedZoom };
  };


  // --- Helper Functions ---


  // --- Input Handling ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const inputHandler = new InputHandler(canvas, {
      getState: () => {
        const state = useSimStore.getState();
        return {
          tool: state.tool,
          view: viewRef.current,
          bodies: bodiesRef.current,
          missionState: state.missionState,
          missionConfig: state.missionConfig
        };
      },
      updateDrag: (newDrag) => {
        dragRef.current = newDrag;
        // Force re-render if dragging state changes to show/hide UI overlays?
        // Actually, renderLoop runs on RAF, so visual updates are automatic.
        // But if we need React UI updates (like cursor change), we might need state.
        // For now, let's trust the ref update.
      },
      updateView: (newView) => {
        viewRef.current = newView;
      },
      updateKeys: (newKeys) => {
        keysRef.current = newKeys;
      },
      onDragEnd: (dragData) => {
        // Handle creation logic here or delegate back to InputHandler?
        // Let's keep the complex creation logic here for now to avoid moving too much at once.
        handleEnd(dragData);
      }
    });

    inputHandler.attach();

    return () => {
      inputHandler.detach();
    };
  }, [missionState, missionConfig]); // Re-attach if mission state changes? Or just use ref in getState?
  // getState uses refs for tool, view, bodies. But missionState is state.
  // So we need to ensure getState returns fresh state.
  // The closure in useEffect captures initial state unless we use refs or functional updates.
  // InputHandler calls callbacks.getState().
  // If we pass a function that reads state, it will be stale if not in dep array.
  // BETTER: Use a ref for missionState too? Or just let the effect re-run.
  // Re-running effect re-creates InputHandler. That's fine.

  const handleEnd = (dragData) => {
    if (!dragData.isDragging) return;
    if (dragData.dragType === 'create') {
      const { startX, startY, currentX, currentY } = dragData;
      const { x: panX, y: panY, zoom } = viewRef.current;
      const tool = configRef.current.tool;
      const worldStartX = (startX - panX) / zoom;
      const worldStartY = (startY - panY) / zoom;
      const worldCurrX = (currentX - panX) / zoom;
      const worldCurrY = (currentY - panY) / zoom;

      // Check if it was a click (no drag)
      const dragDist = Math.hypot(startX - currentX, startY - currentY);
      const isClick = dragDist < 5;

      if (isClick) {
        // --- SELECTION LOGIC ---
        const mouseX = (currentX - panX) / zoom;
        const mouseY = (currentY - panY) / zoom;

        // Find clicked body
        let clicked = null;
        for (let i = bodiesRef.current.length - 1; i >= 0; i--) {
          const b = bodiesRef.current[i];
          const d = Math.hypot(b.x - mouseX, b.y - mouseY);
          const hitRadius = Math.max(b.radius, 10 / zoom);
          if (d < hitRadius) {
            clicked = b;
            break;
          }
        }

        if (clicked) {
          // Mission Planner Selection
          if (tool === 'rocket') {
            if (missionState === 'selecting_start') {
              setMissionConfig(prev => ({ ...prev, startBody: clicked }));
              setMissionState('selecting_target');
            } else if (missionState === 'selecting_target') {
              if (clicked !== missionConfig.startBody) {
                setMissionConfig(prev => ({ ...prev, targetBody: clicked }));
                setMissionState('ready');
                setIsRunning(true);
              }
            }
            // Also select for inspector? Maybe not if in mission mode.
            // Let's allow inspector selection too.
            setSelectedBody(clicked);
          } else {
            setSelectedBody(clicked);
          }
        } else {
          setSelectedBody(null);
        }
        return; // Stop here if it was a click
      }

      // --- SPAWN LOGIC (Only if dragged) ---

      // --- LAGRANGE PILOT LOGIC ---
      if (tool === 'lagrange_pilot') {
        const sun = bodiesRef.current.find(b => b.type === 'star');
        if (sun) {
          let snapped = false;
          bodiesRef.current.forEach(planet => {
            if (planet.type !== 'planet') return;
            const points = Renderer.getLagrangePoints(sun, planet);
            points.forEach(p => {
              const dMouse = Math.hypot(worldCurrX - p.x, worldCurrY - p.y);
              if (dMouse < 30 / zoom) { // Snap radius
                // Spawn at L-point with correct velocity
                const body = new Body(p.x, p.y, p.vx, p.vy, 10, '#fff', 'satellite');
                bodiesRef.current.push(body);
                unlockAchievement('lagrange_master');
                snapped = true;
              }
            });
          });

          if (!snapped) {
            // Normal spawn if not snapped
            const vx = (worldStartX - worldCurrX) * 0.05;
            const vy = (worldStartY - worldCurrY) * 0.05;
            bodiesRef.current.push(new Body(worldStartX, worldStartY, vx, vy, 10, '#fff', 'satellite'));
          }
        }
        return;
      }

      // --- MISSION PLANNER LOGIC ---
      if (tool === 'rocket') {
        // Rocket logic is handled in Selection Logic (Click)
        // Dragging in rocket mode does nothing (or could be used for something else later)
      } else if (tool === 'binary') {
        // Binary System Spawning
        const m = 800;
        const separation = 100;

        // Calculate orbital velocity for circular orbit: v = sqrt(G * M / (2 * r)) where r is half separation
        // Actually for two equal masses M orbiting common center at distance r (radius):
        // F_g = G * M * M / (2r)^2
        // F_c = M * v^2 / r
        // G * M^2 / 4r^2 = M * v^2 / r  =>  v^2 = G * M / 4r  => v = sqrt(G * M / (4 * r))
        // Here separation is 2r. So r = separation / 2.

        const r = separation / 2;
        const v = Math.sqrt((G * m) / (4 * r));

        const b1 = new Body(worldStartX - r, worldStartY, 0, v, m, '#fbbf24', 'star');
        const b2 = new Body(worldStartX + r, worldStartY, 0, -v, m, '#fbbf24', 'star');

        // Add initial velocity from drag
        const dragVx = (worldStartX - worldCurrX) * 0.05;
        const dragVy = (worldStartY - worldCurrY) * 0.05;

        b1.vx += dragVx; b1.vy += dragVy;
        b2.vx += dragVx; b2.vy += dragVy;

        bodiesRef.current.push(b1, b2);
      } else {
        // ... other tools spawn logic (simplified for brevity as requested focus is rocket) ...
        // (Re-inserting standard spawn logic to not break other tools)
        const worldCurrX = (currentX - panX) / zoom;
        const worldCurrY = (currentY - panY) / zoom;
        const vx = (worldStartX - worldCurrX) * 0.05;
        const vy = (worldStartY - worldCurrY) * 0.05;
        let m = 20, c = '#fff', t = 'asteroid';
        if (tool === 'planet') { m = 150; c = '#10b981'; t = 'planet'; }
        else if (tool === 'sun_system') { m = 1500; c = '#fbbf24'; t = 'star'; }
        else if (tool === 'blackhole') { m = 5000; c = '#000'; t = 'blackhole'; }
        else if (tool === 'whitedwarf') { m = 800; c = '#e2e8f0'; t = 'whitedwarf'; }

        bodiesRef.current.push(new Body(worldStartX, worldStartY, vx, vy, m, c, t, tool === 'blackhole'));
      }
    }
  };



  console.log("Rendering GravitySimV10", { tool, bodyCount });
  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans select-none">
      <canvas ref={canvasRef} className={`block w-full h-full ${tool === 'lagrange_pilot' || tool === 'rocket' ? 'cursor-crosshair' : 'cursor-default'}`}
      />

      {/* Notification */}
      {notification && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-yellow-500/50 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-4 animate-bounce z-50">
          <div className="text-3xl">{notification.icon}</div>
          <div><div className="text-yellow-400 text-xs font-bold uppercase">Errungenschaft!</div><div className="font-bold text-lg">{notification.title}</div></div>
        </div>
      )}

      {/* Mission Planner UI */}
      {tool === 'rocket' && !rocketStats && (
        <div className="absolute top-24 left-4 bg-slate-900/90 border border-blue-500/50 p-4 rounded-xl text-white w-64 backdrop-blur-sm z-40">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
            <Crosshair size={18} className="text-blue-400" />
            <span className="font-bold">Mission Control</span>
          </div>

          <div className="space-y-3">
            <div className={`p-2 rounded border ${missionState === 'selecting_start' ? 'bg-blue-900/40 border-blue-500 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
              <div className="text-[10px] uppercase text-slate-400">Phase 1</div>
              <div className="font-bold">{missionConfig.startBody ? 'Start: Planet' : 'Wähle Startplanet'}</div>
            </div>

            <div className={`p-2 rounded border ${missionState === 'selecting_target' ? 'bg-blue-900/40 border-blue-500 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
              <div className="text-[10px] uppercase text-slate-400">Phase 2</div>
              <div className="font-bold">{missionConfig.targetBody ? 'Ziel: Planet' : 'Wähle Zielplanet'}</div>
            </div>

            {missionState === 'idle' && (
              <button onClick={() => { setMissionState('selecting_start'); setIsRunning(false); }} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold text-sm">
                Neue Mission planen
              </button>
            )}

            {(missionState === 'selecting_start' || missionState === 'selecting_target') && (
              <div className="text-xs text-center text-blue-300 animate-pulse">
                Klicke auf einen Planeten...
              </div>
            )}

            {missionState === 'ready' && (
              <button
                onClick={() => {
                  // LAUNCH SEQUENCE
                  const { startBody, targetBody } = missionConfig;
                  if (!startBody || !targetBody) return;

                  // Spawn Rocket at Start Body
                  const angle = Math.random() * Math.PI * 2;
                  const spawnDist = startBody.radius + 25;
                  const rX = startBody.x + Math.cos(angle) * spawnDist;
                  const rY = startBody.y + Math.sin(angle) * spawnDist;
                  const rVx = startBody.vx; // Match velocity roughly
                  const rVy = startBody.vy;

                  const rocket = new Body(rX, rY, rVx, rVy, 1, '#facc15', 'rocket');
                  rocket.configureMissionProfile(bodiesRef.current);
                  rocket.angle = angle + Math.PI / 2;
                  rocket.targetBody = targetBody; // Pre-set target

                  // Skin
                  if (rocketCount < 3) rocket.skin = 'prototype';
                  else if (rocketCount < 8) rocket.skin = 'scout';
                  else rocket.skin = 'cruiser';

                  bodiesRef.current.push(rocket);
                  cameraTargetRef.current = rocket;
                  viewRef.current.zoom = 2.5;
                  unlockAchievement('rocket_launch');

                  setMissionState('active');
                }}
                className="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-bold text-sm flex items-center justify-center gap-2"
              >
                <Rocket size={16} /> START MISSION
              </button>
            )}

            {missionState !== 'idle' && (
              <button onClick={() => { resetMissionConfig(); setIsRunning(true); }} className="w-full mt-2 bg-slate-800 hover:bg-slate-700 py-1 rounded text-xs text-slate-400">
                Abbrechen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rocket HUD */}
      {rocketStats && (
        <div className="absolute bottom-24 left-4 bg-slate-900/90 border border-slate-700 p-4 rounded-xl text-white w-52 backdrop-blur-sm pointer-events-none">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
            <Rocket size={18} className="text-yellow-400" />
            <span className="font-bold">Raketen Status</span>
            {rocketStats.locked && <Crosshair size={14} className="text-red-500 ml-auto animate-pulse" />}
          </div>
          <div className="space-y-1 text-sm font-mono">
            <div className="flex justify-between"><span>Status:</span> <span className="text-yellow-300 uppercase">{rocketStats.phase}</span></div>
            <div className="flex justify-between"><span>Geschw.:</span> <span className="text-blue-300">{rocketStats.speed}</span></div>
            <div className="flex justify-between"><span>Höhe:</span> <span className="text-emerald-300">{rocketStats.alt}</span></div>
            <div className="flex justify-between border-t border-slate-700 pt-1 mt-1"><span>Apoapsis:</span> <span className="text-purple-300">{rocketStats.apoapsis}</span></div>
            <div className="flex justify-between"><span>Periapsis:</span> <span className="text-purple-300">{rocketStats.periapsis}</span></div>
            <div className="flex justify-between"><span>Periode:</span> <span className="text-slate-300">{rocketStats.period}s</span></div>

            {/* Mission Log */}
            <div className="mt-2 pt-2 border-t border-slate-700">
              <div className="text-[10px] text-slate-400 font-bold mb-1">MISSION PLAN</div>
              {rocketStats.logs && rocketStats.logs.map((log, i) => (
                <div key={i} className="text-[10px] text-slate-300">{log}</div>
              ))}
            </div>

            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1"><span>Treibstoff</span> <span>{rocketStats.fuel}%</span></div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${rocketStats.fuel < 20 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${rocketStats.fuel}%` }}></div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 text-center">AUTO-PILOT AKTIV | Rechtsklick = Cam Unlock</div>

          {rocketStats.phase === 'orbit' && (
            <button
              onClick={() => {
                // Trigger manual transfer scan
                // We need to find the rocket object. It's activeRocket in physicsLoop but we don't have direct ref here easily unless we store it or iterate.
                // Better: Set a flag in rocketStats or use a ref.
                // Actually, we can just iterate bodiesRef to find the rocket and set its state.
                const rocket = bodiesRef.current.find(b => b.type === 'rocket');
                if (rocket) {
                  rocket.missionPhase = 'orbit'; // Reset to ensure
                  rocket.targetBody = null; // Clear prev
                  // Force trigger target find
                  const nearest = bodiesRef.current.find(b => b !== rocket && (b.type === 'planet' || b.type === 'star') && Math.hypot(b.x - rocket.x, b.y - rocket.y) < 2000); // Current host
                  const potentialTargets = bodiesRef.current.filter(b => b.type === 'planet' && b !== nearest);
                  if (potentialTargets.length > 0) {
                    rocket.targetBody = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                    rocket.missionPhase = 'transfer_calc';
                    rocket.missionLog.push(`Manual Override: Target ${rocket.targetBody.type}`);
                  }
                }
              }}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded transition-colors"
            >
              Reise zu Planet
            </button>
          )}
        </div>
      )}

      {/* Object Inspector */}
      <ObjectInspector bodiesRef={bodiesRef} cameraTargetRef={cameraTargetRef} />

      {/* Toolbar */}
      <Toolbar
        tool={tool} setTool={setTool}
        highPrecision={highPrecision} setHighPrecision={setHighPrecision}
        showOrbitPreview={showOrbitPreview} setShowOrbitPreview={setShowOrbitPreview}
        showLagrange={showLagrange} setShowLagrange={setShowLagrange}
        unlockedAchievements={unlockedAchievements}
        showVectors={showVectors} toggleShowVectors={toggleShowVectors}
        showHillSpheres={showHillSpheres} toggleShowHillSpheres={toggleShowHillSpheres}
        showOrbitPaths={showOrbitPaths} toggleShowOrbitPaths={toggleShowOrbitPaths}
        showShadows={showShadows} toggleShowShadows={toggleShowShadows}
        isOpen={isToolbarOpen}
        onFocus={handleFocus}
      />

      {/* Time Controls */}
      <TimeControls />

      {/* Scenario Menu */}
      <ScenarioMenu />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <div className="absolute top-4 left-4 pointer-events-auto">
          <h1 className="font-bold text-white flex items-center gap-2"><Orbit size={18} /> Gravity Lab v10</h1>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowAchievements(!showAchievements)} className="flex items-center gap-1 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 text-yellow-400 hover:bg-slate-700 text-xs">
              <Trophy size={14} /> {unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </button>
            <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 text-blue-400 text-xs">
              <Rocket size={14} /> Starts: {rocketCount}
            </div>
            <button onClick={() => setIsToolbarOpen(!isToolbarOpen)} className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs transition-colors ${isToolbarOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
              <Wrench size={14} /> Werkzeuge
            </button>
          </div>
        </div>

        {/* Event Modal */}
        {activeEvent && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] pointer-events-auto">
            <div className="bg-slate-900 border border-yellow-500/50 p-8 rounded-2xl max-w-md text-center shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-300">
              <div className="text-6xl mb-4">{activeEvent.icon}</div>
              <h2 className="text-2xl font-bold text-white mb-2">{activeEvent.title}</h2>
              <p className="text-slate-300 mb-6">{activeEvent.desc}</p>
              <button onClick={closeEvent} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded-full transition-colors">
                Fortfahren
              </button>
            </div>
          </div>
        )}

        {/* Achievement Modal */}
        {showAchievements && (
          <div className="absolute top-20 left-4 bg-slate-900/95 border border-slate-700 p-4 rounded-xl w-64 pointer-events-auto backdrop-blur-md max-h-[70vh] overflow-y-auto z-50">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Medal size={18} /> Errungenschaften</h3>
            <div className="space-y-3">
              {ACHIEVEMENTS.map(ach => (
                <div key={ach.id} className={`p-2 rounded-lg border ${unlockedAchievements.includes(ach.id) ? 'bg-slate-800 border-yellow-500/30' : 'bg-slate-900/50 border-slate-800 opacity-50'}`}>
                  <div className="flex items-center gap-2 mb-1"><span className="text-xl">{ach.icon}</span><span className="font-bold text-sm text-slate-200">{ach.title}</span></div>
                  <div className="text-xs text-slate-400">{ach.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default GravitySimV10;
