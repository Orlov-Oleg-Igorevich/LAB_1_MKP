import { Module } from '@nestjs/common';
import { GeopotentialController } from './geopotential.controller';
import { GeopotentialPresetsController } from './geopotential-presets.controller';
import { GeopotentialService } from './services/geopotential.service';
import { GeopotentialPresetsService } from './services/geopotential-presets.service';
import { CalculationMathModule } from '../calculation/calculation-math.module';

@Module({
  imports: [CalculationMathModule],
  controllers: [GeopotentialController, GeopotentialPresetsController],
  providers: [GeopotentialService, GeopotentialPresetsService],
  exports: [GeopotentialService],
})
export class GeopotentialModule {}
