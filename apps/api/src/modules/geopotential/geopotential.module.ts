import { Module } from '@nestjs/common';
import { GeopotentialController } from './geopotential.controller';
import { GeopotentialService } from './services/geopotential.service';
import { CalculationMathModule } from '../calculation/calculation-math.module';

@Module({
  imports: [CalculationMathModule],
  controllers: [GeopotentialController],
  providers: [GeopotentialService],
  exports: [GeopotentialService],
})
export class GeopotentialModule {}
