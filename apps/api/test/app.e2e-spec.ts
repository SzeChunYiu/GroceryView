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

  it('serves typed seed/demo product, store, and price routes', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .expect(200)
      .expect(({ body }) => {
        const products = body as Array<Record<string, unknown>>;
        expect(products[0]).toMatchObject({
          slug: 'zoegas-skane-mellanrost-450g',
          currency: 'SEK',
          demo: true,
        });
      });

    await request(app.getHttpServer())
      .get('/products/zoegas-skane-mellanrost-450g')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          slug: 'zoegas-skane-mellanrost-450g',
          watchedByDemoUser: true,
          demo: true,
        });
      });

    await request(app.getHttpServer())
      .get('/stores')
      .expect(200)
      .expect(({ body }) => {
        const stores = body as Array<Record<string, unknown>>;
        expect(stores[0]).toMatchObject({
          slug: 'willys-odenplan',
          demo: true,
        });
      });

    await request(app.getHttpServer())
      .get('/stores/willys-odenplan')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          slug: 'willys-odenplan',
          featuredDealProductSlugs: ['zoegas-skane-mellanrost-450g'],
        });
      });

    await request(app.getHttpServer())
      .get('/products/zoegas-skane-mellanrost-450g/prices')
      .expect(200)
      .expect(({ body }) => {
        const prices = body as Array<Record<string, unknown>>;
        expect(prices[0]).toMatchObject({
          productSlug: 'zoegas-skane-mellanrost-450g',
          currency: 'SEK',
          demo: true,
        });
      });

    await request(app.getHttpServer())
      .get('/products/zoegas-skane-mellanrost-450g/series')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          productSlug: 'zoegas-skane-mellanrost-450g',
          range: '90d',
          demo: true,
        });
      });
  });

  it('serves seed/demo user routes for watchlist, basket, and alerts', async () => {
    await request(app.getHttpServer())
      .get('/me/watchlist')
      .expect(200)
      .expect(({ body }) => {
        const watchlist = body as Array<Record<string, unknown>>;
        expect(watchlist[0]).toMatchObject({
          productSlug: 'zoegas-skane-mellanrost-450g',
          alertEnabled: true,
          demo: true,
        });
      });

    await request(app.getHttpServer())
      .post('/me/watchlist')
      .send({ productSlug: 'oatly-ikaffe-1l', targetPrice: 18 })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          productSlug: 'oatly-ikaffe-1l',
          targetPrice: 18,
          demo: true,
        });
      });

    await request(app.getHttpServer())
      .get('/me/weekly-basket')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: 'demo-weekly-basket-current',
          demo: true,
        });
      });

    await request(app.getHttpServer())
      .post('/me/weekly-basket/items')
      .send({ productSlug: 'zoegas-skane-mellanrost-450g', quantity: 2 })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          productSlug: 'zoegas-skane-mellanrost-450g',
          quantity: 2,
          demo: true,
        });
      });

    await request(app.getHttpServer())
      .get('/me/alerts')
      .expect(200)
      .expect(({ body }) => {
        const alerts = body as Array<Record<string, unknown>>;
        expect(alerts[0]).toMatchObject({
          type: 'target_price',
          active: true,
          demo: true,
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
