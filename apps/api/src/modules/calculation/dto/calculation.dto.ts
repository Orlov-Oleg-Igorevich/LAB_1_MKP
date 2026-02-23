import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { CoordinateSystem } from '@lab/shared';

export class OrbitalElementsDto {
  @ApiProperty({ example: 10000, description: 'Semi-major axis, km' })
  @IsNumber()
  @Min(1)
  a!: number;

  @ApiProperty({ example: 0.1, description: 'Eccentricity' })
  @IsNumber()
  @Min(0)
  @Max(0.999999)
  e!: number;

  @ApiProperty({ example: 10, description: 'Inclination, deg' })
  @IsNumber()
  i!: number;

  @ApiProperty({ example: 5, description: 'RAAN Ω, deg', name: 'Omega' })
  @IsNumber()
  Omega!: number;

  @ApiProperty({ example: 0, description: 'Argument of perigee ω, deg', name: 'omega' })
  @IsNumber()
  omega!: number;

  @ApiProperty({ example: 0, description: 'Mean anomaly M, deg' })
  @IsNumber()
  M!: number;
}

export class CalculationOptionsDto {
  @ApiProperty({ required: false, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(5000)
  pointsCount?: number;

  @ApiProperty({ required: false, default: 4 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(21)
  maxHarmonicN?: number;

  @ApiProperty({ required: false, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(21)
  maxHarmonicK?: number;

  @ApiProperty({ required: false, default: 'ECEF', enum: ['ECI', 'ECEF'] })
  @IsOptional()
  @IsIn(['ECI', 'ECEF'])
  coordinateSystem?: CoordinateSystem;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  includeJ2Only?: boolean;

  @ApiProperty({
    required: false,
    default: 0,
    description: 'Seconds since t=0; used in S(t)=omegaE*t (simplified)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tSeconds?: number;
}

export class CalculationRequestDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => OrbitalElementsDto)
  orbit!: OrbitalElementsDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalculationOptionsDto)
  options?: CalculationOptionsDto;
}

