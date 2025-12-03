import { G } from './PhysicsEngine';

export class MissionControl {
  constructor(body) {
    this.body = body;
    this.missionPhase = 'launch'; // launch, staging, gravity_turn, coast, circularize, orbit, transfer_scan, waiting_for_window, transfer_burn, transfer_coast, capture
    this.stage = 1; // 1: Booster, 2: Upper Stage
    this.targetAlt = 200; // Default
    this.missionLog = []; // For HUD
    this.targetBody = null; // For transfers
    this.transferData = null; // Stores DeltaV etc.
    this.fuel = 100;
    this.thrusting = false;
    this.gracePeriod = 120; // Unverwundbarkeit beim Start
    this.homeBodyId = null;
    
    // Rocket Physics Constants
    this.dryMass = 10; // Mass without fuel
    this.fuelMassCapacity = 10; // Mass of fuel when full (total mass = 20)
    this.Isp = 300; // Specific Impulse in seconds (Vacuum)
    this.g0 = 9.81; // Standard Gravity m/s^2
  }

  get currentMass() {
    return this.dryMass + (this.fuel / 100) * this.fuelMassCapacity;
  }

  get deltaV() {
    // Tsiolkovsky Rocket Equation: dV = Isp * g0 * ln(m0 / mf)
    // m0 = current mass
    // mf = dry mass
    if (this.fuel <= 0) return 0;
    return this.Isp * this.g0 * Math.log(this.currentMass / this.dryMass);
  }

  updateMass() {
    this.body.mass = this.dryMass + (this.fuel / 100) * this.fuelMassCapacity;
  }

  consumeFuel(amount) {
    if (this.fuel > 0) {
      this.fuel = Math.max(0, this.fuel - amount);
      this.updateMass();
    }
  }

  applyThrust(power, dt, spawnParticles) {
    if (this.fuel <= 0) {
      this.thrusting = false;
      return;
    }

    this.thrusting = true;
    
    // F = m * a  =>  a = F / m
    // We treat 'power' as acceleration for simplicity in this arcade sim, 
    // but let's make it slightly more physical: Power = Force / Mass? 
    // Existing code treated power as direct acceleration addition. 
    // Let's stick to existing "power as acceleration" to maintain feel, 
    // or upgrade to Force? 
    // Let's keep it compatible: power = acceleration magnitude.
    
    const ax = Math.cos(this.body.angle) * power;
    const ay = Math.sin(this.body.angle) * power;

    this.body.vx += ax * dt;
    this.body.vy += ay * dt;

    // Fuel Consumption: proportional to power
    // Arbitrary factor: 0.5 fuel per unit of power-time?
    this.consumeFuel(power * 0.5 * dt);

    // Particles
    if (spawnParticles) {
      const exhaustX = this.body.x - Math.cos(this.body.angle) * 2;
      const exhaustY = this.body.y - Math.sin(this.body.angle) * 2;
      spawnParticles(exhaustX, exhaustY, '#fbbf24', 2, 0.5);
    }
  }

  ensureSpawnParticles(spawnParticles) {
    return typeof spawnParticles === 'function' ? spawnParticles : () => {};
  }

  ensureTimeScaleRef(timeScaleRef) {
    if (timeScaleRef && typeof timeScaleRef.current === 'number') return timeScaleRef;
    return { current: 1 };
  }

  sanitizeBodies(bodies) {
    if (!Array.isArray(bodies)) return [];
    return bodies.filter(Boolean);
  }

  findNearestPlanet(bodies) {
    let nearest = null;
    let minDist = Infinity;
    for (let b of bodies) {
      if (b !== this.body && b.type === 'planet') {
        const d = Math.hypot(b.x - this.body.x, b.y - this.body.y);
        if (d < minDist) { minDist = d; nearest = b; }
      }
    }
    return { nearest, minDist };
  }

  applyAtmosphericDrag(nearest, dist, dt, spawnParticles) {
    if (!nearest) return;
    const alt = dist - nearest.radius;
    const atmosphereHeight = nearest.radius * 0.4; // Atmosphere is 40% of radius

    if (alt < atmosphereHeight && alt > 0) {
      // Density decays exponentially
      const rho = Math.exp(-alt / (atmosphereHeight * 0.2));
      const speedSq = this.body.vx * this.body.vx + this.body.vy * this.body.vy;
      const speed = Math.sqrt(speedSq);

      if (speed > 0.1) {
        // Drag Equation: Fd = 0.5 * Cd * A * rho * v^2
        const Cd = 0.5; // Drag Coefficient
        const A = 0.01; // Frontal Area
        const dragForce = 0.5 * Cd * A * rho * speedSq;

        // Apply Drag (opposite to velocity)
        const dragAx = -(this.body.vx / speed) * dragForce / this.body.mass;
        const dragAy = -(this.body.vy / speed) * dragForce / this.body.mass;

        this.body.vx += dragAx * dt;
        this.body.vy += dragAy * dt;

        // Re-entry Heating Visuals
        if (speed > 3 && Math.random() > 0.5) {
          spawnParticles(this.body.x, this.body.y, '#f97316', 1, 1); // Orange sparks
        }
      }
    }
  }

  handleManualControls(keys, dt, spawnParticles) {
    if (keys['w']) {
      this.applyThrust(0.2, dt, spawnParticles);
    } else {
      this.thrusting = false;
    }

    if (keys['a']) {
      this.body.angle -= 0.05 * dt;
    }
    if (keys['d']) {
      this.body.angle += 0.05 * dt;
    }
  }

  configureMissionProfile(bodies) {
    // 1. Identify Home Body (Launch Site)
    let homeBody = null;
    let minDist = Infinity;
    for (let b of bodies) {
      if (b !== this.body && (b.type === 'planet' || b.type === 'star')) {
        const d = Math.hypot(b.x - this.body.x, b.y - this.body.y);
        if (d < minDist) { minDist = d; homeBody = b; }
      }
    }

    if (!homeBody) {
      this.missionLog.push("ERR: No Planet Found");
      return false;
    }

    // 2. Identify Dominant Body (The Sun)
    let sun = bodies.reduce((prev, current) => (prev.mass > current.mass) ? prev : current);
    if (sun === this.body) sun = homeBody; // Edge case

    // 3. Calculate Hill Sphere (Stability Region)
    // r_Hill = d * cbrt(m / 3M)
    let hillSphere = Infinity;
    let stabilityMsg = "Infinite (Star)";

    if (homeBody !== sun) {
      const distToSun = Math.hypot(homeBody.x - sun.x, homeBody.y - sun.y);
      hillSphere = distToSun * Math.pow(homeBody.mass / (3 * sun.mass), 1 / 3);
      stabilityMsg = `${Math.round(hillSphere)}km (Hill Radius)`;
    }

    // 4. Plan Orbit
    // Safe Orbit: > 1.2x Radius (Atmosphere/Terrain)
    // Stable Orbit: < 0.4x Hill Sphere (Perturbation limit)

    const minSafeAlt = homeBody.radius * 1.5;
    const maxStableAlt = hillSphere * 0.4;

    let plannedAlt = minSafeAlt;

    if (maxStableAlt < minSafeAlt && hillSphere !== Infinity) {
      // Unstable System!
      this.missionLog.push(`WARN: Unstable Orbit! Hill Sphere too small.`);
      plannedAlt = (homeBody.radius + hillSphere) / 2; // Try to squeeze in
    } else {
      // Choose a nice high orbit for better view
      plannedAlt = Math.min(minSafeAlt + 100, maxStableAlt);
      this.missionLog.push(`Orbit Planned: ${Math.round(plannedAlt)}km`);
      this.missionLog.push(`Stability: Optimal`);
    }

    this.targetAlt = plannedAlt;
    this.homeBodyId = homeBody.id; // Lock to this body
    return true;
  }

  update(dt, bodies, keys, spawnParticles, timeScaleRef) {
    if (this.gracePeriod > 0) this.gracePeriod -= dt;

    const safeBodies = this.sanitizeBodies(bodies);
    if (safeBodies.length === 0) {
      this.missionLog.push('ERR: No bodies provided to mission update');
      this.thrusting = false;
      return;
    }

    bodies = safeBodies;
    const emitParticles = this.ensureSpawnParticles(spawnParticles);
    timeScaleRef = this.ensureTimeScaleRef(timeScaleRef);
    keys = keys || {};

    // --- ATMOSPHERE & DRAG ---
    const { nearest, minDist } = this.findNearestPlanet(bodies);
    this.applyAtmosphericDrag(nearest, minDist, dt, emitParticles);

    if (this.fuel > 0) {
      // --- VARIABLE MASS ---
      // Ensure mass is sync (should be handled by consumeFuel, but init check)
      if (this.body.mass === 1) this.updateMass(); // Fix initial mass if default

      // --- MANUAL CONTROL ---
      this.handleManualControls(keys, dt, emitParticles);

      // --- AUTO PILOT LOGIC (Override if Manual) ---
      // Only run autopilot if NO manual input
      const manualInput = keys['w'] || keys['a'] || keys['d'];

      if (!manualInput) {
        let nearest = null;
        let minDist = Infinity;

        // Find nearest planet/star (Gravity Source)
        for (let b of bodies) {
          if (b !== this.body && (b.type === 'planet' || b.type === 'star')) {
            const d = Math.hypot(b.x - this.body.x, b.y - this.body.y);
            if (d < minDist) { minDist = d; nearest = b; }
          }
        }

        if (nearest) {
          const dx = this.body.x - nearest.x;
          const dy = this.body.y - nearest.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const alt = dist - nearest.radius;

          const angleToCenter = Math.atan2(dy, dx);
          const orbitAngle = angleToCenter + Math.PI / 2;

          let targetAngle = this.body.angle;
          let thrust = 0;
          const targetOrbitAlt = this.targetAlt || 200;

          // --- FLIGHT COMPUTER ---

          if (this.missionPhase === 'launch') {
            // Phase 1: Vertical Ascent
            targetAngle = angleToCenter;
            thrust = 0.15; // Slower, heavier launch
            if (alt > 40) {
              this.missionPhase = 'staging';
              this.missionLog.push("Staging: Booster Sep");
            }
          }
          else if (this.missionPhase === 'staging') {
            // Visual Staging Event
            if (this.stage === 1) {
              this.stage = 2;
              // Spawn Debris (Booster)
              // Import Body dynamically or pass a factory? 
              // PhysicsEngine imports MissionControl, so MissionControl importing Body (from PhysicsEngine) would be circular.
              // We can just create a simple object and let PhysicsEngine handle it, or pass a createBody callback.
              // But Body is exported from PhysicsEngine.
              // Circular dependency risk!
              // Solution: Pass `spawnDebris` callback or similar.
              // Or just assume `bodies` is mutable and we can push a simple object that satisfies the interface?
              // No, `Body` class has methods.
              // Let's use a callback `spawnParticles` for visual effects, but for debris...
              // Maybe we can just ignore debris for now or use a callback passed in `update`.
              // Let's rely on `spawnParticles` for now and skip the debris body to avoid circular dep, 
              // OR move Body to a separate file (already done? No, Body is in PhysicsEngine).
              // Actually, Body is in PhysicsEngine.js.
              // If I import Body here, and PhysicsEngine imports MissionControl...
              // PhysicsEngine.js -> imports MissionControl
              // MissionControl.js -> imports Body from PhysicsEngine.js
              // This IS a cycle.
              // I should move Body to its own file `Body.js` later.
              // For now, I will skip creating the debris body to avoid the cycle, or just use particles.
              emitParticles(this.body.x, this.body.y, '#fff', 20, 3); // Explosion/Sep effect
            }
            this.missionPhase = 'gravity_turn';
            thrust = 0.1; // Momentary pause/low thrust
          }
          else if (this.missionPhase === 'gravity_turn') {
            const turnStart = 40;
            const turnEnd = targetOrbitAlt * 0.8;
            const progress = Math.max(0, Math.min(1, (alt - turnStart) / (turnEnd - turnStart)));

            // Smooth turn curve
            const ease = 1 - Math.pow(1 - progress, 2);
            targetAngle = angleToCenter + (ease * Math.PI / 2);

            thrust = 0.08; // Gentle turn acceleration
            if (alt >= targetOrbitAlt * 0.95) {
              this.missionPhase = 'coast';
              thrust = 0;
              this.missionLog.push("MECO: Coasting to Apoapsis");
            }
          }
          else if (this.missionPhase === 'coast') {
            const velAngle = Math.atan2(this.body.vy, this.body.vx);
            targetAngle = velAngle;
            thrust = 0;
            const vRadial = (this.body.vx * Math.cos(angleToCenter)) + (this.body.vy * Math.sin(angleToCenter));
            // Circularize when vertical speed is near zero (Apoapsis)
            if (vRadial < 0.05 && alt > targetOrbitAlt * 0.9) {
              this.missionPhase = 'circularize';
              this.missionLog.push("Circularization Burn");
            }
          }
          else if (this.missionPhase === 'circularize') {
            targetAngle = orbitAngle;
            thrust = 0.1; // Precision burn
            const vOrbital = Math.sqrt(G * nearest.mass / dist);
            const currentSpeed = Math.sqrt(this.body.vx * this.body.vx + this.body.vy * this.body.vy);

            if (currentSpeed >= vOrbital) {
              this.missionPhase = 'orbit';
              thrust = 0;
              this.missionLog.push("Orbit Achieved");
              this.missionLog.push("Ready for Transfer");
            }
          }
          else if (this.missionPhase === 'orbit') {
            const velAngle = Math.atan2(this.body.vy, this.body.vx);
            targetAngle = velAngle;
            thrust = 0;
            // Auto-initiate transfer after some time
            // Only if NO target is set (manual mode)
            // But for Mission Planner, targetBody is already set!
            if (this.targetBody) {
              this.missionPhase = 'transfer_calc';
              this.missionLog.push(`Mission: Transfer to ${this.targetBody.type}`);
            }
          }
          else if (this.missionPhase === 'transfer_calc') {
            // Calculate Hohmann Transfer & Phase Angle
            const r1 = dist; // Current orbit radius (approx)
            const sun = bodies.find(b => b.type === 'star');

            if (sun && this.targetBody) {
              const rStart = Math.hypot(nearest.x - sun.x, nearest.y - sun.y);
              const rTarget = Math.hypot(this.targetBody.x - sun.x, this.targetBody.y - sun.y);

              // Hohmann Transfer Time (half period of transfer ellipse)
              // a_trans = (r1 + r2) / 2
              // T = 2pi * sqrt(a^3 / GM)
              // t_trans = 0.5 * T
              const aTrans = (rStart + rTarget) / 2;
              const tTrans = Math.PI * Math.sqrt(Math.pow(aTrans, 3) / (G * sun.mass));

              // Required Phase Angle (alpha)
              // Target moves n_target * t_trans radians during transfer
              // n_target = sqrt(GM / r_target^3)
              const nTarget = Math.sqrt(G * sun.mass / Math.pow(rTarget, 3));
              const angleChange = nTarget * tTrans;

              // For outer planet (rTarget > rStart): alpha = pi - angleChange
              // For inner planet: alpha = pi + angleChange (simplified)
              let requiredAngle = Math.PI - angleChange;

              // Normalize to -PI to PI
              while (requiredAngle < -Math.PI) requiredAngle += Math.PI * 2;
              while (requiredAngle > Math.PI) requiredAngle -= Math.PI * 2;

              this.transferData = {
                rStart, rTarget, tTrans, requiredAngle,
                waitStart: this.body.age
              };
              this.missionPhase = 'waiting_for_window';
              this.missionLog.push("Calculating Launch Window...");
            } else {
              this.missionPhase = 'orbit'; // Abort
            }
          }
          else if (this.missionPhase === 'waiting_for_window') {
            // Check current phase angle
            const sun = bodies.find(b => b.type === 'star');
            if (sun && this.targetBody) {
              const angleStart = Math.atan2(nearest.y - sun.y, nearest.x - sun.x);
              const angleTarget = Math.atan2(this.targetBody.y - sun.y, this.targetBody.x - sun.x);

              let currentAngle = angleTarget - angleStart;
              while (currentAngle < -Math.PI) currentAngle += Math.PI * 2;
              while (currentAngle > Math.PI) currentAngle -= Math.PI * 2;

              const diff = Math.abs(currentAngle - this.transferData.requiredAngle);

              // Display
              const deg = (diff * 180 / Math.PI).toFixed(1);
              // Only log occasionally or update HUD state directly

              // WARP LOGIC
              if (diff > 0.1) { // > 5 degrees off
                timeScaleRef.current = 5.0; // WARP SPEED
                this.missionLog[this.missionLog.length - 1] = `Waiting: ${deg}° (WARP 5x)`;
              } else {
                timeScaleRef.current = 0.5; // Normal speed
                this.missionPhase = 'transfer_burn';
                this.missionLog.push("Window Open! Igniting...");
              }
            }
          }
          else if (this.missionPhase === 'transfer_burn') {
            // Burn Prograde
            targetAngle = orbitAngle; // Prograde
            thrust = 0.15; // Slower transfer burn

            // Check escape velocity: sqrt(2GM/r)
            const vEscape = Math.sqrt(2 * G * nearest.mass / dist);
            const vCurrent = Math.sqrt(this.body.vx * this.body.vx + this.body.vy * this.body.vy);

            // We burn until we are significantly faster than escape to travel fast
            if (vCurrent > vEscape * 1.2) {
              this.missionPhase = 'transfer_coast';
              this.missionLog.push("Escape Velocity Reached");
              this.missionLog.push("Coasting to Target");
              thrust = 0;
            }
          }
          else if (this.missionPhase === 'transfer_coast') {
            thrust = 0;
            targetAngle = Math.atan2(this.body.vy, this.body.vx);

            // Check if we are close to target
            if (this.targetBody) {
              const dTarget = Math.hypot(this.targetBody.x - this.body.x, this.targetBody.y - this.body.y);
              if (dTarget < this.targetBody.radius * 4) {
                this.missionPhase = 'capture';
                this.missionLog.push("Target Encounter - Braking");
              }
            }
          }
          else if (this.missionPhase === 'capture') {
            // Retrograde Burn
            const velAngle = Math.atan2(this.body.vy, this.body.vx);
            targetAngle = velAngle + Math.PI; // Retrograde
            thrust = 0.3;

            // Check if captured
            // v < sqrt(2GM/r) relative to target
            // Need relative velocity to target
            const dvx = this.body.vx - this.targetBody.vx;
            const dvy = this.body.vy - this.targetBody.vy;
            const vRel = Math.sqrt(dvx * dvx + dvy * dvy);
            const dTarget = Math.hypot(this.targetBody.x - this.body.x, this.targetBody.y - this.body.y);
            const vEscape = Math.sqrt(2 * G * this.targetBody.mass / dTarget);
            const vCirc = Math.sqrt(G * this.targetBody.mass / dTarget);

            if (vRel < vCirc * 1.1) {
              this.missionPhase = 'orbit';
              this.missionLog.push("Orbit Capture Successful");
              this.targetBody = null; // Done
            }
          }

          // --- CONTROL ---
          // Smooth rotation
          let diff = targetAngle - this.body.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          this.body.angle += diff * 0.02; // Heavy, slow turning

          if (thrust > 0) {
            // Apply Thrust via centralized method
            this.applyThrust(thrust, dt, emitParticles);
          } else {
            // Ensure thrusting is off if autopilot demands 0
            if (!manualInput) this.thrusting = false;
          }
        }
      }
    }
  }
}
