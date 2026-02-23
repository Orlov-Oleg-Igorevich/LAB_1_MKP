import { Module } from '@nestjs/common';
import { CalculationModule } from './modules/calculation/calculation.module';
import { PresetsModule } from './modules/presets/presets.module';
import { ConstantsModule } from './modules/constants/constants.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [CalculationModule, PresetsModule, ConstantsModule, ExportModule],
})
export class AppModule {}
