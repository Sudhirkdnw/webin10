import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS strictly configured via environment variables (.env)
  const configuredCorsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = new Set<string>([
    ...configuredCorsOrigins,
    ...(process.env.SUPER_ADMIN_URL ? [process.env.SUPER_ADMIN_URL.trim()] : []),
    ...(process.env.BUSINESS_ADMIN_URL ? [process.env.BUSINESS_ADMIN_URL.trim()] : []),
    ...(process.env.APP_URL ? [process.env.APP_URL.trim()] : []),
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, or server-to-server)
      if (!origin) return callback(null, true);

      // If '*' is configured in CORS_ORIGINS, allow all
      if (allowedOrigins.has('*') || process.env.CORS_ORIGINS === '*') {
        return callback(null, true);
      }

      // Allow localhost in non-production environments
      if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      // Check against configured allowed origins and root domains
      const isAllowed = Array.from(allowedOrigins).some((allowed) => {
        if (!allowed) return false;
        if (origin === allowed) return true;

        const cleanAllowed = allowed.replace(/^https?:\/\//, '').replace(/^\*\./, '');
        try {
          const originHost = new URL(origin).hostname;
          return originHost === cleanAllowed || originHost.endsWith(`.${cleanAllowed}`);
        } catch {
          return origin.includes(cleanAllowed);
        }
      });

      if (isAllowed) {
        return callback(null, true);
      }

      logger.warn(`Blocked by CORS: ${origin}. Set CORS_ORIGINS in .env to allow it.`);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
  });

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Webin10 Platform API')
    .setDescription('Multi-Tenant SaaS Business Operating System Core APIs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Webin10 Backend API running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger OpenAPI Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
