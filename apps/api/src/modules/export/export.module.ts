import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { CalculationModule } from '../calculation/calculation.module';

@Module({
  imports: [CalculationModule],
  controllers: [ExportController],
})
export class ExportModule {}

