import { PHYSICS_CONSTANTS } from './physicsConfig';

const { G, SOFTENING } = PHYSICS_CONSTANTS; // Must match PhysicsEngine.js

self.onmessage = function(e) {
  const { bodies, steps, dt } = e.data;

  // Clone bodies to avoid mutating original data (though passed by copy in worker anyway)
  // We only need simulation properties
  const simBodies = bodies.map(b => ({
    x: b.x, y: b.y,
    vx: b.vx, vy: b.vy,
    mass: b.mass, radius: b.radius,
    isStatic: b.isStatic,
    id: b.id,
    color: b.color,
    path: [{ x: b.x, y: b.y }]
  }));

  // Run Simulation
  for (let i = 0; i < steps; i++) {
    // 1. Calculate Forces
    for (let j = 0; j < simBodies.length; j++) {
      const b1 = simBodies[j];
      if (b1.isStatic) continue;

      let fx = 0, fy = 0;
      for (let k = 0; k < simBodies.length; k++) {
        if (j === k) continue;
        const b2 = simBodies[k];
        const dx = b2.x - b1.x; const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy; const dist = Math.sqrt(distSq);

        if (dist > b1.radius + b2.radius) {
          const f = (G * b1.mass * b2.mass) / (distSq + SOFTENING);
          fx += f * (dx / dist); fy += f * (dy / dist);
        }
      }
      b1.vx += (fx / b1.mass) * dt;
      b1.vy += (fy / b1.mass) * dt;
    }

    // 2. Update Positions
    for (let j = 0; j < simBodies.length; j++) {
      const b1 = simBodies[j];
      if (!b1.isStatic) {
        b1.x += b1.vx * dt;
        b1.y += b1.vy * dt;
        
        // Store point every 10 steps to save memory/transfer
        if (i % 10 === 0) {
          b1.path.push({ x: b1.x, y: b1.y });
        }
      }
    }
  }

  // Extract only paths to return
  const paths = simBodies.map(b => ({
    id: b.id,
    color: b.color,
    path: b.path
  }));

  self.postMessage({ paths });
};
