import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpStatus,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private readonly whatsAppService: WhatsAppService) {}

  /**
   * Meta Webhook Verification Endpoint (GET)
   * Meta sends hub.mode, hub.challenge, and hub.verify_token
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Meta WhatsApp Webhook Verification Challenge' })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    this.logger.log(`Received Meta webhook verification request: mode=${mode}, token=${verifyToken}`);

    const isValid = await this.whatsAppService.verifyWebhookToken(mode, verifyToken);

    if (isValid && challenge) {
      this.logger.log(`Webhook verified successfully. Returning challenge.`);
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn(`Webhook verification failed. Token mismatch or invalid mode.`);
    return res.status(HttpStatus.FORBIDDEN).send('Verification failed');
  }

  /**
   * Meta Webhook Event Receiver (POST)
   * Receives incoming messages, status updates (delivered, read, failed)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta WhatsApp Inbound Event Receiver' })
  async handleWebhookPayload(@Body() payload: any) {
    this.logger.log(`Received Meta WhatsApp webhook payload`);
    await this.whatsAppService.processIncomingEvent(payload);
    return { status: 'EVENT_RECEIVED' };
  }

  /**
   * Send Test WhatsApp Message
   */
  @Post('test-send')
  @ApiOperation({ summary: 'Send test message using configured WhatsApp credentials' })
  async testSendMessage(@Body() body: { recipientPhone: string; messageText?: string }) {
    return this.whatsAppService.sendTextMessage(
      body.recipientPhone,
      body.messageText || 'Hello from Webin10! Your WhatsApp Cloud API is successfully connected.',
    );
  }
}
