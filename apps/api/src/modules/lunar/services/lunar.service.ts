import { Injectable } from '@nestjs/common';
import { LUNAR_CONSTANTS, PHYSICS_CONSTANTS, deg2rad } from '@lab/shared';
import { LunarCalculationRequestDto } from '../dto/lunar-calculation.dto';
import { KeplerService } from '../../calculation/services/kepler.service';
import { CoordinatesService } from '../../calculation/services/coordinates.service';

/**
 * Orbital elements state for integration
 */
interface OrbitalElementsState {
  Omega: number; // Right ascension of ascending node, rad
  i: number; // Inclination, rad
  p: number; // Focal parameter (semi-latus rectum), km
  e: number; // Eccentricity
  omega: number; // Argument of perigee, rad
}

/**
 * Derivative state for RK4
 */
interface OrbitalDerivatives {
  dOmega_du: number;
  di_du: number;
  dp_du: number;
  de_du: number;
  domega_du: number;
}

@Injectable()
export class LunarService {
  constructor(
    private readonly kepler: KeplerService,
    private readonly coords: CoordinatesService,
  ) {}

  /**
   * Calculate lunar perturbations on satellite orbit
   * Based on the methodological guidelines for Laboratory Work #2
   */
  calculate(body: LunarCalculationRequestDto) {
    const started = performance.now();

    const { orbit: satelliteOrbit, moon: moonOrbit } = body;
    const options = body.options ?? {};
    const pointsCount = options.pointsCount ?? 100;
    let integrationTime = options.integrationTime ?? 0;
    const fixedStepSize = options.stepSize; // User-provided step size (optional)

    // Convert satellite orbital elements to radians
    const iRad = deg2rad(satelliteOrbit.i);
    const OmegaRad = deg2rad(satelliteOrbit.Omega);
    const omegaRad = deg2rad(satelliteOrbit.omega);
    const M0 = deg2rad(satelliteOrbit.M);

    // Calculate orbital period of satellite
    const period =
      (2 * Math.PI * Math.sqrt(Math.pow(satelliteOrbit.a, 3))) /
      PHYSICS_CONSTANTS.mu;
    if (integrationTime === 0) {
      integrationTime = period;
    }

    // Initial orbital elements state
    const initialState: OrbitalElementsState = {
      Omega: OmegaRad,
      i: iRad,
      p: satelliteOrbit.a * (1 - satelliteOrbit.e * satelliteOrbit.e), // p = a(1-e²)
      e: satelliteOrbit.e,
      omega: omegaRad,
    };

    // Integration range: one full orbit in argument of latitude
    const u0 = M0 + omegaRad; // Initial argument of latitude (approximation)
    const uFinal = u0 + 2 * Math.PI; // One complete orbit

    // Calculate step size
    let stepSize: number;
    if (fixedStepSize !== undefined && fixedStepSize > 0) {
      // Use user-provided step size (convert from seconds to argument of latitude)
      const meanMotion = Math.sqrt(
        PHYSICS_CONSTANTS.mu / Math.pow(satelliteOrbit.a, 3),
      );
      stepSize = meanMotion * fixedStepSize; // Convert time step to u step
    } else {
      // Automatic step based on points count
      stepSize = (uFinal - u0) / Math.max(100, pointsCount);
    }

    // Perform RK4 integration
    const integratedStates = this.integrateOrbitalElements(
      initialState,
      u0,
      uFinal,
      stepSize,
      moonOrbit,
      integrationTime,
      pointsCount, // Pass desired points count for resampling
    );

    // Generate output points using integrated states
    const points = integratedStates.map(({ u, state, time }, idx) => {
      // Calculate current true anomaly from argument of latitude
      const theta = u - state.omega;

      // Calculate radius from orbital elements
      const r = state.p / (1 + state.e * Math.cos(theta));

      // Calculate satellite position in ECI using CURRENT orbital elements
      const positionECI = this.coords.positionECIFromElements({
        r,
        u,
        iRad: state.i,
        OmegaRad: state.Omega,
      });

      // Calculate Moon position at this time
      const moonPosition = this.calculateMoonPosition(time, moonOrbit);
      const moonPositionECI = moonPosition.position;

      // Vector from Moon to Satellite (ρ in methodology notation)
      const rho = {
        x: positionECI.x - moonPositionECI.x,
        y: positionECI.y - moonPositionECI.y,
        z: positionECI.z - moonPositionECI.z,
      };
      const rhoMag = Math.hypot(rho.x, rho.y, rho.z);

      // Vector from Moon to Earth (r₁₂ in methodology)
      const r12 = {
        x: -moonPositionECI.x,
        y: -moonPositionECI.y,
        z: -moonPositionECI.z,
      };
      const r12Mag = Math.hypot(r12.x, r12.y, r12.z);

      // Calculate lunar perturbation acceleration components
      const mu_moon = LUNAR_CONSTANTS.mu;
      const Fx =
        -mu_moon * (rho.x / Math.pow(rhoMag, 3) + r12.x / Math.pow(r12Mag, 3));
      const Fy =
        -mu_moon * (rho.y / Math.pow(rhoMag, 3) + r12.y / Math.pow(r12Mag, 3));
      const Fz =
        -mu_moon * (rho.z / Math.pow(rhoMag, 3) + r12.z / Math.pow(r12Mag, 3));

      // Transform to orbital coordinate system (S, T, W)
      const S = Fx * Math.cos(theta) + Fy * Math.sin(theta);
      const T = -Fx * Math.sin(theta) + Fy * Math.cos(theta);
      const W = Fz;

      const total = Math.hypot(S, T, W);

      // Calculate semi-major axis from p and e
      const a = state.p / (1 - state.e * state.e);

      return {
        index: idx,
        t: time,
        u,
        theta,
        r,
        orbitalElements: {
          Omega: state.Omega,
          i: state.i,
          p: state.p,
          e: state.e,
          omega: state.omega,
          a,
        },
        changes: {
          deltaOmega: (state.Omega - initialState.Omega) * (180 / Math.PI),
          deltaI: (state.i - initialState.i) * (180 / Math.PI),
          deltaP: state.p - initialState.p,
          deltaE: state.e - initialState.e,
          deltaOmega_arg: (state.omega - initialState.omega) * (180 / Math.PI),
        },
        positionECI,
        moonPositionECI,
        acceleration: {
          S: S * 1000, // convert to m/s²
          T: T * 1000,
          W: W * 1000,
          total: total * 1000,
        },
      };
    });

    // Calculate statistics on orbital element changes
    const finalState = integratedStates[integratedStates.length - 1].state;
    const orbitalChanges = {
      deltaOmega: (finalState.Omega - initialState.Omega) * (180 / Math.PI),
      deltaI: (finalState.i - initialState.i) * (180 / Math.PI),
      deltaP: finalState.p - initialState.p,
      deltaE: finalState.e - initialState.e,
      deltaOmega_arg: (finalState.omega - initialState.omega) * (180 / Math.PI),
    };

    const executionTime = performance.now() - started;

    return {
      success: true,
      data: {
        points,
        summary: {
          minPerturbation: Math.min(...points.map((p) => p.acceleration.total)),
          maxPerturbation: Math.max(...points.map((p) => p.acceleration.total)),
          avgPerturbation:
            points.reduce((sum, p) => sum + p.acceleration.total, 0) /
            points.length,
          orbitalChanges,
          period,
        },
        constants: {
          muEarth: PHYSICS_CONSTANTS.mu,
          muMoon: LUNAR_CONSTANTS.mu,
          moonOrbit: {
            a: LUNAR_CONSTANTS.a,
            e: LUNAR_CONSTANTS.e,
            i: LUNAR_CONSTANTS.i,
          },
        },
      },
      executionTime,
    };
  }

  /**
   * Runge-Kutta-Fehlberg 4(5) adaptive integration of orbital elements
   * Implements the system of differential equations from methodology p.3
   * with automatic step size control for better accuracy
   */
  private integrateOrbitalElements(
    initialState: OrbitalElementsState,
    u0: number,
    uFinal: number,
    stepSize: number,
    moonOrbit: {
      i: number;
      e: number;
      a: number;
      Omega: number;
      u: number;
    },
    totalTime: number,
    desiredPointsCount: number = 100, // Desired number of output points
  ): Array<{
    u: number;
    state: OrbitalElementsState;
    time: number;
  }> {
    const tolerance = 1e-8; // Relative error tolerance
    const minStep = (uFinal - u0) / 10000; // Minimum step size
    const maxStep = (uFinal - u0) / 50; // Maximum step size
    const safetyFactor = 0.9; // Safety factor for step adjustment
    const beta = 0.2; // Maximum step change factor

    const states: Array<{
      u: number;
      state: OrbitalElementsState;
      time: number;
    }> = [];

    const currentState = { ...initialState };
    let currentU = u0;
    let h = Math.min(stepSize, maxStep); // Current step size

    states.push({ u: currentU, state: { ...currentState }, time: 0 });

    while (currentU < uFinal) {
      // Adjust step size to not exceed uFinal
      if (currentU + h > uFinal) {
        h = uFinal - currentU;
      }

      // RKF45: Compute both 4th and 5th order solutions
      const result = this.rkf45Step(
        currentState,
        currentU,
        h,
        moonOrbit,
        totalTime,
        u0,
      );

      // Estimate error (difference between 4th and 5th order)
      const error = this.estimateError(
        result.state4,
        result.state5,
        currentState,
      );

      // Check if error is acceptable
      if (error <= tolerance || h <= minStep) {
        // Accept the step
        currentU += h;
        Object.assign(currentState, result.state5); // Use higher order solution

        // Normalize angles
        currentState.Omega = this.normalizeAngle(currentState.Omega);
        currentState.omega = this.normalizeAngle(currentState.omega);

        // Calculate corresponding time
        const time = ((currentU - u0) / (2 * Math.PI)) * totalTime;

        states.push({ u: currentU, state: { ...currentState }, time });
      }

      // Adjust step size for next iteration
      if (error > 0) {
        const factor = safetyFactor * Math.pow(tolerance / error, 0.2); // 1/5 power for RKF45
        const limitedFactor = Math.max(0.1, Math.min(factor, 1 / (1 - beta)));
        h = Math.max(minStep, Math.min(h * limitedFactor, maxStep));
      }
    }

    // Resample to match desired points count
    const resampledStates = this.resampleStates(states, desiredPointsCount);

    return resampledStates;
  }

  /**
   * Resample integrated states to match desired points count
   */
  private resampleStates(
    states: Array<{
      u: number;
      state: OrbitalElementsState;
      time: number;
    }>,
    desiredCount: number,
  ): Array<{
    u: number;
    state: OrbitalElementsState;
    time: number;
  }> {
    if (states.length <= 2 || desiredCount <= 2) {
      return states; // No need to resample
    }

    const resampled: Array<{
      u: number;
      state: OrbitalElementsState;
      time: number;
    }> = [];

    const uStart = states[0].u;
    const uEnd = states[states.length - 1].u;
    const du = (uEnd - uStart) / (desiredCount - 1);

    for (let i = 0; i < desiredCount; i++) {
      const targetU = uStart + i * du;

      // Find surrounding points in original array
      let lowerIdx = 0;
      let upperIdx = states.length - 1;

      for (let j = 0; j < states.length - 1; j++) {
        if (states[j].u <= targetU && states[j + 1].u >= targetU) {
          lowerIdx = j;
          upperIdx = j + 1;
          break;
        }
      }

      // Linear interpolation
      const lower = states[lowerIdx];
      const upper = states[upperIdx];

      if (lowerIdx === upperIdx) {
        resampled.push({ ...lower });
      } else {
        const t = (targetU - lower.u) / (upper.u - lower.u);

        const interpolatedState: OrbitalElementsState = {
          Omega:
            lower.state.Omega + t * (upper.state.Omega - lower.state.Omega),
          i: lower.state.i + t * (upper.state.i - lower.state.i),
          p: lower.state.p + t * (upper.state.p - lower.state.p),
          e: lower.state.e + t * (upper.state.e - lower.state.e),
          omega:
            lower.state.omega + t * (upper.state.omega - lower.state.omega),
        };

        resampled.push({
          u: targetU,
          state: interpolatedState,
          time: lower.time + t * (upper.time - lower.time),
        });
      }
    }

    return resampled;
  }

  /**
   * Single RKF45 step - computes both 4th and 5th order solutions
   */
  private rkf45Step(
    state: OrbitalElementsState,
    u: number,
    h: number,
    moonOrbit: {
      i: number;
      e: number;
      a: number;
      Omega: number;
      u: number;
    },
    totalTime: number,
    u0: number,
  ): { state4: OrbitalElementsState; state5: OrbitalElementsState } {
    // RKF45 coefficients
    const c2 = 1 / 4;
    const c3 = 3 / 8;
    const c4 = 12 / 13;
    const c5 = 1;
    const c6 = 1 / 2;

    const k1 = this.computeDerivatives(
      state,
      u,
      moonOrbit,
      ((u - u0) / (2 * Math.PI)) * totalTime,
    );

    const state2 = this.addScaledState(state, k1, h * c2);
    const k2 = this.computeDerivatives(
      state2,
      u + h * c2,
      moonOrbit,
      ((u + h * c2 - u0) / (2 * Math.PI)) * totalTime,
    );

    const state3: OrbitalElementsState = {
      Omega:
        state.Omega + h * ((3 / 32) * k1.dOmega_du + (9 / 32) * k2.dOmega_du),
      i: state.i + h * ((3 / 32) * k1.di_du + (9 / 32) * k2.di_du),
      p: state.p + h * ((3 / 32) * k1.dp_du + (9 / 32) * k2.dp_du),
      e: state.e + h * ((3 / 32) * k1.de_du + (9 / 32) * k2.de_du),
      omega:
        state.omega + h * ((3 / 32) * k1.domega_du + (9 / 32) * k2.domega_du),
    };
    const k3 = this.computeDerivatives(
      state3,
      u + h * c3,
      moonOrbit,
      ((u + h * c3 - u0) / (2 * Math.PI)) * totalTime,
    );

    const state4_temp: OrbitalElementsState = {
      Omega:
        state.Omega +
        h *
          ((1932 / 2197) * k1.dOmega_du -
            (7200 / 2197) * k2.dOmega_du +
            (7296 / 2197) * k3.dOmega_du),
      i:
        state.i +
        h *
          ((1932 / 2197) * k1.di_du -
            (7200 / 2197) * k2.di_du +
            (7296 / 2197) * k3.di_du),
      p:
        state.p +
        h *
          ((1932 / 2197) * k1.dp_du -
            (7200 / 2197) * k2.dp_du +
            (7296 / 2197) * k3.dp_du),
      e:
        state.e +
        h *
          ((1932 / 2197) * k1.de_du -
            (7200 / 2197) * k2.de_du +
            (7296 / 2197) * k3.de_du),
      omega:
        state.omega +
        h *
          ((1932 / 2197) * k1.domega_du -
            (7200 / 2197) * k2.domega_du +
            (7296 / 2197) * k3.domega_du),
    };
    const k4 = this.computeDerivatives(
      state4_temp,
      u + h * c4,
      moonOrbit,
      ((u + h * c4 - u0) / (2 * Math.PI)) * totalTime,
    );

    const state5_temp: OrbitalElementsState = {
      Omega:
        state.Omega +
        h *
          ((439 / 216) * k1.dOmega_du -
            8 * k2.dOmega_du +
            (3680 / 513) * k3.dOmega_du -
            (845 / 4104) * k4.dOmega_du),
      i:
        state.i +
        h *
          ((439 / 216) * k1.di_du -
            8 * k2.di_du +
            (3680 / 513) * k3.di_du -
            (845 / 4104) * k4.di_du),
      p:
        state.p +
        h *
          ((439 / 216) * k1.dp_du -
            8 * k2.dp_du +
            (3680 / 513) * k3.dp_du -
            (845 / 4104) * k4.dp_du),
      e:
        state.e +
        h *
          ((439 / 216) * k1.de_du -
            8 * k2.de_du +
            (3680 / 513) * k3.de_du -
            (845 / 4104) * k4.de_du),
      omega:
        state.omega +
        h *
          ((439 / 216) * k1.domega_du -
            8 * k2.domega_du +
            (3680 / 513) * k3.domega_du -
            (845 / 4104) * k4.domega_du),
    };
    const k5 = this.computeDerivatives(
      state5_temp,
      u + h * c5,
      moonOrbit,
      ((u + h * c5 - u0) / (2 * Math.PI)) * totalTime,
    );

    const state6_temp: OrbitalElementsState = {
      Omega:
        state.Omega +
        h *
          ((-8 / 27) * k1.dOmega_du +
            2 * k2.dOmega_du -
            (3544 / 2565) * k3.dOmega_du +
            (1859 / 4104) * k4.dOmega_du -
            (11 / 40) * k5.dOmega_du),
      i:
        state.i +
        h *
          ((-8 / 27) * k1.di_du +
            2 * k2.di_du -
            (3544 / 2565) * k3.di_du +
            (1859 / 4104) * k4.di_du -
            (11 / 40) * k5.di_du),
      p:
        state.p +
        h *
          ((-8 / 27) * k1.dp_du +
            2 * k2.dp_du -
            (3544 / 2565) * k3.dp_du +
            (1859 / 4104) * k4.dp_du -
            (11 / 40) * k5.dp_du),
      e:
        state.e +
        h *
          ((-8 / 27) * k1.de_du +
            2 * k2.de_du -
            (3544 / 2565) * k3.de_du +
            (1859 / 4104) * k4.de_du -
            (11 / 40) * k5.de_du),
      omega:
        state.omega +
        h *
          ((-8 / 27) * k1.domega_du +
            2 * k2.domega_du -
            (3544 / 2565) * k3.domega_du +
            (1859 / 4104) * k4.domega_du -
            (11 / 40) * k5.domega_du),
    };
    const k6 = this.computeDerivatives(
      state6_temp,
      u + h * c6,
      moonOrbit,
      ((u + h * c6 - u0) / (2 * Math.PI)) * totalTime,
    );

    // 4th order solution (for error estimation)
    const state4: OrbitalElementsState = {
      Omega:
        state.Omega +
        h *
          ((25 / 216) * k1.dOmega_du +
            (1408 / 2565) * k3.dOmega_du +
            (2197 / 4104) * k4.dOmega_du -
            (1 / 5) * k5.dOmega_du),
      i:
        state.i +
        h *
          ((25 / 216) * k1.di_du +
            (1408 / 2565) * k3.di_du +
            (2197 / 4104) * k4.di_du -
            (1 / 5) * k5.di_du),
      p:
        state.p +
        h *
          ((25 / 216) * k1.dp_du +
            (1408 / 2565) * k3.dp_du +
            (2197 / 4104) * k4.dp_du -
            (1 / 5) * k5.dp_du),
      e:
        state.e +
        h *
          ((25 / 216) * k1.de_du +
            (1408 / 2565) * k3.de_du +
            (2197 / 4104) * k4.de_du -
            (1 / 5) * k5.de_du),
      omega:
        state.omega +
        h *
          ((25 / 216) * k1.domega_du +
            (1408 / 2565) * k3.domega_du +
            (2197 / 4104) * k4.domega_du -
            (1 / 5) * k5.domega_du),
    };

    // 5th order solution (more accurate)
    const state5: OrbitalElementsState = {
      Omega:
        state.Omega +
        h *
          ((16 / 135) * k1.dOmega_du +
            (6656 / 12825) * k3.dOmega_du +
            (28561 / 56430) * k4.dOmega_du -
            (9 / 50) * k5.dOmega_du +
            (2 / 55) * k6.dOmega_du),
      i:
        state.i +
        h *
          ((16 / 135) * k1.di_du +
            (6656 / 12825) * k3.di_du +
            (28561 / 56430) * k4.di_du -
            (9 / 50) * k5.di_du +
            (2 / 55) * k6.di_du),
      p:
        state.p +
        h *
          ((16 / 135) * k1.dp_du +
            (6656 / 12825) * k3.dp_du +
            (28561 / 56430) * k4.dp_du -
            (9 / 50) * k5.dp_du +
            (2 / 55) * k6.dp_du),
      e:
        state.e +
        h *
          ((16 / 135) * k1.de_du +
            (6656 / 12825) * k3.de_du +
            (28561 / 56430) * k4.de_du -
            (9 / 50) * k5.de_du +
            (2 / 55) * k6.de_du),
      omega:
        state.omega +
        h *
          ((16 / 135) * k1.domega_du +
            (6656 / 12825) * k3.domega_du +
            (28561 / 56430) * k4.domega_du -
            (9 / 50) * k5.domega_du +
            (2 / 55) * k6.domega_du),
    };

    return { state4, state5 };
  }

  /**
   * Estimate relative error between 4th and 5th order solutions
   */
  private estimateError(
    state4: OrbitalElementsState,
    state5: OrbitalElementsState,
    statePrev: OrbitalElementsState,
  ): number {
    const scale = 1e-10; // Small number to avoid division by zero

    const diffOmega =
      Math.abs(state4.Omega - state5.Omega) /
      (Math.abs(statePrev.Omega) + scale);
    const diffI =
      Math.abs(state4.i - state5.i) / (Math.abs(statePrev.i) + scale);
    const diffP =
      Math.abs(state4.p - state5.p) / (Math.abs(statePrev.p) + scale);
    const diffE =
      Math.abs(state4.e - state5.e) / (Math.abs(statePrev.e) + scale);
    const diffOmega_arg =
      Math.abs(state4.omega - state5.omega) /
      (Math.abs(statePrev.omega) + scale);

    // Return maximum relative error
    return Math.max(diffOmega, diffI, diffP, diffE, diffOmega_arg);
  }

  /**
   * Compute derivatives of orbital elements
   * Implements differential equations from methodology p.3
   */
  private computeDerivatives(
    state: OrbitalElementsState,
    u: number,
    moonOrbit: {
      i: number;
      e: number;
      a: number;
      Omega: number;
      u: number;
    },
    time: number = 0, // Time since start of integration
  ): OrbitalDerivatives {
    // Calculate satellite position at this argument of latitude
    const theta = u - state.omega; // true anomaly
    const r = state.p / (1 + state.e * Math.cos(theta));

    // Calculate Moon position at current time (evolves with integration)
    const moonPosition = this.calculateMoonPosition(time, moonOrbit);
    const moonPositionECI = moonPosition.position;

    // Get satellite position in ECI
    const positionECI = this.coords.positionECIFromElements({
      r,
      u,
      iRad: state.i,
      OmegaRad: state.Omega,
    });

    // Calculate perturbing acceleration (same as main calculation)
    const rho = {
      x: positionECI.x - moonPositionECI.x,
      y: positionECI.y - moonPositionECI.y,
      z: positionECI.z - moonPositionECI.z,
    };
    const rhoMag = Math.hypot(rho.x, rho.y, rho.z);

    const r12 = {
      x: -moonPositionECI.x,
      y: -moonPositionECI.y,
      z: -moonPositionECI.z,
    };
    const r12Mag = Math.hypot(r12.x, r12.y, r12.z);

    const mu_moon = LUNAR_CONSTANTS.mu;
    const Fx =
      -mu_moon * (rho.x / Math.pow(rhoMag, 3) + r12.x / Math.pow(r12Mag, 3));
    const Fy =
      -mu_moon * (rho.y / Math.pow(rhoMag, 3) + r12.y / Math.pow(r12Mag, 3));
    const Fz =
      -mu_moon * (rho.z / Math.pow(rhoMag, 3) + r12.z / Math.pow(r12Mag, 3));

    // Transform to orbital frame
    const S = Fx * Math.cos(theta) + Fy * Math.sin(theta);
    const T = -Fx * Math.sin(theta) + Fy * Math.cos(theta);
    const W = Fz;

    const mu = PHYSICS_CONSTANTS.mu;

    // Differential equations from methodology p.3
    const sinU = Math.sin(u);
    const cosU = Math.cos(u);
    const sinI = Math.sin(state.i);
    const cosI = Math.cos(state.i);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    // Avoid division by zero
    const safeSinI =
      Math.abs(sinI) < 1e-10 ? (sinI >= 0 ? 1e-10 : -1e-10) : sinI;
    const safeE = Math.abs(state.e) < 1e-10 ? 1e-10 : state.e;

    // dΩ/du = (r³ sin u) / (μ p sin i) * W
    const dOmega_du = ((Math.pow(r, 3) * sinU) / (mu * state.p * safeSinI)) * W;

    // di/du = (r³ cos u) / (μ p) * W
    const di_du = ((Math.pow(r, 3) * cosU) / (mu * state.p)) * W;

    // dp/du = (2r³)/μ * T
    const dp_du = ((2 * Math.pow(r, 3)) / mu) * T;

    // de/du = (r²)/(μ e) * [sin ν S + cos ν (1 + r/p) T + e (r/p) W]
    const de_du =
      (Math.pow(r, 2) / (mu * safeE)) *
      (sinTheta * S +
        cosTheta * (1 + r / state.p) * T +
        state.e * (r / state.p) * W);

    // dω/du = (r²)/(μ e) * [cos ν S + e sin ν (1 + r/p) T - e (r/p) cot i sin u W]
    const cotI = cosI / safeSinI;
    const domega_du =
      (Math.pow(r, 2) / (mu * safeE)) *
      (cosTheta * S +
        state.e * sinTheta * (1 + r / state.p) * T -
        state.e * (r / state.p) * cotI * sinU * W);

    return {
      dOmega_du,
      di_du,
      dp_du,
      de_du,
      domega_du,
    };
  }

  /**
   * Add scaled derivative to state (for RK4 intermediate steps)
   */
  private addScaledState(
    state: OrbitalElementsState,
    derivs: OrbitalDerivatives,
    scale: number,
  ): OrbitalElementsState {
    return {
      Omega: state.Omega + scale * derivs.dOmega_du,
      i: state.i + scale * derivs.di_du,
      p: state.p + scale * derivs.dp_du,
      e: state.e + scale * derivs.de_du,
      omega: state.omega + scale * derivs.domega_du,
    };
  }

  /**
   * Normalize angle to [0, 2π) range
   */
  private normalizeAngle(angle: number): number {
    let normalized = angle % (2 * Math.PI);
    if (normalized < 0) {
      normalized += 2 * Math.PI;
    }
    return normalized;
  }

  /**
   * Calculate Moon's position in ECI frame at given time
   * Simplified model using circular orbit approximation
   */
  private calculateMoonPosition(
    time: number,
    moonOrbit: {
      i: number;
      e: number;
      a: number;
      Omega: number;
      u: number;
    },
  ) {
    // Mean motion of Moon (rad/s)
    const n_moon = Math.sqrt(LUNAR_CONSTANTS.mu / Math.pow(moonOrbit.a, 3));

    // Mean anomaly at time t
    const M_moon = n_moon * time + deg2rad(moonOrbit.u);

    // Solve for eccentric anomaly using shared service
    const E_moon = this.kepler.solveEccentricAnomaly(M_moon, moonOrbit.e);

    // True anomaly
    const theta_moon =
      2 *
      Math.atan2(
        Math.sqrt(1 + moonOrbit.e) * Math.sin(E_moon / 2),
        Math.sqrt(1 - moonOrbit.e) * Math.cos(E_moon / 2),
      );

    // Distance from Earth
    const r_moon = moonOrbit.a * (1 - moonOrbit.e * Math.cos(E_moon));

    // Argument of latitude
    const u_moon = theta_moon + deg2rad(moonOrbit.Omega);

    // Position in ECI
    const moonIRad = deg2rad(moonOrbit.i);
    const moonOmegaRad = deg2rad(moonOrbit.Omega);

    const x =
      r_moon *
      (Math.cos(moonOmegaRad) * Math.cos(u_moon) -
        Math.sin(moonOmegaRad) * Math.sin(u_moon) * Math.cos(moonIRad));
    const y =
      r_moon *
      (Math.sin(moonOmegaRad) * Math.cos(u_moon) +
        Math.cos(moonOmegaRad) * Math.sin(u_moon) * Math.cos(moonIRad));
    const z = r_moon * Math.sin(u_moon) * Math.sin(moonIRad);

    return {
      position: { x, y, z },
      r: r_moon,
      theta: theta_moon,
      u: u_moon,
    };
  }
}
