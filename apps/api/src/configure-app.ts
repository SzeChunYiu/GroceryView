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
  const allowedOrigins = new Set(config.cors.allowedOrigins);
  app.enableCors({
    allowedHeaders: ['authorization', 'content-type', 'accept', 'x-groceryview-locale'],
    credentials: config.cors.credentials,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.has(origin));
    }
  });
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
