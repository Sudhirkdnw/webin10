import { Module } from '@nestjs/common';
import { PlatformModulesService } from './platform-modules.service';
import { PlatformModulesController } from './platform-modules.controller';

@Module({
  controllers: [PlatformModulesController],
  providers: [PlatformModulesService],
  exports: [PlatformModulesService],
})
export class PlatformModulesModule {}
