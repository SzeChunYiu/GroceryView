import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { PinoNestLogger } from './lib/logger.js';

export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    logger: new PinoNestLogger()
  });

  configureApp(app);

  return app;
}
