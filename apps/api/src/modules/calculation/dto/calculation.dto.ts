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
  @ApiProperty({ example: 10000, description: 'Большая полуось, km' })
  @IsNumber()
  @Min(1)
  a: number;

  @ApiProperty({ example: 0.1, description: 'Эксцентриситет' })
  @IsNumber()
  @Min(0)
  @Max(0.999999)
  e: number;

  @ApiProperty({ example: 10, description: 'Наклонение, deg' })
  @IsNumber()
  i: number;

  @ApiProperty({
    example: 5,
    description: 'Долгота восходящего узла Ω, deg',
    name: 'Omega',
  })
  @IsNumber()
  Omega: number;

  @ApiProperty({
    example: 0,
    description: 'Аргумент перицентра ω, deg',
    name: 'omega',
  })
  @IsNumber()
  omega: number;

  @ApiProperty({ example: 0, description: 'Средняя аномалия M, deg' })
  @IsNumber()
  M: number;
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
    description:
      'Секунд с момента t=0; используется в S(t)=omegaE*t (упрощенно)',
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
  orbit: OrbitalElementsDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalculationOptionsDto)
  options?: CalculationOptionsDto;
}
