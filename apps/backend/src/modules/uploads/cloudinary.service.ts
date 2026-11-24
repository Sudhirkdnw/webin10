import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Readable } from 'stream';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folderPrefix?: string;
  secure?: boolean;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve active Cloudinary credentials from DB settings or environment variables
   */
  async getConfig(): Promise<CloudinaryConfig> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'cloudinary_settings' },
    });

    const dbConfig = setting?.value as any;

    const cloudName = dbConfig?.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '';
    const apiKey = dbConfig?.apiKey || process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = dbConfig?.apiSecret || process.env.CLOUDINARY_API_SECRET || '';
    const folderPrefix = dbConfig?.folderPrefix || 'webin10';

    return {
      cloudName,
      apiKey,
      apiSecret,
      folderPrefix,
      secure: true,
    };
  }

  /**
   * Configure Cloudinary instance dynamically
   */
  async configure() {
    const config = await this.getConfig();

    if (!config.cloudName || !config.apiKey || !config.apiSecret) {
      this.logger.warn('Cloudinary credentials are not fully configured in settings or environment.');
    }

    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });

    return config;
  }

  /**
   * Test Cloudinary credentials connection
   */
  async testConnection(customConfig?: Partial<CloudinaryConfig>) {
    try {
      const config = customConfig && customConfig.cloudName
        ? customConfig
        : await this.getConfig();

      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        secure: true,
      });

      const res = await cloudinary.api.ping();
      return {
        success: true,
        message: 'Cloudinary credentials verified successfully! Cloud status: ' + res.status,
        cloudName: config.cloudName,
      };
    } catch (error: any) {
      this.logger.error(`Cloudinary Ping Failed: ${error.message}`);
      return {
        success: false,
        message: error.message || 'Failed to authenticate with Cloudinary',
      };
    }
  }

  /**
   * Upload buffer directly to Cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    folderName: string = 'general',
    filename?: string,
  ): Promise<UploadApiResponse> {
    const config = await this.configure();

    if (!config.cloudName || !config.apiKey || !config.apiSecret) {
      throw new BadRequestException(
        'Cloudinary credentials are not configured. Please set them in Super Admin Settings > Media or environment variables.',
      );
    }

    const folder = `${config.folderPrefix || 'webin10'}/${folderName}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary Upload Error: ${error.message}`);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary returned empty upload response'));
          }
          resolve(result);
        },
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Upload base64 data URI directly to Cloudinary
   */
  async uploadBase64(
    dataUri: string,
    folderName: string = 'general',
  ): Promise<UploadApiResponse> {
    const config = await this.configure();

    if (!config.cloudName || !config.apiKey || !config.apiSecret) {
      throw new BadRequestException(
        'Cloudinary credentials are not configured. Please set them in Super Admin Settings > Media or environment variables.',
      );
    }

    const folder = `${config.folderPrefix || 'webin10'}/${folderName}`;

    return cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'auto',
    });
  }

  /**
   * Delete asset by public ID
   */
  async deleteImage(publicId: string) {
    await this.configure();
    return cloudinary.uploader.destroy(publicId);
  }
}
