import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { setupOpenApi } from './openapi.js';

export function configureApp(app: INestApplication) {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  setupOpenApi(app);
}
