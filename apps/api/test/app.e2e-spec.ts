import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'api' });
  });

  it('serves product placeholder routes', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect(
        ({ body }: { body: Array<{ slug: string; dataStatus: string }> }) => {
          expect(body[0]).toMatchObject({
            slug: 'zoegas-skane-450g',
            dataStatus: 'seed_demo',
          });
        },
      );

    await request(app.getHttpServer())
      .get('/products/zoegas-skane-450g')
      .expect(200)
      .expect(
        ({ body }: { body: { slug: string; confidenceScore: number } }) => {
          expect(body).toMatchObject({
            slug: 'zoegas-skane-450g',
            confidenceScore: 0.91,
          });
        },
      );
  });

  it('serves store placeholder routes', async () => {
    await request(app.getHttpServer())
      .get('/stores')
      .expect(200)
      .expect(({ body }: { body: Array<{ slug: string; city: string }> }) => {
        expect(body[0]).toMatchObject({
          slug: 'willys-odenplan',
          city: 'Stockholm',
        });
      });

    await request(app.getHttpServer())
      .get('/stores/willys-odenplan')
      .expect(200)
      .expect(
        ({ body }: { body: { slug: string; priceLevelIndex: number } }) => {
          expect(body).toMatchObject({
            slug: 'willys-odenplan',
            priceLevelIndex: 94,
          });
        },
      );
  });

  it('serves price placeholder routes', async () => {
    await request(app.getHttpServer())
      .get('/products/zoegas-skane-450g/prices')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: Array<{ productSlug: string; currency: string }>;
        }) => {
          expect(body[0]).toMatchObject({
            productSlug: 'zoegas-skane-450g',
            currency: 'SEK',
          });
        },
      );

    await request(app.getHttpServer())
      .get('/products/zoegas-skane-450g/series')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { instrument: { slug: string }; series: unknown[] };
        }) => {
          expect(body.instrument.slug).toBe('zoegas-skane-450g');
          expect(body.series.length).toBeGreaterThan(0);
        },
      );
  });

  it('serves user workflow placeholder routes', async () => {
    await request(app.getHttpServer())
      .get('/me/watchlist')
      .expect(200)
      .expect(({ body }: { body: Array<{ productSlug: string }> }) => {
        expect(body[0]).toMatchObject({ productSlug: 'zoegas-skane-450g' });
      });

    await request(app.getHttpServer())
      .post('/me/watchlist')
      .send({ productSlug: 'arla-mellanmjolk-1l' })
      .expect(201)
      .expect(({ body }: { body: { productSlug: string } }) => {
        expect(body.productSlug).toBe('arla-mellanmjolk-1l');
      });

    await request(app.getHttpServer())
      .get('/me/weekly-basket')
      .expect(200)
      .expect(({ body }: { body: { currency: string; items: unknown[] } }) => {
        expect(body.currency).toBe('SEK');
        expect(body.items.length).toBeGreaterThan(0);
      });

    await request(app.getHttpServer())
      .post('/me/weekly-basket/items')
      .send({ productSlug: 'zoegas-skane-450g', quantity: 2 })
      .expect(201)
      .expect(({ body }: { body: { quantity: number } }) => {
        expect(body.quantity).toBe(2);
      });

    await request(app.getHttpServer())
      .get('/me/alerts')
      .expect(200)
      .expect(
        ({ body }: { body: Array<{ type: string; enabled: boolean }> }) => {
          expect(body[0]).toMatchObject({
            type: 'target_price',
            enabled: true,
          });
        },
      );
  });

  afterEach(async () => {
    await app.close();
  });
});
