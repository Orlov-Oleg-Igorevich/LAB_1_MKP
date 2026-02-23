import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CalculationRequestDto } from './dto/calculation.dto';
import { CalculationService } from './services/calculation.service';

@ApiTags('calculation')
@Controller()
export class CalculationController {
  constructor(private readonly calculation: CalculationService) {}

  @Post('calculate')
  @ApiOkResponse({ description: 'Compute perturbing acceleration along orbit' })
  calculate(@Body() body: CalculationRequestDto) {
    return this.calculation.calculate(body);
  }

  @Post('compare')
  @ApiOkResponse({ description: 'Compare J2-only vs full model (same as calculate with includeJ2Only=true)' })
  compare(@Body() body: CalculationRequestDto) {
    return this.calculation.calculate({ ...body, options: { ...body.options, includeJ2Only: true } });
  }
}

