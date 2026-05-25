import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchMustiSeProducts,
  MUSTI_SE_DEFAULT_SOURCE_URLS,
  parseMustiSeProducts
} from '../musti-se.js';

const RETRIEVED_AT = '2026-05-25T17:20:00.000Z';
const HTML = `<!doctype html>
<script>dataLayer.push({'category': {'tree': 'Katt > Kattmat'}});</script>
<div data-prod-wrapper class='col-6'>
  <div class="prodbox prodbox_2 prodbox_SE" data-id="78566:0" data-product_no="212262:212261">
    <div class="prodbox_picture">
      <a data-product-id="78566" href="purenatural-wilder-cat-adult-red-meat">
        <img src='https://get.musti.media/shops/mse/resources/ftp/front/89/purenatural.jpg' data-b17-img='https://get.musti.media/shops/mse/resources/ftp/front/89/purenatural.jpg' alt='Purenatural Wilder Cat Adult Red Meat (6 kg)' />
      </a>
    </div>
    <div class="prodbox_title" title="Purenatural Wilder Cat Adult Red Meat">
      <a href='purenatural-wilder-cat-adult-red-meat'><span><b>Purenatural</b></span> Wilder Cat Adult Red Meat</a>
    </div>
    <div class="prodbox_sizes">
      <div class="prodbox_size"><a data-prod-no="212262" href="purenatural-wilder-cat-adult-red-meat?97090">6 kg</a></div>
      <div class="prodbox_size prodbox_size_last"><a data-prod-no="212261" href="purenatural-wilder-cat-adult-red-meat?97088">2 kg</a></div>
    </div>
    <div class="prodbox_price currency_sek_incl hide">
      <div class="prodbox_price_font"><span class="prodbox_price_from">från</span> <span class="price"><span class='nowrap'>289,00<var> kr</var></span></span></div>
    </div>
    <div class="prodbox_inventory"><div class="inventory inv_yes">På lager.</div></div>
    <input type='hidden' name='filter_results' id="filter_973724639" value='|section:katt;;;category:katt-kattmat-torrfoder&amp;katt-kattmat;;;stock:yes;;;|' />
  </div>
</div>
<div data-prod-wrapper class='col-6'>
  <div class="prodbox prodbox_2 prodbox_SE" data-id="78787:0" data-product_no="213381">
    <div class="prodbox_picture"><a data-product-id="78787" href="purenatural-wilder-bone-broths-beef-350-ml"><img src='/bone.jpg' alt='Purenatural Wilder Bone Broths Beef 350 ml' /></a></div>
    <div class="prodbox_title" title="Purenatural Wilder Bone Broths Beef 350 ml"><a href='purenatural-wilder-bone-broths-beef-350-ml'><span><b>Purenatural</b></span> Wilder Bone Broths Beef 350 ml</a></div>
    <div class="prodbox_price currency_sek_incl hide"><div class="prodbox_price_font"><span class="price"><span class='nowrap'>34,90<var> kr</var></span></span></div></div>
    <div class="prodbox_inventory"><div class="inventory inv_no">Ej i lager.</div></div>
  </div>
</div>`;

describe('Musti SE connector', () => {
  it('parses Arken Zoo B17 listing cards into Swedish pet-specialty rows', () => {
    const rows = parseMustiSeProducts(HTML, MUSTI_SE_DEFAULT_SOURCE_URLS[0], RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'musti-se',
      retailerType: 'pet_specialty',
      code: '212262',
      productId: '78566',
      name: 'Purenatural Wilder Cat Adult Red Meat',
      brand: 'Purenatural',
      category: 'katt-kattmat-torrfoder > katt-kattmat',
      variantSizes: ['6 kg', '2 kg'],
      price: 289,
      priceText: '289.00 SEK',
      available: true,
      productUrl: 'https://www.arkenzoo.se/purenatural-wilder-cat-adult-red-meat',
      imageUrl: 'https://get.musti.media/shops/mse/resources/ftp/front/89/purenatural.jpg',
      sourceUrl: MUSTI_SE_DEFAULT_SOURCE_URLS[0],
      retrievedAt: RETRIEVED_AT
    });
    assert.equal(rows[1]?.price, 34.9);
    assert.equal(rows[1]?.available, false);
    assert.equal(rows[1]?.category, 'Katt > Kattmat');
  });

  it('fetches with headers, de-duplicates, caps rows, and handles blocked responses', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchMustiSeProducts({
      sourceUrls: [MUSTI_SE_DEFAULT_SOURCE_URLS[0], MUSTI_SE_DEFAULT_SOURCE_URLS[1]],
      fetchImpl: async (url, init) => {
        requestedUrls.push(`${url} ${JSON.stringify(init?.headers ?? {})}`);
        return new Response(HTML);
      },
      maxRows: 1,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 1);
    assert.equal(requestedUrls.length, 1);
    assert.match(requestedUrls[0] ?? '', /musti-se-connector/);
    await assert.rejects(
      () => fetchMustiSeProducts({ fetchImpl: async () => new Response('blocked', { status: 429 }) }),
      /blocked with HTTP 429/
    );
  });
});
