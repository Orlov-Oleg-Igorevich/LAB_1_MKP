import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LunarCalculationRequestDto } from './dto/lunar-calculation.dto';
import { LunarService } from './services/lunar.service';

@ApiTags('lunar')
@Controller('lunar')
export class LunarController {
  constructor(private readonly lunar: LunarService) {}

  @Post('calculate')
  @ApiOkResponse({
    description: 'Calculate lunar perturbations on satellite orbit',
  })
  calculate(@Body() body: LunarCalculationRequestDto) {
    return this.lunar.calculate(body);
  }
}
