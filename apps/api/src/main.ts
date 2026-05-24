import 'reflect-metadata';
import { createApp } from './app.js';

async function bootstrap() {
  const app = await createApp();
  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();
