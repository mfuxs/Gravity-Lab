import { Quadtree } from './Quadtree';
import { MissionControl } from './MissionControl';

// --- Constants ---
export const G = 0.8;
export const SOFTENING = 5;
export const TRAIL_LENGTH = 120;
export const PHYSICS_SUBSTEPS = 8;

// --- Classes ---
export class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.life = life; this.maxLife = life;
  }
  update() { this.x += this.vx; this.y += this.vy; this.life--; }
  draw(ctx) {
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

export class Body {
  constructor(x, y, vx, vy, mass, color, type = 'asteroid', isStatic = false, name = null) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.name = name;
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.mass = mass; this.type = type;

    if (type === 'blackhole') this.radius = Math.sqrt(mass);
    else if (type === 'whitedwarf') this.radius = Math.sqrt(mass) * 0.6;
    else if (type === 'star') this.radius = Math.sqrt(mass) * 1.2;
    else if (type === 'rocket') this.radius = 2; // Smaller rocket for scale
    else this.radius = Math.sqrt(mass) * 2;

    this.color = color;
    this.trail = [];
    this.isStatic = isStatic;

    this.age = 0;
    this.orbitParent = null;
    this.orbitDuration = 0;

    // Rocket specifics
    this.angle = 0;
    this.controller = type === 'rocket' ? new MissionControl(this) : null;

    // Note: configureMissionProfile needs to be called explicitly after creation with bodies list
  }

  configureMissionProfile(bodies) {
    if (this.controller) {
      this.controller.configureMissionProfile(bodies);
    }
  }

  update(dt = 1, bodies = [], spawnParticles = () => { }, keys = {}, timeScaleRef = { current: 1 }) {
    if (!this.isStatic) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    if (this.controller) {
      this.controller.update(dt, bodies, keys, spawnParticles, timeScaleRef);
    } else if (this.type === 'asteroid') {
      // Simple atmosphere drag for asteroids (if not handled by controller)
      // ... (Keep asteroid drag logic if needed, or move to a simpler controller?)
      // For now, let's keep the asteroid drag logic here or duplicate it?
      // The original code had shared logic for rocket/asteroid drag.
      // Let's duplicate the asteroid drag logic here for now to avoid breaking asteroids, 
      // or assume asteroids don't need complex drag.
      // Actually, the original code had: if (this.type === 'rocket' || this.type === 'asteroid') ...
      // I should probably keep the asteroid drag logic here or move it to a generic PhysicsController.
      // For simplicity, I'll re-implement the simple drag for asteroids here.
      
      // Find nearest body with atmosphere
      let nearest = null;
      let minDist = Infinity;
      for (let b of bodies) {
        if (b !== this && b.type === 'planet') {
          const d = Math.hypot(b.x - this.x, b.y - this.y);
          if (d < minDist) { minDist = d; nearest = b; }
        }
      }

      if (nearest) {
        const dist = minDist;
        const alt = dist - nearest.radius;
        const atmosphereHeight = nearest.radius * 0.4;

        if (alt < atmosphereHeight && alt > 0) {
          const rho = Math.exp(-alt / (atmosphereHeight * 0.2));
          const speedSq = this.vx * this.vx + this.vy * this.vy;
          const speed = Math.sqrt(speedSq);

          if (speed > 0.1) {
            const Cd = 0.5;
            const A = 0.01;
            const dragForce = 0.5 * Cd * A * rho * speedSq;
            const dragAx = -(this.vx / speed) * dragForce / this.mass;
            const dragAy = -(this.vy / speed) * dragForce / this.mass;

            this.vx += dragAx * dt;
            this.vy += dragAy * dt;

            if (speed > 3 && Math.random() > 0.5) {
              spawnParticles(this.x, this.y, '#f97316', 1, 1);
            }
          }
        }
      }
    }
  }

  updateTrail() {
    this.age++;
    if ((!this.isStatic || this.mass > 500) && this.type !== 'rocket') {
      if (this.age % 4 === 0) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > TRAIL_LENGTH) this.trail.shift();
      }
    } else if (this.type === 'rocket') {
      if (this.age % 3 === 0) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 100) this.trail.shift(); // Shorter, cleaner trail for UFOs
      }
    }
  }

  draw(ctx, view) {
    if (this.trail.length > 1) {
      ctx.beginPath();
      // UFO Trail: Cyan/Green plasma look
      ctx.strokeStyle = this.type === 'rocket' ? (this.skin === 'cruiser' ? '#ec4899' : '#22d3ee') : this.color;
      ctx.lineWidth = this.type === 'star' ? 2 : (this.type === 'rocket' ? 2 : 1);
      ctx.globalAlpha = this.type === 'rocket' ? 0.5 : 0.3;
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'rocket') {
      ctx.rotate(this.angle);

      // --- UFO RENDERING ---
      const skin = this.skin || 'scout';

      if (skin === 'prototype') {
        // Basic Saucer
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#38bdf8'; // Dome
        ctx.beginPath(); ctx.arc(0, -1, 3, 0, Math.PI * 2); ctx.fill();
      }
      else if (skin === 'scout') {
        // Sleek Scout
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22d3ee'; // Glowing Core
        ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Lights
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-6, 0, 1, 0, Math.PI * 2); ctx.arc(6, 0, 1, 0, Math.PI * 2); ctx.fill();
      }
      else if (skin === 'cruiser') {
        // Heavy Cruiser
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2); ctx.fill(); // Main Hull
        ctx.fillStyle = '#ec4899'; // Pink Energy
        ctx.shadowBlur = 15; ctx.shadowColor = '#ec4899';
        ctx.beginPath(); ctx.arc(0, -2, 4, 0, Math.PI * 2); ctx.fill(); // Bridge
        ctx.shadowBlur = 0;
        // Spikes/Antenna
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(16, 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-16, 4); ctx.stroke();
      }

      if (this.controller && this.controller.thrusting) {
        // Plasma Engine Glow
        ctx.fillStyle = skin === 'cruiser' ? '#db2777' : '#f59e0b'; // Orange for standard
        ctx.globalAlpha = 0.8;

        // Procedural Flame
        const flameLen = 10 + Math.random() * 5;
        const flameW = 4;

        ctx.beginPath();
        ctx.moveTo(-8, -flameW / 2);
        ctx.lineTo(-8 - flameLen, 0);
        ctx.lineTo(-8, flameW / 2);
        ctx.closePath();

        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();

        // Inner Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-8, -1);
        ctx.lineTo(-8 - flameLen * 0.6, 0);
        ctx.lineTo(-8, 1);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      if (this.type === 'blackhole') {
        ctx.shadowBlur = 20; ctx.shadowColor = '#a855f7'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      } else if (this.type === 'star') {
        ctx.shadowBlur = 30; ctx.shadowColor = this.color;
      }
      ctx.fill();
    }

    // Draw Name
    if (this.name && view.zoom > 0.05) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, 14 / view.zoom)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this.name, 0, this.radius + (20 / view.zoom));
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export const physicsStep = (dt, bodies, config, spawnParticles, keys, timeScaleRef) => {
  const { highPrecision } = config;

  // Barnes-Hut Optimization (Quadtree)
  // Use if not high precision AND enough bodies to justify overhead
  if (!highPrecision && bodies.length > 50) {
    // 1. Calculate Bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let b of bodies) {
      if (b.x < minX) minX = b.x;
      if (b.x > maxX) maxX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.y > maxY) maxY = b.y;
    }

    // Add padding and ensure square
    const padding = 1000;
    const width = Math.max(maxX - minX, 1000) + padding * 2;
    const height = Math.max(maxY - minY, 1000) + padding * 2;
    const size = Math.max(width, height);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const qt = new Quadtree(centerX - size / 2, centerY - size / 2, size, size);

    // 2. Insert Bodies
    for (let b of bodies) qt.insert(b);

    // 3. Calculate Forces
    for (let b of bodies) {
      if (b.isStatic) continue;
      const { fx, fy } = qt.calculateForce(b, 0.5, G, SOFTENING);
      b.vx += (fx / b.mass) * dt;
      b.vy += (fy / b.mass) * dt;
    }
  } else {
    // Standard O(N^2) Loop
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const b1 = bodies[i];
        const b2 = bodies[j];
        const dx = b2.x - b1.x; const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy; const dist = Math.sqrt(distSq);

        if (dist > 0.1 && dist > b1.radius + b2.radius) {
          const f = (G * b1.mass * b2.mass) / (distSq + SOFTENING);
          const fx = f * (dx / dist); const fy = f * (dy / dist);
          if (!b1.isStatic) { b1.vx += (fx / b1.mass) * dt; b1.vy += (fy / b1.mass) * dt; }
          if (!b2.isStatic) { b2.vx -= (fx / b2.mass) * dt; b2.vy -= (fy / b2.mass) * dt; }
        }
      }
    }
  }
  for (let b of bodies) b.update(dt, bodies, spawnParticles, keys, timeScaleRef);
};
