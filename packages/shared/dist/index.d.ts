import { z } from 'zod';

/**
 * Constants from the lab handout (page with coefficients).
 * Values are stored already scaled to the actual coefficients:
 * - Jn: given as (value * 1e-6) in the handout
 * - Cnk/Snk: given as (value * 1e-8) in the handout
 */
declare const GEOPOTENTIAL_CONSTANTS: {
    readonly J: {
        readonly 2: 0.001082628;
        readonly 3: -0.000002538;
        readonly 4: -0.000001593;
        readonly 5: -2.3e-7;
        readonly 6: 5.02e-7;
        readonly 7: -3.61e-7;
        readonly 8: -1.18e-7;
        readonly 9: -1e-7;
        readonly 10: -3.54e-7;
        readonly 11: 2.02e-7;
        readonly 12: -4.2e-8;
        readonly 13: -1.23e-7;
        readonly 14: -7.3e-8;
        readonly 15: -1.74e-7;
        readonly 16: 1.87e-7;
        readonly 17: 8.5e-8;
        readonly 18: -2.31e-7;
        readonly 19: -2.16e-7;
        readonly 20: -5e-9;
        readonly 21: 1.45e-7;
    };
    readonly C: {
        readonly '2,1': 0;
        readonly '2,2': 0.0000024129;
        readonly '3,1': 0.0000019698;
        readonly '3,2': 8.9204e-7;
        readonly '3,3': 6.863e-7;
        readonly '4,1': -5.2989e-7;
        readonly '4,2': 3.3024e-7;
        readonly '4,3': 9.8943e-7;
        readonly '4,4': -7.9692e-8;
        readonly '5,1': -5.3816e-8;
        readonly '5,2': 6.1286e-7;
        readonly '5,3': -4.3083e-7;
        readonly '5,4': -2.6693e-7;
        readonly '5,5': 1.2593e-7;
        readonly '6,1': -9.8984e-8;
        readonly '6,2': 5.4825e-8;
        readonly '6,3': 2.7873e-8;
        readonly '6,4': -4.0342e-10;
        readonly '6,5': -2.1143e-7;
        readonly '6,6': 8.8693e-8;
        readonly '7,1': 2.4142e-7;
    };
    readonly S: {
        readonly '2,1': 0;
        readonly '2,2': -0.0000013641;
        readonly '3,1': 2.6015e-7;
        readonly '3,2': -6.3468e-7;
        readonly '3,3': 0.0000014304;
        readonly '4,1': -4.8765e-7;
        readonly '4,2': 7.0633e-7;
        readonly '4,3': -1.5467e-7;
        readonly '4,4': 3.3928e-7;
        readonly '5,1': -9.7905e-8;
        readonly '5,2': -3.5087e-7;
        readonly '5,3': -8.6663e-8;
        readonly '5,4': 8.301e-8;
        readonly '5,5': -5.991e-7;
        readonly '6,1': 3.7652e-8;
        readonly '6,2': -3.5175e-7;
        readonly '6,3': 4.4626e-8;
        readonly '6,4': -4.0388e-7;
        readonly '6,5': -5.2264e-7;
        readonly '6,6': -7.4756e-8;
        readonly '7,1': 1.1567e-7;
    };
};
type HarmonicKey = `${number},${number}`;

declare const PHYSICS_CONSTANTS: {
    /** km^3 / s^2 */
    readonly mu: 398600.4418;
    /** km (equatorial radius) */
    readonly r0: 6378.137;
    /** rad/s */
    readonly omegaE: 0.00007292115;
    /** rad (0.001 deg) */
    readonly epsilon: number;
};

type CoordinateSystem = 'ECI' | 'ECEF';
interface Vector3 {
    x: number;
    y: number;
    z: number;
}
interface OrbitalElements {
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
interface CalculationOptions {
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
interface CalculationRequest {
    orbit: OrbitalElements;
    options?: CalculationOptions;
}
interface OrbitPoint {
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
interface CalculationResponse {
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
            harmonics: {
                n: number;
                k: number;
                Jn?: number;
                Cnk?: number;
                Snk?: number;
            }[];
        };
    };
    executionTime: number;
}

declare function deg2rad(deg: number): number;
declare function rad2deg(rad: number): number;
declare function clamp(x: number, min: number, max: number): number;
declare function hypot3(x: number, y: number, z: number): number;

declare const OrbitalElementsSchema: z.ZodObject<{
    a: z.ZodNumber;
    e: z.ZodNumber;
    i: z.ZodNumber;
    Omega: z.ZodNumber;
    omega: z.ZodNumber;
    M: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    a: number;
    e: number;
    i: number;
    Omega: number;
    omega: number;
    M: number;
}, {
    a: number;
    e: number;
    i: number;
    Omega: number;
    omega: number;
    M: number;
}>;
declare const CalculationOptionsSchema: z.ZodOptional<z.ZodObject<{
    pointsCount: z.ZodOptional<z.ZodNumber>;
    maxHarmonicN: z.ZodOptional<z.ZodNumber>;
    maxHarmonicK: z.ZodOptional<z.ZodNumber>;
    coordinateSystem: z.ZodOptional<z.ZodEnum<["ECI", "ECEF"]>>;
    includeJ2Only: z.ZodOptional<z.ZodBoolean>;
    tSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    pointsCount?: number | undefined;
    maxHarmonicN?: number | undefined;
    maxHarmonicK?: number | undefined;
    coordinateSystem?: "ECI" | "ECEF" | undefined;
    includeJ2Only?: boolean | undefined;
    tSeconds?: number | undefined;
}, {
    pointsCount?: number | undefined;
    maxHarmonicN?: number | undefined;
    maxHarmonicK?: number | undefined;
    coordinateSystem?: "ECI" | "ECEF" | undefined;
    includeJ2Only?: boolean | undefined;
    tSeconds?: number | undefined;
}>>;
declare const CalculationRequestSchema: z.ZodObject<{
    orbit: z.ZodObject<{
        a: z.ZodNumber;
        e: z.ZodNumber;
        i: z.ZodNumber;
        Omega: z.ZodNumber;
        omega: z.ZodNumber;
        M: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        a: number;
        e: number;
        i: number;
        Omega: number;
        omega: number;
        M: number;
    }, {
        a: number;
        e: number;
        i: number;
        Omega: number;
        omega: number;
        M: number;
    }>;
    options: z.ZodOptional<z.ZodObject<{
        pointsCount: z.ZodOptional<z.ZodNumber>;
        maxHarmonicN: z.ZodOptional<z.ZodNumber>;
        maxHarmonicK: z.ZodOptional<z.ZodNumber>;
        coordinateSystem: z.ZodOptional<z.ZodEnum<["ECI", "ECEF"]>>;
        includeJ2Only: z.ZodOptional<z.ZodBoolean>;
        tSeconds: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        pointsCount?: number | undefined;
        maxHarmonicN?: number | undefined;
        maxHarmonicK?: number | undefined;
        coordinateSystem?: "ECI" | "ECEF" | undefined;
        includeJ2Only?: boolean | undefined;
        tSeconds?: number | undefined;
    }, {
        pointsCount?: number | undefined;
        maxHarmonicN?: number | undefined;
        maxHarmonicK?: number | undefined;
        coordinateSystem?: "ECI" | "ECEF" | undefined;
        includeJ2Only?: boolean | undefined;
        tSeconds?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    orbit: {
        a: number;
        e: number;
        i: number;
        Omega: number;
        omega: number;
        M: number;
    };
    options?: {
        pointsCount?: number | undefined;
        maxHarmonicN?: number | undefined;
        maxHarmonicK?: number | undefined;
        coordinateSystem?: "ECI" | "ECEF" | undefined;
        includeJ2Only?: boolean | undefined;
        tSeconds?: number | undefined;
    } | undefined;
}, {
    orbit: {
        a: number;
        e: number;
        i: number;
        Omega: number;
        omega: number;
        M: number;
    };
    options?: {
        pointsCount?: number | undefined;
        maxHarmonicN?: number | undefined;
        maxHarmonicK?: number | undefined;
        coordinateSystem?: "ECI" | "ECEF" | undefined;
        includeJ2Only?: boolean | undefined;
        tSeconds?: number | undefined;
    } | undefined;
}>;

export { type CalculationOptions, CalculationOptionsSchema, type CalculationRequest, CalculationRequestSchema, type CalculationResponse, type CoordinateSystem, GEOPOTENTIAL_CONSTANTS, type HarmonicKey, type OrbitPoint, type OrbitalElements, OrbitalElementsSchema, PHYSICS_CONSTANTS, type Vector3, clamp, deg2rad, hypot3, rad2deg };
