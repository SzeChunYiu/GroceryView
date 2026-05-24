import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadApiConfig } from './config.js';
import { createRequestLoggingMiddleware, type RequestLoggingConfig } from './middleware/logger.js';

export type ConfigureAppOptions = {
  requestLogging?: RequestLoggingConfig;
};

export function configureApp(app: INestApplication, options: ConfigureAppOptions = {}) {
  const config = loadApiConfig();
  app.use(createRequestLoggingMiddleware(options.requestLogging ?? config.requestLogging));
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  const docsConfig = new DocumentBuilder()
    .setTitle('GroceryView API')
    .setDescription('HTTP API for GroceryView products, stores, prices, users, watchlists, baskets, and alerts.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, docsConfig));
}
