import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GEOPOTENTIAL_CONSTANTS, PHYSICS_CONSTANTS } from '@lab/shared';

@ApiTags('constants')
@Controller('constants')
export class ConstantsController {
  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        mu: { type: 'number' },
        r0: { type: 'number' },
        omegaE: { type: 'number' },
        epsilon: { type: 'number' },
        J: { type: 'object' },
        C: { type: 'object' },
        S: { type: 'object' },
      },
    },
  })
  getConstants() {
    return {
      ...PHYSICS_CONSTANTS,
      ...GEOPOTENTIAL_CONSTANTS,
    };
  }
}

