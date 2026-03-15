import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { GeopotentialPresetsService } from './services/geopotential-presets.service';

@ApiTags('geopotential-presets')
@Controller('geopotential/presets')
export class GeopotentialPresetsController {
  constructor(private readonly presets: GeopotentialPresetsService) {}

  @Get()
  @ApiOkResponse({
    description:
      'Список предустановленных орбит для геопотенциальных возмущений (варианты 1–27)',
  })
  list() {
    return this.presets.list();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Одна предустановленная орбита по id' })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.presets.get(id);
  }
}
