import { Injectable } from '@nestjs/common';
import {
  GEOPOTENTIAL_CONSTANTS,
  PHYSICS_CONSTANTS,
  deg2rad,
} from '@lab/shared';
import { CalculationRequestDto } from '../dto/calculation.dto';
import { KeplerService } from './kepler.service';
import { CoordinatesService } from './coordinates.service';
import { GeopotentialService } from './geopotential.service';

@Injectable()
export class CalculationService {
  constructor(
    private readonly kepler: KeplerService,
    private readonly coords: CoordinatesService,
    private readonly geopotential: GeopotentialService,
  ) {}

  calculate(body: CalculationRequestDto) {
    const started = performance.now();

    const { orbit } = body;
    const options = body.options ?? {};
    const pointsCount = options.pointsCount ?? 100;
    const maxHarmonicN = options.maxHarmonicN ?? 4;
    const maxHarmonicK = options.maxHarmonicK ?? 3;
    const includeJ2Only = options.includeJ2Only ?? false;
    const tSeconds = options.tSeconds ?? 0;

    const iRad = deg2rad(orbit.i);
    const OmegaRad = deg2rad(orbit.Omega);
    const omegaRad = deg2rad(orbit.omega);
    const M0 = deg2rad(orbit.M);

    const points = Array.from({ length: pointsCount }, (_, idx) => {
      const frac = idx / pointsCount;
      const M = M0 + 2 * Math.PI * frac;

      const E = this.kepler.solveEccentricAnomaly(M, orbit.e);
      const theta =
        2 *
        Math.atan2(
          Math.sqrt(1 + orbit.e) * Math.sin(E / 2),
          Math.sqrt(1 - orbit.e) * Math.cos(E / 2),
        );

      const r = orbit.a * (1 - orbit.e * Math.cos(E)); // km
      const u = theta + omegaRad;

      const positionECI = this.coords.positionECIFromElements({
        r,
        u,
        iRad,
        OmegaRad,
      });
      const positionECEF = this.coords.eciToEcef(positionECI, tSeconds);

      const useEciForSpherical = options.coordinateSystem === 'ECI';
      const spherical = this.coords.toSpherical(
        useEciForSpherical ? positionECI : positionECEF,
      );
      const phi = spherical.phi;
      const lambda = spherical.lambda;

      const cosPhi = Math.cos(phi);
      const safeCosPhi =
        Math.abs(cosPhi) < 1e-12 ? (cosPhi >= 0 ? 1e-12 : -1e-12) : cosPhi;

      // Azimuth formulas (handout, after (5))
      const sinA = Math.cos(iRad) / safeCosPhi;
      const cosA = (Math.cos(u) * Math.sin(iRad)) / safeCosPhi;

      const full = this.geopotential.accelerationSphericalKm({
        rKm: spherical.r,
        phiRad: phi,
        lambdaRad: lambda,
        options: { maxN: maxHarmonicN, maxK: maxHarmonicK, j2Only: false },
      });

      const jr_m = full.jr * 1000;
      const jphi_m = full.jphi * 1000;
      const jlambda_m = full.jlambda * 1000;

      const S = jr_m;
      const T = jphi_m * cosA + jlambda_m * sinA;
      const W = jphi_m * sinA - jlambda_m * cosA;
      const total = Math.hypot(S, T, W);

      let accelerationJ2Only:
        | { S: number; T: number; W: number; total: number }
        | undefined;
      if (includeJ2Only) {
        const j2 = this.geopotential.accelerationSphericalKm({
          rKm: spherical.r,
          phiRad: phi,
          lambdaRad: lambda,
          options: { maxN: 2, maxK: 0, j2Only: true },
        });
        const jr2 = j2.jr * 1000;
        const jphi2 = j2.jphi * 1000;
        const jlambda2 = j2.jlambda * 1000;
        const S2 = jr2;
        const T2 = jphi2 * cosA + jlambda2 * sinA;
        const W2 = jphi2 * sinA - jlambda2 * cosA;
        accelerationJ2Only = {
          S: S2,
          T: T2,
          W: W2,
          total: Math.hypot(S2, T2, W2),
        };
      }

      const newtonAcceleration =
        (PHYSICS_CONSTANTS.mu / (spherical.r * spherical.r)) * 1000;

      return {
        index: idx,
        M,
        E,
        theta,
        u,
        r,
        height: r - PHYSICS_CONSTANTS.r0,
        phi,
        lambda,
        positionECI,
        positionECEF,
        acceleration: { S, T, W, total },
        ...(accelerationJ2Only ? { accelerationJ2Only } : {}),
        newtonAcceleration,
      };
    });

    const totals = points.map((p) => p.acceleration.total);
    const minAcceleration = Math.min(...totals);
    const maxAcceleration = Math.max(...totals);
    const avgAcceleration = totals.reduce((a, b) => a + b, 0) / totals.length;
    const period =
      2 * Math.PI * Math.sqrt(Math.pow(orbit.a, 3) / PHYSICS_CONSTANTS.mu);

    const harmonics: {
      n: number;
      k: number;
      Jn?: number;
      Cnk?: number;
      Snk?: number;
    }[] = [];
    for (let n = 2; n <= Math.min(maxHarmonicN, 21); n++) {
      const Jn = (GEOPOTENTIAL_CONSTANTS.J as Record<number, number>)[n];
      if (Jn !== undefined) harmonics.push({ n, k: 0, Jn });
      for (let k = 1; k <= Math.min(maxHarmonicK, n); k++) {
        const key = `${n},${k}` as const;
        const Cnk = (GEOPOTENTIAL_CONSTANTS.C as Record<string, number>)[key];
        const Snk = (GEOPOTENTIAL_CONSTANTS.S as Record<string, number>)[key];
        if (Cnk !== undefined || Snk !== undefined)
          harmonics.push({ n, k, Cnk, Snk });
      }
    }

    const executionTime = performance.now() - started;

    return {
      success: true,
      data: {
        points,
        summary: { minAcceleration, maxAcceleration, avgAcceleration, period },
        constants: {
          mu: PHYSICS_CONSTANTS.mu,
          r0: PHYSICS_CONSTANTS.r0,
          harmonics,
        },
      },
      executionTime,
    };
  }
}
