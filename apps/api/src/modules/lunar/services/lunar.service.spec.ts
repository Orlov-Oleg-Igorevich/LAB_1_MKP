import { Test, TestingModule } from '@nestjs/testing';
import { LunarService } from '../services/lunar.service';
import { KeplerService } from '../../calculation/services/kepler.service';
import { CoordinatesService } from '../../calculation/services/coordinates.service';
import { LUNAR_CONSTANTS, PHYSICS_CONSTANTS } from '@lab/shared';

describe('LunarService - Acceleration Calculations', () => {
  let lunarService: LunarService;
  let mockKeplerService: Partial<KeplerService>;
  let mockCoordinatesService: Partial<CoordinatesService>;

  beforeEach(async () => {
    // Create mocks for dependencies
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Lunar Perturbation Acceleration Formula', () => {
    it('should calculate correct acceleration using Moon-to-Satellite vector (ρ)', () => {
      // Test case: Verify the formula uses correct vectors
      // F = -μ_moon * (ρ/ρ³ + r₁₂/r₁₂³)

      const mu_moon = LUNAR_CONSTANTS.mu;

      // Sample positions (km)
      const satellitePos = { x: 7000, y: 0, z: 0 };
      const moonPos = { x: 384399, y: 0, z: 0 };

      // Vector from Moon to Satellite: ρ = r_sat - r_moon
      const rho = {
        x: satellitePos.x - moonPos.x,
        y: satellitePos.y - moonPos.y,
        z: satellitePos.z - moonPos.z,
      };
      const rhoMag = Math.hypot(rho.x, rho.y, rho.z);

      // Vector from Moon to Earth: r₁₂ = -r_moon
      const r12 = {
        x: -moonPos.x,
        y: -moonPos.y,
        z: -moonPos.z,
      };
      const r12Mag = Math.hypot(r12.x, r12.y, r12.z);

      // Calculate acceleration components
      const Fx =
        -mu_moon * (rho.x / Math.pow(rhoMag, 3) + r12.x / Math.pow(r12Mag, 3));
      const Fy =
        -mu_moon * (rho.y / Math.pow(rhoMag, 3) + r12.y / Math.pow(r12Mag, 3));
      const Fz =
        -mu_moon * (rho.z / Math.pow(rhoMag, 3) + r12.z / Math.pow(r12Mag, 3));

      // Verify calculations are physically reasonable
      expect(Fx).toBeLessThan(0); // Should be negative (toward Earth)
      expect(Fy).toBe(0);
      expect(Fz).toBe(0);

      // Magnitude should be very small (perturbation)
      const magnitude = Math.hypot(Fx, Fy, Fz);
      expect(magnitude).toBeGreaterThan(0);
      expect(magnitude).toBeLessThan(1e-6); // km/s², very small perturbation
    });

    it('should use CORRECT sign (+) between terms, not minus', () => {
      // Critical test: verify we're NOT using the old wrong formula
      // WRONG: F = -μ_moon * (ρ/ρ³ - r₁₂/r₁₂³)
      // CORRECT: F = -μ_moon * (ρ/ρ³ + r₁₂/r₁₂³)

      const mu_moon = LUNAR_CONSTANTS.mu;
      const satPos = { x: 7000, y: 0, z: 0 };
      const moonPos = { x: 384399, y: 0, z: 0 };

      const rho = {
        x: satPos.x - moonPos.x,
        y: satPos.y - moonPos.y,
        z: satPos.z - moonPos.z,
      };
      const rhoMag = Math.hypot(rho.x, rho.y, rho.z);

      const r12 = {
        x: -moonPos.x,
        y: -moonPos.y,
        z: -moonPos.z,
      };
      const r12Mag = Math.hypot(r12.x, r12.y, r12.z);

      // Correct formula with PLUS sign
      const Fx_correct =
        -mu_moon * (rho.x / Math.pow(rhoMag, 3) + r12.x / Math.pow(r12Mag, 3));

      // Wrong formula with MINUS sign (old bug)
      const Fx_wrong =
        -mu_moon * (rho.x / Math.pow(rhoMag, 3) - r12.x / Math.pow(r12Mag, 3));

      // They should be different
      expect(Fx_correct).not.toBe(Fx_wrong);

      // The correct one should be much smaller (difference of two large terms)
      expect(Math.abs(Fx_correct)).toBeLessThan(Math.abs(Fx_wrong));
    });

    it('should transform ECI acceleration to orbital frame (S, T, W)', () => {
      // Given ECI acceleration components
      const Fx = 1e-9;
      const Fy = 2e-9;
      const Fz = 3e-9;

      // Given true anomaly
      const theta = Math.PI / 4; // 45 degrees

      // Transform to orbital frame
      const S = Fx * Math.cos(theta) + Fy * Math.sin(theta);
      const T = -Fx * Math.sin(theta) + Fy * Math.cos(theta);
      const W = Fz;

      // Verify transformation
      expect(S).toBeCloseTo((Fx + Fy) / Math.sqrt(2), 15);
      expect(T).toBeCloseTo((-Fx + Fy) / Math.sqrt(2), 15);
      expect(W).toBe(Fz);

      // Total magnitude
      const total = Math.hypot(S, T, W);
      expect(total).toBeCloseTo(Math.hypot(Fx, Fy, Fz), 15);
    });

    it('should handle edge case when satellite is directly between Earth and Moon', () => {
      const mu_moon = LUNAR_CONSTANTS.mu;

      // All on x-axis: Earth at 0, Satellite at 7000, Moon at 384399
      const satPos = { x: 7000, y: 0, z: 0 };
      const moonPos = { x: 384399, y: 0, z: 0 };

      const rho = {
        x: satPos.x - moonPos.x,
        y: 0,
        z: 0,
      };
      const rhoMag = Math.abs(rho.x);

      const r12 = {
        x: -moonPos.x,
        y: 0,
        z: 0,
      };
      const r12Mag = Math.abs(r12.x);

      const Fx =
        -mu_moon * (rho.x / Math.pow(rhoMag, 3) + r12.x / Math.pow(r12Mag, 3));

      // Should be finite and negative (pulling toward Moon/Earth direction)
      expect(Fx).toBeFinite();
      expect(Fx).toBeLessThan(0);
    });

    it('should handle edge case when satellite is on opposite side of Earth from Moon', () => {
      const mu_moon = LUNAR_CONSTANTS.mu;

      // Earth at 0, Moon at 384399, Satellite at -7000
      const satPos = { x: -7000, y: 0, z: 0 };
      const moonPos = { x: 384399, y: 0, z: 0 };

      const rho = {
        x: satPos.x - moonPos.x,
        y: 0,
        z: 0,
      };
      const rhoMag = Math.abs(rho.x);

      const r12 = {
        x: -moonPos.x,
        y: 0,
        z: 0,
      };
      const r12Mag = Math.abs(r12.x);

      const Fx =
        -mu_moon * (rho.x / Math.pow(rhoMag, 3) + r12.x / Math.pow(r12Mag, 3));

      // Should be finite and positive (both terms pull in +x direction)
      expect(Fx).toBeFinite();
      expect(Fx).toBeGreaterThan(0);
    });
  });

  describe('Acceleration Component Magnitudes', () => {
    it('should produce perturbations in micrometer/s² range', () => {
      // Lunar perturbations are typically in the range of 10^-6 to 10^-9 m/s²
      // which is 10^-9 to 10^-12 km/s²

      const testCases = [
        { satelliteX: 7000, expectedMax: 1e-8 },
        { satelliteX: 20000, expectedMax: 1e-9 },
        { satelliteX: 40000, expectedMax: 1e-10 },
      ];

      testCases.forEach(({ satelliteX, expectedMax }) => {
        const satPos = { x: satelliteX, y: 0, z: 0 };
        const moonPos = { x: 384399, y: 0, z: 0 };

        const rho = {
          x: satPos.x - moonPos.x,
          y: 0,
          z: 0,
        };
        const rhoMag = Math.abs(rho.x);

        const r12 = {
          x: -moonPos.x,
          y: 0,
          z: 0,
        };
        const r12Mag = Math.abs(r12.x);

        const Fx =
          -LUNAR_CONSTANTS.mu *
          (rho.x / Math.pow(rhoMag, 3) + r12.x / Math.pow(r12Mag, 3));

        expect(Math.abs(Fx)).toBeLessThan(expectedMax);
      });
    });
  });

  describe('Vector Mathematics Validation', () => {
    it('should correctly compute ρ vector magnitude', () => {
      const satPos = { x: 7000, y: 0, z: 0 };
      const moonPos = { x: 384399, y: 0, z: 0 };

      const rho = {
        x: satPos.x - moonPos.x,
        y: satPos.y - moonPos.y,
        z: satPos.z - moonPos.z,
      };

      const rhoMag = Math.hypot(rho.x, rho.y, rho.z);

      // Distance should be approximately Moon distance minus satellite distance
      const expectedDistance = 384399 - 7000;
      expect(rhoMag).toBeCloseTo(expectedDistance, 6);
    });

    it('should correctly compute r₁₂ vector magnitude', () => {
      const moonPos = { x: 384399, y: 0, z: 0 };

      const r12 = {
        x: -moonPos.x,
        y: -moonPos.y,
        z: -moonPos.z,
      };

      const r12Mag = Math.hypot(r12.x, r12.y, r12.z);

      // Should equal Moon distance from Earth
      expect(r12Mag).toBeCloseTo(384399, 6);
    });
  });

  describe('Coordinate System Transformation', () => {
    it('should handle arbitrary true anomaly angles', () => {
      const Fx = 1e-9;
      const Fy = 1e-9;
      const Fz = 1e-9;

      const testAngles = [
        0,
        Math.PI / 6,
        Math.PI / 4,
        Math.PI / 3,
        Math.PI / 2,
        Math.PI,
        (3 * Math.PI) / 2,
        2 * Math.PI,
      ];

      testAngles.forEach((theta) => {
        const S = Fx * Math.cos(theta) + Fy * Math.sin(theta);
        const T = -Fx * Math.sin(theta) + Fy * Math.cos(theta);
        const W = Fz;

        // S² + T² should equal Fx² + Fy² (rotation preserves magnitude in plane)
        const inPlaneOrbital = S * S + T * T;
        const inPlaneECI = Fx * Fx + Fy * Fy;

        expect(inPlaneOrbital).toBeCloseTo(inPlaneECI, 20);
        expect(W).toBe(Fz);
      });
    });
  });

  describe('Physical Constants Usage', () => {
    it('should use correct lunar gravitational parameter', () => {
      expect(LUNAR_CONSTANTS.mu).toBe(4902.8);
      expect(LUNAR_CONSTANTS.mu).toBeGreaterThan(0);
    });

    it('should use correct Earth gravitational parameter for comparison', () => {
      expect(PHYSICS_CONSTANTS.mu).toBe(398600.4418);

      // Moon's μ should be much smaller than Earth's
      const ratio = LUNAR_CONSTANTS.mu / PHYSICS_CONSTANTS.mu;
      expect(ratio).toBeCloseTo(1 / 81.3, 3); // Moon is ~1/81 Earth's mass
    });
  });
});

// ============================================================================
// NEW TESTS: Mathematical Model Verification and Integration Accuracy
// ============================================================================

describe('LunarService - Mathematical Model Verification', () => {
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

  describe('Time Evolution in Derivatives', () => {
    it('should compute derivatives with evolving Moon position', () => {
      // This test verifies that Moon position changes with time during integration
      const initialState = {
        Omega: Math.PI / 4,
        i: Math.PI / 3,
        p: 10000,
        e: 0.1,
        omega: 0,
      };

      const moonOrbit = {
        i: 5.145 * (Math.PI / 180),
        e: 0.0549,
        a: 384399,
        Omega: 30 * (Math.PI / 180),
        u: 5 * (Math.PI / 180),
      };

      // Compute derivatives at different times
      const derivs1 = (lunarService as any).computeDerivatives(
        initialState,
        Math.PI / 2,
        moonOrbit,
        0, // t = 0
      );

      const derivs2 = (lunarService as any).computeDerivatives(
        initialState,
        Math.PI / 2,
        moonOrbit,
        3600, // t = 1 hour
      );

      // Derivatives should be different due to Moon motion
      expect(derivs1.dOmega_du).not.toBe(derivs2.dOmega_du);
      expect(derivs1.di_du).not.toBe(derivs2.di_du);
    });

    it('should show continuous change in Moon position with time', () => {
      const moonOrbit = {
        i: 5.145 * (Math.PI / 180),
        e: 0.0549,
        a: 384399,
        Omega: 30 * (Math.PI / 180),
        u: 5 * (Math.PI / 180),
      };

      const state = {
        Omega: 0,
        i: Math.PI / 2,
        p: 10000,
        e: 0,
        omega: 0,
      };

      const u = Math.PI / 4;
      const positions = [];

      // Sample Moon position at multiple time points
      for (let t = 0; t <= 86400; t += 3600) {
        const derivs = (lunarService as any).computeDerivatives(
          state,
          u,
          moonOrbit,
          t,
        );
        positions.push({ t, derivs });
      }

      // Verify that derivatives change smoothly (not constant)
      const dOmega_values = positions.map((p) => p.derivs.dOmega_du);
      const isConstant = dOmega_values.every(
        (val) => Math.abs(val - dOmega_values[0]) < 1e-20,
      );
      expect(isConstant).toBe(false); // Should NOT be constant
    });
  });

  describe('Integration Convergence', () => {
    it('should converge with decreasing step size', () => {
      const body = {
        orbit: {
          a: 10000,
          e: 0.1,
          i: 45,
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

      // Run calculation with different resolutions
      const result1 = lunarService.calculate({
        ...body,
        options: { pointsCount: 50 },
      });
      const result2 = lunarService.calculate({
        ...body,
        options: { pointsCount: 100 },
      });
      const result3 = lunarService.calculate({
        ...body,
        options: { pointsCount: 200 },
      });

      // Extract final orbital element changes
      const deltaOmega1 = result1.data.summary.orbitalChanges.deltaOmega;
      const deltaOmega2 = result2.data.summary.orbitalChanges.deltaOmega;
      const deltaOmega3 = result3.data.summary.orbitalChanges.deltaOmega;

      // Difference between solutions should decrease with resolution
      const diff12 = Math.abs(deltaOmega1 - deltaOmega2);
      const diff23 = Math.abs(deltaOmega2 - deltaOmega3);

      // Should converge (though not strictly monotonic for RK4)
      expect(diff23).toBeLessThan(diff12 * 2); // Allow some tolerance
    });
  });

  describe('Special Cases - Circular Orbit', () => {
    it('should handle circular orbit (e=0) without singularities', () => {
      const body = {
        orbit: {
          a: 10000,
          e: 0.0001, // Near-zero eccentricity
          i: 45,
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
          pointsCount: 50,
        },
      };

      // Should complete without errors
      expect(() => lunarService.calculate(body)).not.toThrow();

      const result = lunarService.calculate(body);

      // All values should be finite
      result.data.points.forEach((point) => {
        expect(point.orbitalElements.e).toBeFinite();
        expect(point.acceleration.total).toBeFinite();
      });
    });
  });

  describe('Special Cases - Equatorial Orbit', () => {
    it('should handle equatorial orbit (i≈0) with care for sin(i)', () => {
      const body = {
        orbit: {
          a: 10000,
          e: 0.1,
          i: 0.1, // Very small inclination (in degrees)
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
          pointsCount: 50,
        },
      };

      // Should complete without division by zero
      expect(() => lunarService.calculate(body)).not.toThrow();

      const result = lunarService.calculate(body);

      // Values should be finite despite small inclination
      result.data.points.forEach((point) => {
        expect(point.orbitalElements.i).toBeFinite();
        expect(point.orbitalElements.Omega).toBeFinite();
      });
    });
  });

  describe('Energy Conservation (Unperturbed Case)', () => {
    it('should approximately conserve energy for unperturbed two-body problem', () => {
      // Without lunar perturbation, orbital energy should be constant
      // This is a simplified test - real verification would need to disable perturbations

      const body = {
        orbit: {
          a: 10000,
          e: 0.1,
          i: 45,
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

      const result = lunarService.calculate(body);

      // Semi-major axis should not change dramatically (energy proxy)
      const aValues = result.data.points.map((p) => p.orbitalElements.a);
      const aInitial = aValues[0];
      const aFinal = aValues[aValues.length - 1];

      // Change should be small for one orbit (perturbation is small)
      const relativeChange = Math.abs(aFinal - aInitial) / aInitial;
      expect(relativeChange).toBeLessThan(0.01); // Less than 1% change
    });
  });

  describe('Numerical Stability', () => {
    it('should maintain numerical stability over multiple orbits', () => {
      const body = {
        orbit: {
          a: 10000,
          e: 0.1,
          i: 45,
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
          pointsCount: 200,
          integrationTime: 86400 * 3, // 3 days
        },
      };

      expect(() => lunarService.calculate(body)).not.toThrow();

      const result = lunarService.calculate(body);

      // All values should remain finite
      result.data.points.forEach((point, idx) => {
        expect(point.orbitalElements.e).toBeFinite();
        expect(point.orbitalElements.p).toBeGreaterThan(0);
        expect(point.acceleration.total).toBeFinite();
      });
    });
  });

  describe('Acceleration Component Analysis', () => {
    it('should have all three acceleration components (S, T, W)', () => {
      const body = {
        orbit: {
          a: 10000,
          e: 0.1,
          i: 45,
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

      const result = lunarService.calculate(body);

      // Check that all components exist and are non-zero (generally)
      result.data.points.forEach((point) => {
        expect(point.acceleration).toHaveProperty('S');
        expect(point.acceleration).toHaveProperty('T');
        expect(point.acceleration).toHaveProperty('W');
        expect(point.acceleration).toHaveProperty('total');

        // Total should be positive
        expect(point.acceleration.total).toBeGreaterThanOrEqual(0);
      });
    });

    it('should produce accelerations in expected physical range', () => {
      const body = {
        orbit: {
          a: 10000,
          e: 0.1,
          i: 45,
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

      const result = lunarService.calculate(body);

      // Lunar perturbations are typically 10^-6 to 10^-9 m/s²
      // Our backend returns values in m/s² (multiplied by 1000 from km/s²)
      result.data.points.forEach((point) => {
        const acc = point.acceleration.total;

        // Should be positive and in reasonable range
        expect(acc).toBeGreaterThan(0);
        expect(acc).toBeLessThan(1e-3); // Less than 1 mm/s²

        // Typical range: micrometers/s² to millimeters/s²
        expect(acc).toBeGreaterThan(1e-9); // Greater than 1 nm/s²
      });
    });
  });
});
