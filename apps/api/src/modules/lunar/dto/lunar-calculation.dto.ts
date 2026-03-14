import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrbitalElementsDto } from '../../calculation/dto/calculation.dto';

export class MoonOrbitDto {
  @ApiProperty({ example: 5.145, description: 'Наклонение орбиты Луны, deg' })
  @IsNumber()
  i: number;

  @ApiProperty({ example: 0.0549, description: 'Эксцентриситет орбиты Луны' })
  @IsNumber()
  @Min(0)
  @Max(1)
  e: number;

  @ApiProperty({
    example: 384399,
    description: 'Большая полуось орбиты Луны, km',
  })
  @IsNumber()
  @Min(1)
  a: number;

  @ApiProperty({
    example: 30,
    description: 'Долгота восходящего узла Луны, deg',
  })
  @IsNumber()
  Omega: number;

  @ApiProperty({ example: 5, description: 'Аргумент широты Луны, deg' })
  @IsNumber()
  u: number;
}

export class LunarCalculationOptionsDto {
  @ApiProperty({ required: false, default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(5000)
  pointsCount?: number;

  @ApiProperty({
    required: false,
    default: 60,
    description: 'Шаг интегрирования, с',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  stepSize?: number;

  @ApiProperty({
    required: false,
    default: 0,
    description: 'Время интегрирования, с (0 = период)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  integrationTime?: number;
}

export class LunarCalculationRequestDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => OrbitalElementsDto)
  orbit: OrbitalElementsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => MoonOrbitDto)
  moon: MoonOrbitDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LunarCalculationOptionsDto)
  options?: LunarCalculationOptionsDto;
}
