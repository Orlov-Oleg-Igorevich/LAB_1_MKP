import { Module } from '@nestjs/common';
import { GeopotentialModule } from './modules/geopotential/geopotential.module';
import { LunarModule } from './modules/lunar/lunar.module';
import { PresetsModule } from './modules/presets/presets.module';
import { ConstantsModule } from './modules/constants/constants.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    GeopotentialModule,
    LunarModule,
    PresetsModule,
    ConstantsModule,
    ExportModule,
  ],
})
export class AppModule {}
