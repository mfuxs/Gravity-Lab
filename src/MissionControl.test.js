import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionControl } from './MissionControl';

describe('MissionControl', () => {
  let mockBody;
  let missionControl;

  beforeEach(() => {
    mockBody = {
      x: 0, y: 0,
      vx: 0, vy: 0,
      mass: 1,
      angle: 0
    };
    missionControl = new MissionControl(mockBody);
  });

  it('should initialize with correct defaults', () => {
    expect(missionControl.fuel).toBe(100);
    expect(missionControl.missionPhase).toBe('launch');
  });

  it('should calculate current mass correctly', () => {
    // Dry mass 10, Fuel Cap 10. Total 20.
    expect(missionControl.currentMass).toBe(20);
    
    missionControl.fuel = 50;
    expect(missionControl.currentMass).toBe(15);
    
    missionControl.fuel = 0;
    expect(missionControl.currentMass).toBe(10);
  });

  it('should consume fuel and update mass', () => {
    missionControl.consumeFuel(10);
    expect(missionControl.fuel).toBe(90);
    expect(mockBody.mass).toBe(19);
  });

  it('should apply thrust correctly', () => {
    const dt = 1;
    const power = 1;
    const spawnParticles = vi.fn();

    missionControl.applyThrust(power, dt, spawnParticles);

    expect(missionControl.thrusting).toBe(true);
    expect(mockBody.vx).toBe(1); // cos(0) * 1 * 1
    expect(mockBody.vy).toBe(0); // sin(0) * 1 * 1
    expect(missionControl.fuel).toBeLessThan(100);
    expect(spawnParticles).toHaveBeenCalled();
  });

  it('should not apply thrust if no fuel', () => {
    missionControl.fuel = 0;
    const dt = 1;
    const power = 1;
    const spawnParticles = vi.fn();

    missionControl.applyThrust(power, dt, spawnParticles);

    expect(missionControl.thrusting).toBe(false);
    expect(mockBody.vx).toBe(0);
    expect(spawnParticles).not.toHaveBeenCalled();
  });

  it('should skip update and log error if bodies missing', () => {
    missionControl.update(1, null, {}, null, { current: 1 });
    expect(missionControl.missionLog).toContain('ERR: No bodies provided to mission update');
  });

  it('should handle mission profile configuration failure', () => {
    const success = missionControl.configureMissionProfile([]);
    expect(success).toBe(false);
    expect(missionControl.missionLog).toContain("ERR: No Planet Found");
  });
});
