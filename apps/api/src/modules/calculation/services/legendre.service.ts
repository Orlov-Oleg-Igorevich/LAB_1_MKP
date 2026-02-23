import { Injectable } from '@nestjs/common';

function doubleFactorial(n: number): number {
  if (n <= 0) return 1;
  let res = 1;
  for (let k = n; k >= 1; k -= 2) res *= k;
  return res;
}

@Injectable()
export class LegendreService {
  /**
   * Unnormalized associated Legendre P_l^m(x) for 0<=m<=l using standard recurrence.
   * x = sin(phi) in the lab handout.
   */
  Plm(l: number, m: number, x: number): number {
    if (m < 0 || m > l) return 0;

    // P_m^m(x) = (-1)^m (2m-1)!! (1-x^2)^{m/2}
    const oneMinus = Math.max(0, 1 - x * x);
    const Pmm = Math.pow(oneMinus, m / 2) * doubleFactorial(2 * m - 1);

    if (l === m) return Pmm;

    // P_{m+1}^m(x) = x(2m+1) P_m^m(x)
    const Pmmp1 = x * (2 * m + 1) * Pmm;
    if (l === m + 1) return Pmmp1;

    let Plm2 = Pmm;
    let Plm1 = Pmmp1;
    for (let ll = m + 2; ll <= l; ll++) {
      const Pll = ((2 * ll - 1) * x * Plm1 - (ll + m - 1) * Plm2) / (ll - m);
      Plm2 = Plm1;
      Plm1 = Pll;
    }
    return Plm1;
  }

  /**
   * d/dx P_l^m(x). Uses identity:
   * dP_l^m/dx = (1/(x^2-1)) * (l x P_l^m(x) - (l+m) P_{l-1}^m(x))
   */
  dPlm_dx(l: number, m: number, x: number): number {
    const denom = x * x - 1;
    const safeDenom =
      Math.abs(denom) < 1e-12 ? (denom >= 0 ? 1e-12 : -1e-12) : denom;
    const Plm = this.Plm(l, m, x);
    const Plm1 = l - 1 >= m ? this.Plm(l - 1, m, x) : 0;
    return (l * x * Plm - (l + m) * Plm1) / safeDenom;
  }
}
