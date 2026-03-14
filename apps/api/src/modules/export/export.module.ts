import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { CalculationModule } from '../calculation/calculation.module';
import { LunarModule } from '../lunar/lunar.module';

@Module({
  imports: [CalculationModule, LunarModule],
  controllers: [ExportController],
})
export class ExportModule {}
