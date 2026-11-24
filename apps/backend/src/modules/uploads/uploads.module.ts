import { Module, Global } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UploadsController } from './uploads.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [UploadsController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadsModule {}
