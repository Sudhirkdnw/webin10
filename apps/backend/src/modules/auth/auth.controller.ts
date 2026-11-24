import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SuperAdminLoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { JwtPlatformGuard } from '@/common/guards/jwt-platform.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@webin10/shared-types';

@ApiTags('Super Admin Auth')
@Controller('auth/super-admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super Admin credentials authentication' })
  async login(@Body() dto: SuperAdminLoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.loginSuperAdmin(dto, ip, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshPlatformToken(dto, ip, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtPlatformGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate active platform session' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto?: RefreshTokenDto,
  ) {
    return this.authService.logoutPlatform(user.id, dto?.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtPlatformGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated platform administrator profile' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getPlatformProfile(user.id);
  }
}
