import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionControl } from './MissionControl';

// Mock PhysicsEngine constants if needed, but they are imported in MissionControl.
// Since we are testing logic, we can rely on the real constants or mock the module.
// For now, let's use real constants as they are simple values.

describe('MissionControl', () => {
  let mockBody;
  let missionControl;

  beforeEach(() => {
    mockBody = {
      x: 0, y: 0, vx: 0, vy: 0, mass: 1, angle: 0, age: 0
    };
    missionControl = new MissionControl(mockBody);
  });

  it('should initialize with default values', () => {
    expect(missionControl.missionPhase).toBe('launch');
    expect(missionControl.fuel).toBe(100);
    expect(missionControl.stage).toBe(1);
  });

  it('should configure mission profile correctly', () => {
    const sun = { id: 1, x: 0, y: 0, mass: 5000, type: 'star', radius: 100 };
    const planet = { id: 2, x: 500, y: 0, mass: 100, type: 'planet', radius: 20 };
    mockBody.x = 500 + 25;
    mockBody.y = 0;

    const bodies = [sun, planet];
    
    missionControl.configureMissionProfile(bodies);

    expect(missionControl.homeBodyId).toBe(planet.id);
    // Check if any log entry starts with "Orbit Planned"
    const hasOrbitPlan = missionControl.missionLog.some(log => log.startsWith("Orbit Planned"));
    expect(hasOrbitPlan).toBe(true);
  });

  it('should transition from launch to staging', () => {
    const planet = { id: 2, x: 0, y: 0, mass: 100, type: 'planet', radius: 20 };
    const bodies = [planet];
    mockBody.x = 0;
    mockBody.y = 20;
    
    const spawnParticles = vi.fn();
    const timeScaleRef = { current: 1 };

    mockBody.y = 61; // Alt 41
    
    missionControl.update(1, bodies, {}, spawnParticles, timeScaleRef);
    
    expect(missionControl.missionPhase).toBe('staging');
    expect(missionControl.missionLog).toContain("Staging: Booster Sep");
  });

  it('should handle manual control (thrust)', () => {
    const bodies = [];
    const keys = { 'w': true };
    const spawnParticles = vi.fn();
    const timeScaleRef = { current: 1 };
    
    mockBody.angle = 0; // Pointing Right
    const initialVx = mockBody.vx;
    
    missionControl.update(1, bodies, keys, spawnParticles, timeScaleRef);
    
    expect(missionControl.thrusting).toBe(true);
    expect(mockBody.vx).toBeGreaterThan(initialVx);
    expect(missionControl.fuel).toBeLessThan(100);
  });
});
