import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PostgresQueryExecutorService } from './database/postgres-query-executor.service.js';
import { featureFlagsMiddleware } from './middleware/featureFlags.js';

export function configureApp(app: INestApplication) {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  const postgres = app.get(PostgresQueryExecutorService);
  app.use(featureFlagsMiddleware(postgres ?? null));

  const config = new DocumentBuilder()
    .setTitle('GroceryView API')
    .setDescription('HTTP API for GroceryView products, stores, prices, users, watchlists, baskets, and alerts.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));
}
