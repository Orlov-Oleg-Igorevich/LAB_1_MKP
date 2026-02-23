import { Injectable } from '@nestjs/common';
import { PHYSICS_CONSTANTS, Vector3, deg2rad, hypot3 } from '@lab/shared';

export interface KeplerState {
  M: number;
  E: number;
  theta: number;
  u: number;
  r: number;
}

@Injectable()
export class CoordinatesService {
  /**
   * (6) Coordinates in inertial equatorial frame (АГЭСК in the handout).
   */
  positionECIFromElements(params: {
    r: number;
    u: number;
    iRad: number;
    OmegaRad: number;
  }): Vector3 {
    const { r, u, iRad, OmegaRad } = params;
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const cO = Math.cos(OmegaRad);
    const sO = Math.sin(OmegaRad);
    const ci = Math.cos(iRad);
    const si = Math.sin(iRad);

    const x = r * (cu * cO - su * sO * ci);
    const y = r * (cu * sO + su * cO * ci);
    const z = r * (su * si);
    return { x, y, z };
  }

  /**
   * (7) Convert ECI (АГЭСК) to ECEF (ГСК) via rotation about Z by S(t).
   * The handout defines S(t) via sidereal time; here we use S(t)=omegaE*tSeconds.
   */
  eciToEcef(rEci: Vector3, tSeconds: number): Vector3 {
    const S = PHYSICS_CONSTANTS.omegaE * tSeconds;
    const c = Math.cos(S);
    const s = Math.sin(S);
    const x = c * rEci.x + s * rEci.y;
    const y = -s * rEci.x + c * rEci.y;
    const z = rEci.z;
    return { x, y, z };
  }

  toSpherical(r: Vector3): { r: number; phi: number; lambda: number } {
    const rr = hypot3(r.x, r.y, r.z);
    const phi = Math.asin(r.z / rr);
    const lambda = Math.atan2(r.y, r.x);
    return { r: rr, phi, lambda };
  }

  elementsToRadians(el: {
    i: number;
    Omega: number;
    omega: number;
    M: number;
  }) {
    return {
      iRad: deg2rad(el.i),
      OmegaRad: deg2rad(el.Omega),
      omegaRad: deg2rad(el.omega),
      MRadi: deg2rad(el.M),
    };
  }
}
