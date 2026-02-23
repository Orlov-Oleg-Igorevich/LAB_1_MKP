"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CalculationOptionsSchema: () => CalculationOptionsSchema,
  CalculationRequestSchema: () => CalculationRequestSchema,
  GEOPOTENTIAL_CONSTANTS: () => GEOPOTENTIAL_CONSTANTS,
  OrbitalElementsSchema: () => OrbitalElementsSchema,
  PHYSICS_CONSTANTS: () => PHYSICS_CONSTANTS,
  clamp: () => clamp,
  deg2rad: () => deg2rad,
  hypot3: () => hypot3,
  rad2deg: () => rad2deg
});
module.exports = __toCommonJS(index_exports);

// src/constants/geopotential.ts
var GEOPOTENTIAL_CONSTANTS = {
  J: {
    2: 1082628e-9,
    3: -2538e-9,
    4: -1593e-9,
    5: -23e-8,
    6: 502e-9,
    7: -361e-9,
    8: -118e-9,
    9: -1e-7,
    10: -354e-9,
    11: 202e-9,
    12: -42e-9,
    13: -123e-9,
    14: -73e-9,
    15: -174e-9,
    16: 187e-9,
    17: 85e-9,
    18: -231e-9,
    19: -216e-9,
    20: -5e-9,
    21: 145e-9
  },
  C: {
    "2,1": 0,
    "2,2": 24129e-10,
    "3,1": 19698e-10,
    "3,2": 89204e-11,
    "3,3": 6863e-10,
    "4,1": -52989e-11,
    "4,2": 33024e-11,
    "4,3": 98943e-11,
    "4,4": -79692e-12,
    "5,1": -53816e-12,
    "5,2": 61286e-11,
    "5,3": -43083e-11,
    "5,4": -26693e-11,
    "5,5": 12593e-11,
    "6,1": -98984e-12,
    "6,2": 54825e-12,
    "6,3": 27873e-12,
    "6,4": -40342e-14,
    "6,5": -21143e-11,
    "6,6": 88693e-12,
    "7,1": 24142e-11
  },
  S: {
    "2,1": 0,
    "2,2": -13641e-10,
    "3,1": 26015e-11,
    "3,2": -63468e-11,
    "3,3": 14304e-10,
    "4,1": -48765e-11,
    "4,2": 70633e-11,
    "4,3": -15467e-11,
    "4,4": 33928e-11,
    "5,1": -97905e-12,
    "5,2": -35087e-11,
    "5,3": -86663e-12,
    "5,4": 8301e-11,
    "5,5": -5991e-10,
    "6,1": 37652e-12,
    "6,2": -35175e-11,
    "6,3": 44626e-12,
    "6,4": -40388e-11,
    "6,5": -52264e-11,
    "6,6": -74756e-12,
    "7,1": 11567e-11
  }
};

// src/constants/physics.ts
var PHYSICS_CONSTANTS = {
  /** km^3 / s^2 */
  mu: 398600.4418,
  /** km (equatorial radius) */
  r0: 6378.137,
  /** rad/s */
  omegaE: 7292115e-11,
  /** rad (0.001 deg) */
  epsilon: 1e-3 * Math.PI / 180
};

// src/utils/math.utils.ts
function deg2rad(deg) {
  return deg * Math.PI / 180;
}
function rad2deg(rad) {
  return rad * 180 / Math.PI;
}
function clamp(x, min, max) {
  return Math.min(max, Math.max(min, x));
}
function hypot3(x, y, z2) {
  return Math.hypot(x, y, z2);
}

// src/utils/validation.utils.ts
var import_zod = require("zod");
var OrbitalElementsSchema = import_zod.z.object({
  a: import_zod.z.number().positive(),
  e: import_zod.z.number().min(0).max(0.999999),
  i: import_zod.z.number(),
  Omega: import_zod.z.number(),
  omega: import_zod.z.number(),
  M: import_zod.z.number()
});
var CalculationOptionsSchema = import_zod.z.object({
  pointsCount: import_zod.z.number().int().min(3).max(5e3).optional(),
  maxHarmonicN: import_zod.z.number().int().min(2).max(21).optional(),
  maxHarmonicK: import_zod.z.number().int().min(0).max(21).optional(),
  coordinateSystem: import_zod.z.enum(["ECI", "ECEF"]).optional(),
  includeJ2Only: import_zod.z.boolean().optional(),
  tSeconds: import_zod.z.number().min(0).max(86400 * 365 * 10).optional()
}).optional();
var CalculationRequestSchema = import_zod.z.object({
  orbit: OrbitalElementsSchema,
  options: CalculationOptionsSchema
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalculationOptionsSchema,
  CalculationRequestSchema,
  GEOPOTENTIAL_CONSTANTS,
  OrbitalElementsSchema,
  PHYSICS_CONSTANTS,
  clamp,
  deg2rad,
  hypot3,
  rad2deg
});
