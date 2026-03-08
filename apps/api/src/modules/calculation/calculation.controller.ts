import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CalculationRequestDto } from './dto/calculation.dto';
import { CalculationService } from './services/calculation.service';

@ApiTags('calculation')
@Controller()
export class CalculationController {
  constructor(private readonly calculation: CalculationService) {}

  @Post('calculate')
  @ApiOkResponse({ description: 'Вычислить возмущающее ускорение на орбите' })
  calculate(@Body() body: CalculationRequestDto) {
    return this.calculation.calculate(body);
  }

  @Post('compare')
  @ApiOkResponse({
    description:
      'Сравните модель только с J2 и полную модель (то же самое, что и при вызове calculate с параметром includeJ2Only=true)',
  })
  compare(@Body() body: CalculationRequestDto) {
    return this.calculation.calculate({
      ...body,
      options: { ...body.options, includeJ2Only: true },
    });
  }
}
