import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerMiddleware } from './middleware/logger.js';

export function configureApp(app: INestApplication) {
  app.enableCors();
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
