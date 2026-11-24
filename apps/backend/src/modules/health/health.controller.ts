import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check platform API and service health status' })
  check() {
    return {
      status: 'ok',
      service: 'webin10-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
