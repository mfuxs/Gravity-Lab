export const PHYSICS_CONSTANTS = Object.freeze({
  G: 0.8,
  SOFTENING: 5,
  TRAIL_LENGTH: 120,
  PHYSICS_SUBSTEPS: 8,
  MAX_SPEED: 1000,
  MAX_FORCE: 5000,
  MAX_POSITION: 1_000_000,
  VELOCITY_DAMPING: 0.1,
});

export const getPhysicsConstant = (key) => PHYSICS_CONSTANTS[key];
