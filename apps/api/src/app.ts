import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getRateLimitConfig } from './config.js';
import { createRateLimitMiddleware } from './middleware/rateLimit.js';

export function configureApp(app: INestApplication) {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  const rateLimitConfig = getRateLimitConfig();
  if (rateLimitConfig.enabled) {
    app.use(createRateLimitMiddleware(rateLimitConfig));
  }

  const config = new DocumentBuilder()
    .setTitle('GroceryView API')
    .setDescription(
      'HTTP API for GroceryView products, stores, prices, users, watchlists, baskets, and alerts.'
    )
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));
}
