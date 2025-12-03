import { describe, it, expect } from 'vitest';
import { Body, Particle, physicsStep, G } from './PhysicsEngine';

describe('PhysicsEngine', () => {
  describe('Body', () => {
    it('should create a body with correct properties', () => {
      const body = new Body(100, 200, 10, -5, 50, '#fff', 'planet');
      expect(body.x).toBe(100);
      expect(body.y).toBe(200);
      expect(body.vx).toBe(10);
      expect(body.vy).toBe(-5);
      expect(body.mass).toBe(50);
      expect(body.color).toBe('#fff');
      expect(body.type).toBe('planet');
    });
  });

  describe('physicsStep', () => {
    it('should apply gravity between two bodies', () => {
      const b1 = new Body(0, 0, 0, 0, 1000, '#fff', 'star');
      const b2 = new Body(100, 0, 0, 0, 10, '#fff', 'planet');
      const bodies = [b1, b2];
      const dt = 1;
      
      // Expected force: F = G * M1 * M2 / r^2
      // F = 0.5 * 1000 * 10 / 100^2 = 5000 / 10000 = 0.5
      // Acceleration a = F / M
      // a1 = 0.5 / 1000 = 0.0005 (towards right)
      // a2 = 0.5 / 10 = 0.05 (towards left)
      
      physicsStep(dt, bodies, { highPrecision: true }, () => {}, {}, { current: 1 });
      
      expect(b1.vx).toBeGreaterThan(0);
      expect(b2.vx).toBeLessThan(0);
    });

    it('should clamp maximum velocity with damping', () => {
      const b = new Body(0, 0, 2000, 0, 10, '#fff', 'rocket'); // Speed 2000 > MAX_SPEED 1000
      const bodies = [b];
      physicsStep(1, bodies, { highPrecision: true }, () => {}, {}, { current: 1 });

      expect(Math.abs(b.vx)).toBeLessThanOrEqual(1000);
      expect(Math.abs(b.vx)).toBeGreaterThan(800);
    });

    it('should remove bodies with NaN positions', () => {
      const b = new Body(NaN, 0, 0, 0, 10, '#fff', 'rocket');
      const bodies = [b];
      physicsStep(1, bodies, { highPrecision: true }, () => {}, {}, { current: 1 });

      expect(bodies.length).toBe(0);
    });

    it('should remove bodies that go out of bounds', () => {
      const b = new Body(1_500_000, 0, 0, 0, 10, '#fff', 'rocket');
      const bodies = [b];
      physicsStep(1, bodies, { highPrecision: true }, () => {}, {}, { current: 1 });

      expect(bodies.length).toBe(0);
    });
  });
});
