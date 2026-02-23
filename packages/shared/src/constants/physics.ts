export const PHYSICS_CONSTANTS = {
  /** km^3 / s^2 */
  mu: 398600.4418,
  /** km (equatorial radius) */
  r0: 6378.137,
  /** rad/s */
  omegaE: 7.292115e-5,
  /** rad (0.001 deg) */
  epsilon: (0.001 * Math.PI) / 180,
} as const;

