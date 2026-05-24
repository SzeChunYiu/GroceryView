import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { LatestPricesService } from './prices/latest-prices.service.js';
import { configurePriceStream } from './ws/priceStream.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  await app.init();

  const latestPricesService = app.get(LatestPricesService);
  configurePriceStream(app.getHttpServer(), latestPricesService);

  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();
