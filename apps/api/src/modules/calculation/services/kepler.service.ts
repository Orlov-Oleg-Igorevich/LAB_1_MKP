import { Injectable } from '@nestjs/common';
import { PHYSICS_CONSTANTS } from '@lab/shared';

@Injectable()
export class KeplerService {
  /**
   * Решение уравнение Кеплера E = M + e sin(E) с помощью численного приближения.
   * По умолчанию стоит ограничение на 1000 итераций
   */
  solveEccentricAnomaly(
    M: number,
    e: number,
    epsilon = PHYSICS_CONSTANTS.epsilon,
  ): number {
    let Ei = M;
    for (let iter = 0; iter < 1000; iter++) {
      const Ei1 = M + e * Math.sin(Ei);
      if (Math.abs(Ei1 - Ei) <= epsilon) return Ei1;
      Ei = Ei1;
    }
    return Ei;
  }
}
