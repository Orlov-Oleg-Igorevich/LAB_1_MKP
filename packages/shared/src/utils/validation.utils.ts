import { z } from 'zod';

export const OrbitalElementsSchema = z.object({
  a: z.number().positive(),
  e: z.number().min(0).max(0.999999),
  i: z.number(),
  Omega: z.number(),
  omega: z.number(),
  M: z.number(),
});

export const CalculationOptionsSchema = z
  .object({
    pointsCount: z.number().int().min(3).max(5000).optional(),
    maxHarmonicN: z.number().int().min(2).max(21).optional(),
    maxHarmonicK: z.number().int().min(0).max(21).optional(),
    coordinateSystem: z.enum(['ECI', 'ECEF']).optional(),
    includeJ2Only: z.boolean().optional(),
    tSeconds: z.number().min(0).max(86400 * 365 * 10).optional(),
  })
  .optional();

export const CalculationRequestSchema = z.object({
  orbit: OrbitalElementsSchema,
  options: CalculationOptionsSchema,
});

