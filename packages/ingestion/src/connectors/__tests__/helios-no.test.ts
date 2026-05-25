import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchHeliosNoProducts,
  HELIOS_NO_CATALOGUE_STATUS,
  HELIOS_NO_OBSERVED_UNIQUE_ARTICLE_COUNT,
  HELIOS_NO_PRODUCTS_URL,
  parseHeliosNoProducts,
  verifyHeliosNoCatalogueStatus
} from '../helios-no.js';

const RETRIEVED_AT = '2026-05-25T12:40:00.000Z';
const FIXTURE = `<!doctype html><main>
<script>
  $contentViewModel.init({"Filters":[],"Groups":[{"ID":50364,"Name":"Drikke","Url":"/produkter/drikke/"},{"ID":53294,"Name":"Kombucha","Url":"/produkter/kombucha/"}],"Items":[{"EcomData":null,"Data":{"ArticleNumber":"1000719","EntityId":50520},"Name":"Helios Kombucha Lemonade","Description":null,"DescriptiveSize":"275 ml","Image":"/globalassets/connect-media/image/15/kombucha.png","Status":"","Preset":"lazyscale","Url":"/produkter/kombucha/helios-kombucha-lemonade/","GroupID":53294,"Filters":[],"CertificateImages":[],"Type":"Item","ItemNumber":null,"IsCampaign":false,"IsOnlineCampaign":false,"IsOutlet":false,"IsDiscontinued":false,"IsNew":false},{"EcomData":null,"Data":{"ArticleNumber":"1000719","EntityId":50520},"Name":"Helios Kombucha Lemonade","Description":null,"DescriptiveSize":"275 ml","Image":"/globalassets/connect-media/image/15/kombucha.png","Status":"","Preset":"lazyscale","Url":"/produkter/drikke/helios-kombucha-lemonade/","GroupID":50364,"Filters":[],"CertificateImages":[],"Type":"Item","ItemNumber":null,"IsCampaign":false,"IsOnlineCampaign":false,"IsOutlet":false,"IsDiscontinued":false,"IsNew":false},{"EcomData":null,"Data":{"ArticleNumber":"1002291","EntityId":117601},"Name":"Helios Tofu Røkt","Description":"Økologisk tofu","DescriptiveSize":"250g","Image":"/globalassets/connect-media/image/14/tofu.png","Status":"","Preset":"lazyscale","Url":"/produkter/tofu/helios-tofu-rokt/","GroupID":53295,"Filters":[],"CertificateImages":[],"Type":"Item","ItemNumber":null,"IsCampaign":false,"IsOnlineCampaign":false,"IsOutlet":false,"IsDiscontinued":true,"IsNew":false}],"GroupID":51448});
</script>
</main>`;

describe('Helios NO connector', () => {
  it('documents the verified official catalogue count and no-price caveat', () => {
    const status = verifyHeliosNoCatalogueStatus();

    assert.equal(status, HELIOS_NO_CATALOGUE_STATUS);
    assert.equal(status.status, 'verified_official_product_catalogue_no_prices');
    assert.equal(status.qualifiesForOnlinePriceConnector, false);
    assert.equal(status.observedUniqueArticleCount, HELIOS_NO_OBSERVED_UNIQUE_ARTICLE_COUNT);
    assert.match(status.caveat, /null prices/);
    assert.equal(status.evidence.some((entry) => entry.kind === 'embedded_catalogue'), true);
  });

  it('parses and de-duplicates official product catalogue rows by article number', () => {
    const rows = parseHeliosNoProducts(FIXTURE, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((row) => row.articleNumber), ['1000719', '1002291']);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'helios-no',
      retailerType: 'health_food',
      code: 'helios-no:1000719',
      articleNumber: '1000719',
      entityId: '50520',
      name: 'Helios Kombucha Lemonade',
      description: '',
      descriptiveSize: '275 ml',
      categoryId: '53294',
      categoryName: 'Kombucha',
      price: null,
      priceText: '',
      available: true,
      productUrl: 'https://www.helios.no/produkter/kombucha/helios-kombucha-lemonade/',
      imageUrl: 'https://www.helios.no/globalassets/connect-media/image/15/kombucha.png',
      sourceUrl: HELIOS_NO_PRODUCTS_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.available, false);
    assert.equal(rows[0]?.provenance.catalogueEntryCount, 3);
    assert.equal(rows[0]?.provenance.uniqueArticleCount, 2);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchHeliosNoProducts({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('helios-no-connector'), true);
    await assert.rejects(
      () => fetchHeliosNoProducts({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });

  it('fails closed when the embedded content view model is missing', () => {
    assert.throws(() => parseHeliosNoProducts('<main>No catalogue JSON</main>', RETRIEVED_AT), /content view model not found/);
  });
});
