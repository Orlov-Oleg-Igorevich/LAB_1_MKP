import { Injectable, NotFoundException } from '@nestjs/common';
import { OrbitalElements } from '@lab/shared';

export interface Preset {
  id: number;
  orbit: OrbitalElements;
}

@Injectable()
export class PresetsService {
  private readonly presets: Preset[] = [
    { id: 1, orbit: { a: 10000, e: 0.1, i: 10, Omega: 5, omega: 0, M: 0 } },
    { id: 2, orbit: { a: 12000, e: 0.1, i: 20, Omega: 10, omega: 0, M: 15 } },
    { id: 3, orbit: { a: 15000, e: 0.2, i: 30, Omega: 15, omega: 0, M: 30 } },
    { id: 4, orbit: { a: 17500, e: 0.3, i: 45, Omega: 20, omega: 0, M: 45 } },
    { id: 5, orbit: { a: 20000, e: 0.4, i: 60, Omega: 25, omega: 0, M: 60 } },
    { id: 6, orbit: { a: 22000, e: 0.4, i: 32.4, Omega: 60, omega: 0, M: 0 } },
    { id: 7, orbit: { a: 25000, e: 0.5, i: 82.1, Omega: 60, omega: 0, M: 15 } },
    { id: 8, orbit: { a: 30000, e: 0.5, i: 81.2, Omega: 40, omega: 0, M: 30 } },
    { id: 9, orbit: { a: 10000, e: 0.6, i: 40.5, Omega: 40, omega: 0, M: 45 } },
    {
      id: 10,
      orbit: { a: 12000, e: 0.6, i: 74.3, Omega: 60, omega: 0, M: 60 },
    },
    { id: 11, orbit: { a: 15000, e: 0.7, i: 56.7, Omega: 40, omega: 0, M: 0 } },
    {
      id: 12,
      orbit: { a: 17500, e: 0.7, i: 82.1, Omega: 20, omega: 0, M: 15 },
    },
    {
      id: 13,
      orbit: { a: 20000, e: 0.8, i: 81.2, Omega: 40, omega: 0, M: 30 },
    },
    {
      id: 14,
      orbit: { a: 22000, e: 0.8, i: 40.5, Omega: 60, omega: 0, M: 45 },
    },
    {
      id: 15,
      orbit: { a: 25000, e: 0.9, i: 74.3, Omega: 20, omega: 0, M: 60 },
    },
    { id: 16, orbit: { a: 30000, e: 0.9, i: 20.8, Omega: 60, omega: 0, M: 0 } },
    {
      id: 17,
      orbit: { a: 10000, e: 0.1, i: 37.1, Omega: 40, omega: 0, M: 15 },
    },
    {
      id: 18,
      orbit: { a: 12000, e: 0.1, i: 77.6, Omega: 60, omega: 0, M: 30 },
    },
    {
      id: 19,
      orbit: { a: 15000, e: 0.2, i: 56.7, Omega: 60, omega: 0, M: 45 },
    },
    {
      id: 20,
      orbit: { a: 17500, e: 0.3, i: 58.0, Omega: 40, omega: 0, M: 60 },
    },
    { id: 21, orbit: { a: 20000, e: 0.4, i: 74.3, Omega: 20, omega: 0, M: 0 } },
    {
      id: 22,
      orbit: { a: 22000, e: 0.4, i: 20.8, Omega: 10, omega: 0, M: 15 },
    },
    {
      id: 23,
      orbit: { a: 25000, e: 0.5, i: 32.4, Omega: 40, omega: 0, M: 30 },
    },
    {
      id: 24,
      orbit: { a: 30000, e: 0.5, i: 58.0, Omega: 60, omega: 0, M: 45 },
    },
    {
      id: 25,
      orbit: { a: 10000, e: 0.6, i: 32.4, Omega: 50, omega: 0, M: 60 },
    },
    { id: 26, orbit: { a: 12000, e: 0.6, i: 58.0, Omega: 40, omega: 0, M: 0 } },
    {
      id: 27,
      orbit: { a: 15000, e: 0.7, i: 58.0, Omega: 40, omega: 0, M: 15 },
    },
  ];

  list(): Preset[] {
    return this.presets;
  }

  get(id: number): Preset {
    const found = this.presets.find((p) => p.id === id);
    if (!found) throw new NotFoundException(`Preset ${id} not found`);
    return found;
  }
}
