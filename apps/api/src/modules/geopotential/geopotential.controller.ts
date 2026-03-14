import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CalculationRequestDto } from './dto/calculation.dto';
import { GeopotentialService } from './services/geopotential.service';

@ApiTags('geopotential')
@Controller('geopotential')
export class GeopotentialController {
  constructor(private readonly geopotential: GeopotentialService) {}

  @Post('calculate')
  @ApiOkResponse({
    description: 'Calculate geopotential perturbation acceleration on orbit',
  })
  calculate(@Body() body: CalculationRequestDto) {
    return this.geopotential.calculate(body);
  }

  @Post('compare')
  @ApiOkResponse({
    description:
      'Compare J2-only model with full model (same as calling calculate with includeJ2Only=true)',
  })
  compare(@Body() body: CalculationRequestDto) {
    return this.geopotential.calculate({
      ...body,
      options: { ...body.options, includeJ2Only: true },
    });
  }
}
