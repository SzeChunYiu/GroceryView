import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'api' });
  });

  it('serves product, store, price, watchlist, basket, and alert placeholders', async () => {
    await request(app.getHttpServer()).get('/products').expect(200);
    await request(app.getHttpServer())
      .get('/products/zoegas-skane-mellanrost-450g')
      .expect(200)
      .expect((response) => {
        expect(response.body.slug).toBe('zoegas-skane-mellanrost-450g');
      });
    await request(app.getHttpServer()).get('/stores').expect(200);
    await request(app.getHttpServer())
      .get('/stores/ica-nara-odenplan')
      .expect(200)
      .expect((response) => {
        expect(response.body.chain).toBe('ICA');
      });
    await request(app.getHttpServer())
      .get('/products/zoegas-skane-mellanrost-450g/prices')
      .expect(200)
      .expect((response) => {
        expect(response.body[0].sourceType).toBe('seed/demo');
      });
    await request(app.getHttpServer())
      .get('/products/zoegas-skane-mellanrost-450g/series')
      .expect(200);
    await request(app.getHttpServer()).get('/me/watchlist').expect(200);
    await request(app.getHttpServer())
      .post('/me/watchlist')
      .send({ productSlug: 'arla-mellanmjolk-1l', targetPriceAmount: 12 })
      .expect(201)
      .expect((response) => {
        expect(response.body.productSlug).toBe('arla-mellanmjolk-1l');
      });
    await request(app.getHttpServer()).get('/me/weekly-basket').expect(200);
    await request(app.getHttpServer())
      .post('/me/weekly-basket/items')
      .send({ productSlug: 'arla-mellanmjolk-1l', quantity: 2 })
      .expect(201)
      .expect((response) => {
        expect(response.body.quantity).toBe(2);
      });
    await request(app.getHttpServer()).get('/me/alerts').expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
