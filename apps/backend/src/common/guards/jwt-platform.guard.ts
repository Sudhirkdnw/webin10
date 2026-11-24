import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtPlatformGuard extends AuthGuard('jwt-platform') {}
