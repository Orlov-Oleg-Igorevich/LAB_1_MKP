import { Module } from '@nestjs/common';
import { LunarController } from './lunar.controller';
import { LunarService } from './services/lunar.service';
import { LunarAnalysisService } from './services/lunar-analysis.service';
import { CalculationMathModule } from '../calculation/calculation-math.module';

@Module({
  imports: [CalculationMathModule],
  controllers: [LunarController],
  providers: [LunarService, LunarAnalysisService],
  exports: [LunarService, LunarAnalysisService],
})
export class LunarModule {}
