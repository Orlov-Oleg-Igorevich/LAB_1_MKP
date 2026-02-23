export type CoordinateSystem = 'ECI' | 'ECEF';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface OrbitalElements {
  /** Semi-major axis, km */
  a: number;
  /** Eccentricity */
  e: number;
  /** Inclination, deg */
  i: number;
  /** RAAN, deg */
  Omega: number;
  /** Argument of perigee, deg */
  omega: number;
  /** Mean anomaly, deg */
  M: number;
}

export interface CalculationOptions {
  /** Number of points along the orbit. Default: 100 */
  pointsCount?: number;
  /** Maximum harmonic degree n. Default: 4 */
  maxHarmonicN?: number;
  /** Maximum harmonic order k. Default: 3 */
  maxHarmonicK?: number;
  coordinateSystem?: CoordinateSystem;
  /** If true, compute J2-only model additionally (for compare) */
  includeJ2Only?: boolean;
  /** Time since epoch t=0, seconds. Used for Earth rotation S(t)=omegaE*t (simplified). Default: 0 */
  tSeconds?: number;
}

export interface CalculationRequest {
  orbit: OrbitalElements;
  options?: CalculationOptions;
}

export interface OrbitPoint {
  index: number;
  /** Mean anomaly, rad */
  M: number;
  /** Eccentric anomaly, rad */
  E: number;
  /** True anomaly, rad */
  theta: number;
  /** Argument of latitude, rad */
  u: number;
  /** Radius, km */
  r: number;
  /** Height above r0, km */
  height: number;
  /** Geocentric latitude, rad */
  phi: number;
  /** Geocentric longitude, rad */
  lambda: number;
  positionECI: Vector3;
  positionECEF: Vector3;
  acceleration: {
    /** Radial (S), m/s^2 */
    S: number;
    /** Transversal (T), m/s^2 */
    T: number;
    /** Binormal (W), m/s^2 */
    W: number;
    /** Total, m/s^2 */
    total: number;
  };
  accelerationJ2Only?: {
    S: number;
    T: number;
    W: number;
    total: number;
  };
  /** Newtonian central acceleration magnitude, m/s^2 */
  newtonAcceleration: number;
}

export interface CalculationResponse {
  success: boolean;
  data: {
    points: OrbitPoint[];
    summary: {
      minAcceleration: number;
      maxAcceleration: number;
      avgAcceleration: number;
      period: number;
    };
    constants: {
      mu: number;
      r0: number;
      harmonics: { n: number; k: number; Jn?: number; Cnk?: number; Snk?: number }[];
    };
  };
  executionTime: number;
}

