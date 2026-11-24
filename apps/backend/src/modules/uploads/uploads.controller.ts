import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { CloudinaryService } from './cloudinary.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('Media & File Uploads (Cloudinary)')
@ApiBearerAuth()
@UseGuards(JwtPlatformGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload an image file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'general',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file format '${file.mimetype}'. Only JPEG, PNG, WEBP, SVG, and GIF are allowed.`,
      );
    }

    const result = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      folder,
      file.originalname,
    );

    return {
      success: true,
      url: result.secure_url || result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  @Post('base64')
  @ApiOperation({ summary: 'Upload a base64 data URI to Cloudinary' })
  async uploadBase64(
    @Body('dataUri') dataUri: string,
    @Query('folder') folder: string = 'general',
  ) {
    if (!dataUri || !dataUri.startsWith('data:image/')) {
      throw new BadRequestException('Invalid image data URI');
    }

    const result = await this.cloudinaryService.uploadBase64(dataUri, folder);

    return {
      success: true,
      url: result.secure_url || result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Test Cloudinary connection & credentials' })
  async testConnection(@Body() body: any) {
    return this.cloudinaryService.testConnection(body);
  }
}
