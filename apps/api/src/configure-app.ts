import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerMiddleware } from './middleware/logger.js';

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const configuredCorsOrigins = configService.get<string[]>('CORS_ALLOWED_ORIGINS');
  if (configuredCorsOrigins === undefined || configuredCorsOrigins.length === 0) {
    app.enableCors();
  } else {
    app.enableCors({ origin: configuredCorsOrigins });
  }

  const loggerMiddleware = new LoggerMiddleware();
  app.use(loggerMiddleware.use.bind(loggerMiddleware));
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  const config = new DocumentBuilder()
    .setTitle('GroceryView API')
    .setDescription('HTTP API for GroceryView products, stores, prices, users, watchlists, baskets, and alerts.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));
}
