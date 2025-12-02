import { G, SOFTENING } from './PhysicsEngine';

export class Renderer {
  static getLagrangePoints(sun, planet) {
    const dx = planet.x - sun.x;
    const dy = planet.y - sun.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Mass ratio q = M2 / M1 (Planet / Sun)
    const q = planet.mass / sun.mass;
    const alpha = Math.cbrt(q / 3);

    // Angular velocity of the system
    const omega = Math.sqrt(G * (sun.mass + planet.mass) / Math.pow(dist, 3));

    // L1: Between Sun and Planet
    const rL1 = dist * (1 - alpha);
    const l1x = sun.x + Math.cos(angle) * rL1;
    const l1y = sun.y + Math.sin(angle) * rL1;

    // L2: Behind Planet
    const rL2 = dist * (1 + alpha);
    const l2x = sun.x + Math.cos(angle) * rL2;
    const l2y = sun.y + Math.sin(angle) * rL2;

    // L3: Opposite side of Sun
    const rL3 = dist * (1 - (7 * q / 12));
    const l3x = sun.x - Math.cos(angle) * rL3;
    const l3y = sun.y - Math.sin(angle) * rL3;

    // L4 & L5: 60 degrees offset
    const l4x = sun.x + Math.cos(angle + Math.PI / 3) * dist;
    const l4y = sun.y + Math.sin(angle + Math.PI / 3) * dist;

    const l5x = sun.x + Math.cos(angle - Math.PI / 3) * dist;
    const l5y = sun.y + Math.sin(angle - Math.PI / 3) * dist;

    const getVelocity = (lx, ly) => {
      // Vector from Sun (approx Barycenter) to L-point
      const rx = lx - sun.x;
      const ry = ly - sun.y;
      const r = Math.sqrt(rx * rx + ry * ry);
      const theta = Math.atan2(ry, rx);

      // Velocity is perpendicular to radius, magnitude v = omega * r
      // Direction: theta + 90 degrees (counter-clockwise)
      const v = omega * r;
      const vx = sun.vx + Math.cos(theta + Math.PI / 2) * v;
      const vy = sun.vy + Math.sin(theta + Math.PI / 2) * v;
      return { vx, vy };
    };

    return [
      { x: l1x, y: l1y, label: 'L1', ...getVelocity(l1x, l1y) },
      { x: l2x, y: l2y, label: 'L2', ...getVelocity(l2x, l2y) },
      { x: l3x, y: l3y, label: 'L3', ...getVelocity(l3x, l3y) },
      { x: l4x, y: l4y, label: 'L4', ...getVelocity(l4x, l4y) },
      { x: l5x, y: l5y, label: 'L5', ...getVelocity(l5x, l5y) }
    ];
  }

  static render(canvas, ctx, bodies, particles, view, config, drag, missionState, missionConfig, currentTool) {
    const { x: panX, y: panY, zoom } = view;
    const { showOrbitPreview, showLagrange } = config;
    const { currentX, currentY, isDragging } = drag;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#1e293b';
    const gridSize = 100 * zoom;
    const offsetX = panX % gridSize; const offsetY = panY % gridSize;
    for (let sx = -gridSize; sx < canvas.width + gridSize; sx += gridSize) {
      for (let sy = -gridSize; sy < canvas.height + gridSize; sy += gridSize) {
        ctx.fillRect(sx + offsetX, sy + offsetY, 2 * zoom, 2 * zoom);
      }
    }

    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Draw Bodies & Particles
    bodies.forEach(b => b.draw(ctx, view));
    particles.forEach(p => p.draw(ctx));

    // --- INFORMATION LAYER ---
    const { showVectors, showHillSpheres, showOrbitPaths, showShadows } = config;

    if (showVectors || showHillSpheres || showOrbitPaths || showShadows) {
      const sun = bodies.find(b => b.type === 'star');

      // Global Orbit Preview
      if (showOrbitPaths) {
        // Clone bodies for simulation
        // Filter out particles or very small debris to save performance
        const simBodies = bodies
          .filter(b => b.mass > 1) // Only simulate significant bodies
          .map(b => ({
            x: b.x, y: b.y,
            vx: b.vx, vy: b.vy,
            mass: b.mass, radius: b.radius,
            isStatic: b.isStatic,
            id: b.id,
            color: b.color,
            path: [{ x: b.x, y: b.y }]
          }));

        const steps = 500; // Number of steps to preview
        const dt = 1.0; // Time step for preview
        
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
              
              // Store point every 10 steps to save memory/drawing
              if (i % 10 === 0) {
                b1.path.push({ x: b1.x, y: b1.y });
              }
            }
          }
        }

        // Draw Paths
        ctx.lineWidth = 1 / zoom;
        simBodies.forEach(b => {
          if (b.path.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = b.color;
            ctx.globalAlpha = 0.4;
            ctx.moveTo(b.path[0].x, b.path[0].y);
            for (let k = 1; k < b.path.length; k++) {
              ctx.lineTo(b.path[k].x, b.path[k].y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        });
      }

      bodies.forEach(b => {
        // Hill Spheres
        if (showHillSpheres && sun && b !== sun && (b.type === 'planet' || b.type === 'rocket')) {
          const dist = Math.hypot(b.x - sun.x, b.y - sun.y);
          const hillRadius = dist * Math.cbrt(b.mass / (3 * sun.mass));
          
          if (hillRadius > b.radius) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, hillRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1 / zoom;
            ctx.setLineDash([5 / zoom, 5 / zoom]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Shadows
        if (showShadows && sun && b !== sun && b.type !== 'star' && b.type !== 'blackhole' && b.type !== 'whitedwarf') {
          const dx = b.x - sun.x;
          const dy = b.y - sun.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          // Realistic Umbra Calculation
          const Rs = sun.radius;
          const Rp = b.radius;
          
          // Length of the Umbra (shadow cone)
          // L = (Rp * D) / (Rs - Rp)
          let shadowLen;
          let isCylinder = false;

          if (Rs > Rp) {
            shadowLen = (Rp * dist) / (Rs - Rp);
          } else if (Rs === Rp) {
            shadowLen = 10000; // Parallel (effectively infinite)
            isCylinder = true;
          } else {
             // Antumbra case (Sun smaller than planet - rare in this sim but possible)
             // Shadow gets wider.
             shadowLen = 10000; 
             // We'll just draw a diverging cone for now if needed, but let's stick to simple cylinder for this edge case
             isCylinder = true; 
          }

          ctx.beginPath();
          // Start points at planet
          const startX1 = b.x + Rp * Math.cos(angle + Math.PI / 2);
          const startY1 = b.y + Rp * Math.sin(angle + Math.PI / 2);
          const startX2 = b.x + Rp * Math.cos(angle - Math.PI / 2);
          const startY2 = b.y + Rp * Math.sin(angle - Math.PI / 2);
          
          if (isCylinder) {
             const endX1 = startX1 + shadowLen * Math.cos(angle);
             const endY1 = startY1 + shadowLen * Math.sin(angle);
             const endX2 = startX2 + shadowLen * Math.cos(angle);
             const endY2 = startY2 + shadowLen * Math.sin(angle);
             
             ctx.moveTo(startX1, startY1);
             ctx.lineTo(endX1, endY1);
             ctx.lineTo(endX2, endY2);
             ctx.lineTo(startX2, startY2);
          } else {
             // Converging Cone (Triangle)
             const tipX = b.x + (dist + shadowLen) * Math.cos(angle); // Tip is at dist + len from Sun, or just len from Planet?
             // Formula L is length FROM PLANET center.
             const tipX_ = b.x + shadowLen * Math.cos(angle);
             const tipY_ = b.y + shadowLen * Math.sin(angle);

             ctx.moveTo(startX1, startY1);
             ctx.lineTo(tipX_, tipY_);
             ctx.lineTo(startX2, startY2);
          }
          
          ctx.closePath();
          
          // Gradient for fading shadow
          // Fade out towards the tip or end
          const gradLen = isCylinder ? 1000 : shadowLen;
          const grad = ctx.createLinearGradient(b.x, b.y, b.x + Math.cos(angle) * gradLen, b.y + Math.sin(angle) * gradLen);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Velocity Vectors
        if (showVectors && !b.isStatic) {
          const speed = Math.hypot(b.vx, b.vy);
          if (speed > 0.1) {
            const scale = 20; // Visual scale factor
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + b.vx * scale, b.y + b.vy * scale);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)'; // Cyan
            ctx.lineWidth = 2 / zoom;
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(b.vy, b.vx);
            const headLen = 10 / zoom;
            ctx.beginPath();
            ctx.moveTo(b.x + b.vx * scale, b.y + b.vy * scale);
            ctx.lineTo(
              b.x + b.vx * scale - headLen * Math.cos(angle - Math.PI / 6),
              b.y + b.vy * scale - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              b.x + b.vx * scale - headLen * Math.cos(angle + Math.PI / 6),
              b.y + b.vy * scale - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
            ctx.fill();
          }
        }
      });
    }

    // Lagrange Overlay
    let snapPoint = null;
    if (showLagrange || currentTool === 'lagrange_pilot') {
      const sun = bodies.find(b => b.type === 'star');
      if (sun) {
        bodies.forEach(planet => {
          if (planet.type !== 'planet') return;

          const points = Renderer.getLagrangePoints(sun, planet);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = `${10 / zoom}px monospace`;
          ctx.textAlign = 'center';

          points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 / zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillText(p.label, p.x, p.y - 5 / zoom);

            // Snap logic for pilot
            if (currentTool === 'lagrange_pilot') {
              const dMouse = Math.hypot((currentX - panX) / zoom - p.x, (currentY - panY) / zoom - p.y);
              if (dMouse < 30 / zoom) {
                snapPoint = p;
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2 / zoom;
                ctx.stroke();
              }
            }
          });
        });
      }
    }

    // Rocket Start Helper
    if (currentTool === 'rocket' && !isDragging) {
      const mouseX = (currentX - panX) / zoom;
      const mouseY = (currentY - panY) / zoom;
      const nearest = bodies.find(b => b.mass > 50 && Math.hypot(b.x - mouseX, b.y - mouseY) < b.radius + 100 / zoom);
      if (nearest) {
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2 / zoom;
        ctx.beginPath(); ctx.arc(nearest.x, nearest.y, nearest.radius + 15, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#facc15'; ctx.font = `${12 / zoom}px sans-serif`;
        ctx.fillText("Startrampe", nearest.x, nearest.y - nearest.radius - 30);
      }
    }

    // Orbit Preview
    if (showOrbitPreview && isDragging && drag.dragType === 'create' && currentTool !== 'rocket') {
      const worldStartX = (drag.startX - panX) / zoom;
      const worldStartY = (drag.startY - panY) / zoom;
      const worldCurrX = (currentX - panX) / zoom;
      const worldCurrY = (currentY - panY) / zoom;
      const vx = (worldStartX - worldCurrX) * 0.05;
      const vy = (worldStartY - worldCurrY) * 0.05;

      let mass = 20;
      if (currentTool === 'planet') mass = 150;
      else if (currentTool === 'sun_system') mass = 1500;
      else if (currentTool === 'blackhole') mass = 5000;

      // Simulation für Vorschau
      if (!snapPoint) {
        const points = [];
        let simX = worldStartX; let simY = worldStartY;
        let simVx = vx; let simVy = vy;

        // Clone bodies for simulation (lightweight)
        // Optimization: If many bodies, only simulate massive ones (Planets/Stars)
        const simBodies = bodies
          .filter(b => bodies.length < 100 || b.mass > 50)
          .map(b => ({
            x: b.x, y: b.y,
            vx: b.vx, vy: b.vy, // Need velocity for dynamic update
            mass: b.mass, radius: b.radius,
            isStatic: b.isStatic
          }));

        const steps = 300;
        const dt = 1.0; // Standard time step
        let collision = false;
        const previewRadius = Math.sqrt(mass) * 2;

        for (let i = 0; i < steps; i++) {
          points.push({ x: simX, y: simY });

          // 1. Update Sim Bodies (Gravity & Movement)
          // Phase 1: Calculate Forces & Update Velocities
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

          // Phase 2: Update Positions
          for (let j = 0; j < simBodies.length; j++) {
            const b1 = simBodies[j];
            if (!b1.isStatic) {
              b1.x += b1.vx * dt;
              b1.y += b1.vy * dt;
            }
          }

          // 2. Update Preview Object
          let fx = 0, fy = 0;
          for (let b of simBodies) {
            const dx = b.x - simX; const dy = b.y - simY;
            const distSq = dx * dx + dy * dy; const dist = Math.sqrt(distSq);

            // Collision Check
            if (dist < b.radius + previewRadius) {
              collision = true;
              break;
            }

            if (dist > b.radius) {
              const f = (G * mass * b.mass) / (distSq + SOFTENING);
              fx += f * (dx / dist); fy += f * (dy / dist);
            }
          }

          if (collision) break;

          simVx += (fx / mass) * dt;
          simVy += (fy / mass) * dt;
          simX += simVx * dt;
          simY += simVy * dt;
        }

        ctx.beginPath();
        ctx.strokeStyle = collision ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.moveTo(points[0].x, points[0].y);
        for (let p of points) ctx.lineTo(p.x, p.y);
        ctx.stroke(); ctx.setLineDash([]);
      }
    }

    // Standard Drag UI
    if (isDragging && drag.dragType === 'create' && currentTool !== 'rocket' && !snapPoint) {
      const worldStartX = (drag.startX - panX) / zoom;
      const worldStartY = (drag.startY - panY) / zoom;
      const worldCurrX = (currentX - panX) / zoom;
      const worldCurrY = (currentY - panY) / zoom;
      ctx.beginPath(); ctx.moveTo(worldStartX, worldStartY); ctx.lineTo(worldCurrX, worldCurrY);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 / zoom; ctx.setLineDash([5 / zoom, 5 / zoom]); ctx.stroke(); ctx.setLineDash([]);
    }

    // Mission Planner Preview
    if (currentTool === 'rocket' && (missionState === 'ready' || missionState === 'selecting_target')) {
      let start = missionConfig.startBody;
      let target = missionConfig.targetBody;

      // If selecting target, use mouse hover as preview
      if (missionState === 'selecting_target' && !target) {
        const mouseX = (currentX - panX) / zoom;
        const mouseY = (currentY - panY) / zoom;
        target = bodies.find(b => b !== start && (b.type === 'planet' || b.type === 'star') && Math.hypot(b.x - mouseX, b.y - mouseY) < b.radius + 500 / zoom);
      }

      if (start && target) {
        // Draw Transfer Orbit Preview (Simplified Ellipse)
        // Center is roughly midpoint between start and target (very rough approx for visual)
        // Better: Draw line connecting them
        ctx.beginPath();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([10 / zoom, 10 / zoom]);

        ctx.moveTo(start.x, start.y);

        // Bezier curve for "orbit" look
        const midX = (start.x + target.x) / 2;
        const midY = (start.y + target.y) / 2;
        // Offset midpoint to make it curve
        const dist = Math.hypot(target.x - start.x, target.y - start.y);
        const angle = Math.atan2(target.y - start.y, target.x - start.x);
        const cpX = midX - Math.sin(angle) * dist * 0.5;
        const cpY = midY + Math.cos(angle) * dist * 0.5;

        ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);
        ctx.stroke();

        // Draw Target Highlight
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 20 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#22c55e';
        ctx.stroke();

        ctx.setLineDash([]);
      }

      if (start) {
        // Highlight Start
        ctx.beginPath();
        ctx.arc(start.x, start.y, start.radius + 20 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      }
    }
  }
}
