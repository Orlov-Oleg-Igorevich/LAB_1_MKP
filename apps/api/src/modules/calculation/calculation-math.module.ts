import { Module } from '@nestjs/common';
import { KeplerService } from './services/kepler.service';
import { CoordinatesService } from './services/coordinates.service';
import { LegendreService } from './services/legendre.service';
import { GeopotentialMathService } from './services/geopotential-math.service';

@Module({
  providers: [
    KeplerService,
    CoordinatesService,
    LegendreService,
    GeopotentialMathService,
  ],
  exports: [
    KeplerService,
    CoordinatesService,
    LegendreService,
    GeopotentialMathService,
  ],
})
export class CalculationMathModule {}
