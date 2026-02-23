import { Injectable } from '@nestjs/common';
import { GEOPOTENTIAL_CONSTANTS, PHYSICS_CONSTANTS } from '@lab/shared';
import { LegendreService } from './legendre.service';

export interface HarmonicOptions {
  maxN: number;
  maxK: number;
  j2Only?: boolean;
}

@Injectable()
export class GeopotentialService {
  constructor(private readonly legendre: LegendreService) {}

  /**
   * Compute perturbing acceleration components (jr, jphi, jlambda) in spherical coordinates,
   * following formula (11) of the lab handout for the disturbing potential U_voz m.
   *
   * Returns in km/s^2 (convert to m/s^2 outside if needed).
   */
  accelerationSphericalKm(params: {
    rKm: number;
    phiRad: number;
    lambdaRad: number;
    options: HarmonicOptions;
  }): {
    jr: number;
    jphi: number;
    jlambda: number;
    usedHarmonics: { n: number; k: number }[];
  } {
    const { rKm, phiRad, lambdaRad, options } = params;
    const q = Math.sin(phiRad); // q = sin(phi)
    const cphi = Math.cos(phiRad);

    const mu = PHYSICS_CONSTANTS.mu;
    const r0 = PHYSICS_CONSTANTS.r0;

    const maxN = Math.min(Math.max(2, options.maxN), 21);
    const maxK = Math.min(Math.max(0, options.maxK), maxN);

    let jr = 0;
    let jphi = 0;
    let jlambda = 0;

    const usedHarmonics: { n: number; k: number }[] = [];

    const base = mu / (r0 * r0);

    for (let n = 2; n <= maxN; n++) {
      const rn = Math.pow(r0 / rKm, n + 2);

      const Jn = (GEOPOTENTIAL_CONSTANTS.J as Record<number, number>)[n] ?? 0;
      if (!options.j2Only || n === 2) {
        if (Jn !== 0) {
          const Pn = this.legendre.Plm(n, 0, q);
          const dPn_dq = this.legendre.dPlm_dx(n, 0, q); // d/d(sin phi)

          jr += (n + 1) * Jn * rn * Pn;
          jphi += Jn * rn * dPn_dq;
          usedHarmonics.push({ n, k: 0 });
        }
      }

      if (options.j2Only) continue;

      for (let k = 1; k <= Math.min(maxK, n); k++) {
        const key = `${n},${k}`;
        const Cnk =
          (GEOPOTENTIAL_CONSTANTS.C as Record<string, number>)[key] ?? 0;
        const Snk =
          (GEOPOTENTIAL_CONSTANTS.S as Record<string, number>)[key] ?? 0;
        if (Cnk === 0 && Snk === 0) continue;

        const cosk = Math.cos(k * lambdaRad);
        const sink = Math.sin(k * lambdaRad);
        const A = Cnk * cosk + Snk * sink;
        const B = -Cnk * sink + Snk * cosk;

        const Pnk = this.legendre.Plm(n, k, q);
        const dPnk_dq = this.legendre.dPlm_dx(n, k, q);

        jr -= (n + 1) * rn * Pnk * A;
        jphi -= rn * dPnk_dq * A;
        // The handout formula (11) for j_lambda is written without an explicit k multiplier.
        // We follow the handout text.
        jlambda += k * rn * Pnk * B;
        usedHarmonics.push({ n, k });
      }
    }

    // Apply common multipliers (see formula (11))
    jr = base * jr;
    jphi = base * cphi * jphi;
    const safeCphi =
      Math.abs(cphi) < 1e-12 ? (cphi >= 0 ? 1e-12 : -1e-12) : cphi;
    jlambda = -base * (1 / safeCphi) * jlambda;

    return { jr, jphi, jlambda, usedHarmonics };
  }
}
