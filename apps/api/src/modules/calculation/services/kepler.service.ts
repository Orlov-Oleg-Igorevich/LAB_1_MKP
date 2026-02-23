import { Injectable } from '@nestjs/common';
import { PHYSICS_CONSTANTS } from '@lab/shared';

@Injectable()
export class KeplerService {
  /**
   * Solve Kepler equation E = M + e sin(E) by fixed-point iteration
   * as specified in the lab handout.
   */
  solveEccentricAnomaly(M: number, e: number, epsilon = PHYSICS_CONSTANTS.epsilon): number {
    let Ei = M;
    for (let iter = 0; iter < 1000; iter++) {
      const Ei1 = M + e * Math.sin(Ei);
      if (Math.abs(Ei1 - Ei) <= epsilon) return Ei1;
      Ei = Ei1;
    }
    return Ei;
  }
}

