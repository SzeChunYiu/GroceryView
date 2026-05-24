import { type INestApplication } from '@nestjs/common';
import { configureApiApp } from './app.js';

export function configureApp(app: INestApplication) {
  configureApiApp(app);
}
