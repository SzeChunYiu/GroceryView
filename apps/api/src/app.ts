import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { ErrorHandler } from './middleware/errorHandler.js';
import { createApiDocument } from './openapi.js';

export function configureApiApp(app: INestApplication): void {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  app.useGlobalFilters(new ErrorHandler());

  const document = createApiDocument(app);
  SwaggerModule.setup('api', app, document);
}
