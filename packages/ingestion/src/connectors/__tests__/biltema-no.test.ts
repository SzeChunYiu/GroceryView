import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseBiltemaNoProducts } from '../biltema-no.js';

describe('Biltema NO connector', () => {
  it('parses NOK household rows from biltema.no article listings', () => {
    const rows = parseBiltemaNoProducts(`
      <script>
        window.articleListing_121339 = window.articleListing_121339 || [{
          "name":"Refillposer Original til fuktsluker, trepakning",
          "articleNumber":"36375",
          "articleNumberFriendlyName":"36-375",
          "imageUrl":"https://productimages.biltema.com/v1/Image/article/medium/36375/2",
          "url":"/hjem/rengjoring-hjem/fuktslukere/refillposer-original-til-fuktsluker-trepakning-2000055266",
          "priceIncVAT":"47,900000000",
          "previousPrice":"59,900000000",
          "analyticsProductEntity":{"categoryHierarchy":"Hjem/Rengjøring/Fuktslukere","categories":["Hjem","Rengjøring","Fuktslukere"]}
        },{
          "name":"Flytteeske, 75 liter",
          "articleNumber":"28661",
          "imageUrl":"/image/28661.jpg",
          "url":"/hjem/oppbevaring/flytteesker/flytteeske-75-liter-2000054327",
          "priceIncVAT":"29,900000000",
          "previousPrice":"0,000000000",
          "analyticsProductEntity":{"categoryHierarchy":"Hjem/Oppbevaring/Flytteesker","categories":["Hjem","Oppbevaring","Flytteesker"]}
        }];
      </script>
    `, 'https://www.biltema.no/hjem/', '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.country, 'NO');
    assert.equal(rows[0]?.currency, 'NOK');
    assert.equal(rows[0]?.chain, 'biltema-no');
    assert.equal(rows[0]?.code, '36375');
    assert.equal(rows[0]?.name, 'Refillposer Original til fuktsluker, trepakning');
    assert.equal(rows[0]?.category, 'Hjem/Rengjøring/Fuktslukere');
    assert.equal(rows[0]?.price, 47.9);
    assert.equal(rows[0]?.priceText, '47,90 kr');
    assert.equal(rows[0]?.previousPrice, 59.9);
    assert.equal(rows[0]?.previousPriceText, '59,90 kr');
    assert.equal(
      rows[0]?.productUrl,
      'https://www.biltema.no/hjem/rengjoring-hjem/fuktslukere/refillposer-original-til-fuktsluker-trepakning-2000055266'
    );
    assert.equal(rows[1]?.code, '28661');
    assert.equal(rows[1]?.price, 29.9);
    assert.equal(rows[1]?.previousPrice, 0);
    assert.equal(rows[1]?.previousPriceText, '');
  });
});
