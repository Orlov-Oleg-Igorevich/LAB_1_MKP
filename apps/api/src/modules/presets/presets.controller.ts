import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { PresetsService } from './presets.service';

@ApiTags('presets')
@Controller('presets')
export class PresetsController {
  constructor(private readonly presets: PresetsService) {}

  @Get()
  @ApiOkResponse({
    description: 'Список предустановленных орбит (варианты 1–27)',
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
