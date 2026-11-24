import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtPlatformStrategy } from './strategies/jwt-platform.strategy';
import { PlatformRoleGuard } from '@/common/guards/platform-role.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-platform' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtPlatformStrategy, PlatformRoleGuard],
  exports: [AuthService, JwtPlatformStrategy, PlatformRoleGuard],
})
export class AuthModule {}
