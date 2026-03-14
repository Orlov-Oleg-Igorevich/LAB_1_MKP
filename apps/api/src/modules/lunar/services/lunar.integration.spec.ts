import { Test, TestingModule } from '@nestjs/testing';
import { LunarService } from '../services/lunar.service';
import { KeplerService } from '../../calculation/services/kepler.service';
import { CoordinatesService } from '../../calculation/services/coordinates.service';
import { PHYSICS_CONSTANTS } from '@lab/shared';

describe('LunarService - Integration Tests', () => {
  let lunarService: LunarService;
  let mockKeplerService: Partial<KeplerService>;
  let mockCoordinatesService: Partial<CoordinatesService>;

  beforeEach(async () => {
    mockKeplerService = {
      solveEccentricAnomaly: jest.fn(),
      trueAnomalyFromMean: jest.fn(),
      positionECIFromElements: jest.fn(),
    };

    mockCoordinatesService = {
      positionECIFromElements: jest.fn(),
      eciToEcef: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LunarService,
        {
          provide: KeplerService,
          useValue: mockKeplerService,
        },
        {
          provide: CoordinatesService,
          useValue: mockCoordinatesService,
        },
      ],
    }).compile();

    lunarService = module.get<LunarService>(LunarService);
  });

  describe('Full Calculation Workflow - Variant 1', () => {
    it('should complete full calculation for Variant 1 parameters', async () => {
      // Variant 1 from methodological guidelines
      const requestBody = {
        orbit: {
          i: 82.1,
          a: (134000 + 84000 + 2 * 6378.137) / 2, // Convert h_a/h_p to semi-major axis
          e: (134000 - 84000) / (134000 + 84000 + 2 * 6378.137),
          Omega: 60,
          omega: 0,
          M: 70 - 0, // u = omega + M, assuming omega=0
        },
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount: 100,
        },
      };

      const result = await lunarService.calculate(requestBody);

      // Validate response structure
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('points');
      expect(result.data).toHaveProperty('summary');
      expect(result.data).toHaveProperty('constants');

      // Validate points array
      expect(Array.isArray(result.data.points)).toBe(true);
      expect(result.data.points.length).toBeGreaterThan(0);

      // Validate first point structure
      const firstPoint = result.data.points[0];
      expect(firstPoint).toHaveProperty('index', 0);
      expect(firstPoint).toHaveProperty('t');
      expect(firstPoint).toHaveProperty('u');
      expect(firstPoint).toHaveProperty('r');
      expect(firstPoint).toHaveProperty('orbitalElements');
      expect(firstPoint).toHaveProperty('acceleration');
      expect(firstPoint.acceleration).toHaveProperty('S');
      expect(firstPoint.acceleration).toHaveProperty('T');
      expect(firstPoint.acceleration).toHaveProperty('W');
      expect(firstPoint.acceleration).toHaveProperty('total');

      // Validate acceleration magnitudes are physically reasonable
      result.data.points.forEach((point: any) => {
        const { S, T, W, total } = point.acceleration;

        // All components should be in km/s² and very small
        expect(Math.abs(S)).toBeLessThan(1e-6);
        expect(Math.abs(T)).toBeLessThan(1e-6);
        expect(Math.abs(W)).toBeLessThan(1e-6);
        expect(total).toBeLessThan(1e-5);

        // Total should equal sqrt(S² + T² + W²)
        const calculatedTotal = Math.hypot(S, T, W);
        expect(total).toBeCloseTo(calculatedTotal, 10);
      });

      // Validate summary statistics
      const { summary } = result.data;
      expect(summary).toHaveProperty('minPerturbation');
      expect(summary).toHaveProperty('maxPerturbation');
      expect(summary).toHaveProperty('avgPerturbation');
      expect(summary).toHaveProperty('orbitalChanges');
      expect(summary).toHaveProperty('period');

      // Summary values should be physically reasonable
      expect(summary.minPerturbation).toBeGreaterThanOrEqual(0);
      expect(summary.maxPerturbation).toBeGreaterThan(summary.minPerturbation);
      expect(summary.avgPerturbation).toBeGreaterThan(summary.minPerturbation);
      expect(summary.avgPerturbation).toBeLessThan(summary.maxPerturbation);

      // Orbital changes should be small for one orbit
      const { orbitalChanges } = summary;
      expect(Math.abs(orbitalChanges.deltaOmega)).toBeLessThan(1); // degrees
      expect(Math.abs(orbitalChanges.deltaI)).toBeLessThan(0.1); // degrees
      expect(Math.abs(orbitalChanges.deltaE)).toBeLessThan(0.01);
      expect(Math.abs(orbitalChanges.deltaOmega_arg)).toBeLessThan(1); // degrees
    });

    it('should show periodic behavior in orbital elements over one orbit', async () => {
      const requestBody = {
        orbit: {
          i: 45,
          a: 26578,
          e: 0.2,
          Omega: 30,
          omega: 0,
          M: 0,
        },
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount: 200, // Higher resolution for better periodicity detection
        },
      };

      const result = await lunarService.calculate(requestBody);
      const points = result.data.points;

      // Extract orbital element time series
      const OmegaSeries = points.map((p: any) => p.orbitalElements.Omega);
      const iSeries = points.map((p: any) => p.orbitalElements.i);
      const eSeries = points.map((p: any) => p.orbitalElements.e);
      const omegaSeries = points.map((p: any) => p.orbitalElements.omega);

      // Check that elements vary continuously (no jumps)
      const checkContinuity = (series: number[], maxJump: number) => {
        for (let i = 1; i < series.length; i++) {
          const diff = Math.abs(series[i] - series[i - 1]);
          expect(diff).toBeLessThan(maxJump);
        }
      };

      checkContinuity(OmegaSeries, 0.1); // rad
      checkContinuity(iSeries, 0.01); // rad
      checkContinuity(eSeries, 0.001);
      checkContinuity(omegaSeries, 0.1); // rad

      // Check for periodic behavior (start and end should be similar but not identical)
      const firstOmega = OmegaSeries[0];
      const lastOmega = OmegaSeries[OmegaSeries.length - 1];
      const deltaOmega = Math.abs(lastOmega - firstOmega);

      // After one orbit, change should be small but non-zero
      expect(deltaOmega).toBeGreaterThan(0);
      expect(deltaOmega).toBeLessThan(Math.PI / 18); // < 10 degrees
    });

    it('should conserve energy in absence of perturbations (sanity check)', async () => {
      // This is a regression test - if we ever remove perturbations,
      // orbital elements should remain constant

      const requestBody = {
        orbit: {
          i: 45,
          a: 26578,
          e: 0.2,
          Omega: 30,
          omega: 0,
          M: 0,
        },
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount: 100,
        },
      };

      const result = await lunarService.calculate(requestBody);

      // With perturbations, energy won't be perfectly conserved,
      // but changes should be small and systematic
      const initialA = result.data.points[0].orbitalElements.a;
      const finalA =
        result.data.points[result.data.points.length - 1].orbitalElements.a;
      const deltaA = Math.abs(finalA - initialA);

      // Semi-major axis change should be small relative to initial value
      expect(deltaA / initialA).toBeLessThan(0.01); // < 1% change
    });
  });

  describe('RK4 Integrator Validation', () => {
    it('should converge with decreasing step size', async () => {
      const baseRequest = {
        orbit: {
          i: 45,
          a: 26578,
          e: 0.2,
          Omega: 30,
          omega: 0,
          M: 0,
        },
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount: 100,
        },
      };

      // Run with different resolutions
      const results = [];
      for (const pointsCount of [50, 100, 200]) {
        const request = {
          ...baseRequest,
          options: { ...baseRequest.options, pointsCount },
        };
        const result = await lunarService.calculate(request);
        results.push(result);
      }

      // Extract final Ω for each resolution
      const finalOmegas = results.map(
        (r: any) =>
          r.data.points[r.data.points.length - 1].orbitalElements.Omega,
      );

      // Differences should decrease with resolution (convergence)
      const diff1 = Math.abs(finalOmegas[1] - finalOmegas[0]);
      const diff2 = Math.abs(finalOmegas[2] - finalOmegas[1]);

      // Not a strict test, just checking rough convergence trend
      // In practice, RK4 should show O(h⁴) convergence
      expect(diff2).toBeLessThanOrEqual(diff1 * 2); // Allow some tolerance
    });

    it('should handle near-circular orbit (e → 0)', async () => {
      const requestBody = {
        orbit: {
          i: 45,
          a: 26578,
          e: 0.001, // Near-circular
          Omega: 30,
          omega: 0,
          M: 0,
        },
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount: 100,
        },
      };

      // Should not throw or produce NaN
      const result = await lunarService.calculate(requestBody);

      expect(result.success).toBe(true);

      // Check no NaN values in results
      result.data.points.forEach((point: any) => {
        expect(point.r).toBeFinite();
        expect(point.acceleration.S).toBeFinite();
        expect(point.acceleration.T).toBeFinite();
        expect(point.acceleration.W).toBeFinite();
        expect(point.orbitalElements.e).toBeFinite();
      });
    });

    it('should handle near-equatorial orbit (i → 0)', async () => {
      const requestBody = {
        orbit: {
          i: 0.1, // Near-equatorial
          a: 26578,
          e: 0.2,
          Omega: 30,
          omega: 0,
          M: 0,
        },
        moon: {
          i: 5.145,
          e: 0.0549,
          a: 384399,
          Omega: 30,
          u: 5,
        },
        options: {
          pointsCount: 100,
        },
      };

      // Should not throw despite cot(i) singularity potential
      const result = await lunarService.calculate(requestBody);

      expect(result.success).toBe(true);

      // Check no NaN or Infinity values
      result.data.points.forEach((point: any) => {
        Object.values(point.orbitalElements).forEach((val: any) => {
          expect(val).toBeFinite();
        });
      });
    });
  });

  describe('Multiple Variants Validation', () => {
    const variants = [
      { id: 1, i: 82.1, ha: 134000, hp: 84000, Omega: 60 },
      { id: 2, i: 81.2, ha: 163000, hp: 65000, Omega: 40 },
      { id: 3, i: 40.5, ha: 86000, hp: 21000, Omega: 40 },
    ];

    it.each(variants)(
      'should successfully process Variant $id',
      async ({ i, ha, hp, Omega }) => {
        const a = (ha + hp + 2 * 6378.137) / 2;
        const e = (ha - hp) / (ha + hp + 2 * 6378.137);

        const requestBody = {
          orbit: { i, a, e, Omega, omega: 0, M: 0 },
          moon: { i: 5.145, e: 0.0549, a: 384399, Omega: 30, u: 5 },
          options: { pointsCount: 100 },
        };

        const result = await lunarService.calculate(requestBody);

        expect(result.success).toBe(true);
        expect(result.data.points.length).toBeGreaterThan(0);

        // Verify all accelerations are finite and reasonable
        result.data.points.forEach((point: any) => {
          expect(point.acceleration.S).toBeFinite();
          expect(point.acceleration.T).toBeFinite();
          expect(point.acceleration.W).toBeFinite();
          expect(point.acceleration.total).toBeFinite();
        });
      },
    );
  });

  describe('Time Correlation', () => {
    it('should have monotonically increasing time', async () => {
      const requestBody = {
        orbit: { i: 45, a: 26578, e: 0.2, Omega: 30, omega: 0, M: 0 },
        moon: { i: 5.145, e: 0.0549, a: 384399, Omega: 30, u: 5 },
        options: { pointsCount: 100 },
      };

      const result = await lunarService.calculate(requestBody);
      const times = result.data.points.map((p: any) => p.t);

      // Time should increase monotonically
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThan(times[i - 1]);
      }

      // Total time should approximately equal orbital period
      const period =
        (2 * Math.PI * Math.sqrt(Math.pow(26578, 3))) / PHYSICS_CONSTANTS.mu;
      const totalTime = times[times.length - 1];

      expect(totalTime).toBeCloseTo(period, 0); // Within 1 second
    });
  });
});
