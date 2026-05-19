import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

export async function createApiApp() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const config = new DocumentBuilder()
    .setTitle('GroceryView API')
    .setDescription('REST API for grocery products, stores, prices, users, watchlists, baskets, and alerts.')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  return app;
}

async function bootstrap() {
  const app = await createApiApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

if (require.main === module) {
  void bootstrap();
}
