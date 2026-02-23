import { Module } from '@nestjs/common';
import { CalculationController } from './calculation.controller';
import { CalculationService } from './services/calculation.service';
import { KeplerService } from './services/kepler.service';
import { CoordinatesService } from './services/coordinates.service';
import { LegendreService } from './services/legendre.service';
import { GeopotentialService } from './services/geopotential.service';

@Module({
  controllers: [CalculationController],
  providers: [
    CalculationService,
    KeplerService,
    CoordinatesService,
    LegendreService,
    GeopotentialService,
  ],
  exports: [CalculationService],
})
export class CalculationModule {}

