import type { TransactionalEmailMessage } from '@groceryview/notifications';

export type MyFlyerEmailOffer = {
  productId: string;
  productName: string;
  brand?: string;
  chainName: string;
  storeName?: string;
  offerPrice: number;
  regularPrice?: number;
  unitPrice?: number;
  currency: string;
  validUntil?: string;
  imageUrl?: string;
  sourceUrl?: string;
  confidence: number;
};

export type BuildMyFlyerEmailInput = {
  baseUrl: string;
  country: string;
  generatedAt: string;
  recipientEmail: string;
  userId: string;
  weekStartsOn: string;
  weekEndsOn: string;
  offers: MyFlyerEmailOffer[];
};

export function buildMyFlyerEmail(input: BuildMyFlyerEmailInput): TransactionalEmailMessage {
  const manageUrl = `${input.baseUrl.replace(/\/+$/, '')}/account/email-prefs`;
  const flyerUrl = `${input.baseUrl.replace(/\/+$/, '')}/${input.country.toLowerCase()}/my-flyer`;
  const subject = `Your GroceryView MyFlyer for ${formatDate(input.weekStartsOn)}`;
  const text = [
    `Your personalized MyFlyer for ${input.country.toUpperCase()} is ready.`,
    '',
    `Week: ${formatDate(input.weekStartsOn)} to ${formatDate(input.weekEndsOn)}`,
    `Open the flyer: ${flyerUrl}`,
    '',
    ...input.offers.map((offer, index) => formatTextOffer(offer, index)),
    '',
    'Every offer is rendered from source-backed weekly flyer rows.',
    `Manage email preferences: ${manageUrl}`,
    '',
    `Sent at: ${input.generatedAt}`
  ].join('\n');

  return {
    to: input.recipientEmail,
    subject,
    text,
    html: renderMyFlyerHtml({ ...input, flyerUrl, manageUrl }),
    metadata: {
      type: 'my_flyer_weekly_digest',
      userId: input.userId,
      country: input.country.toLowerCase(),
      itemCount: String(input.offers.length),
      sendAt: input.generatedAt
    }
  };
}

function renderMyFlyerHtml(input: BuildMyFlyerEmailInput & { flyerUrl: string; manageUrl: string }) {
  const offerCards = input.offers.map(renderOfferCard).join('');
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f2eb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <main style="max-width:720px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;color:#9a3412;font-size:12px;font-weight:700;">GroceryView MyFlyer</p>
      <h1 style="margin:0 0 12px;font-size:32px;line-height:1.1;">Your weekly flyer is ready</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.5;">${escapeHtml(input.country.toUpperCase())} offers for ${escapeHtml(formatDate(input.weekStartsOn))} to ${escapeHtml(formatDate(input.weekEndsOn))}, ranked from source-backed flyer rows.</p>
      <p style="margin:0 0 24px;"><a href="${escapeAttribute(input.flyerUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:700;">Open MyFlyer</a></p>
      <section style="display:grid;gap:12px;">${offerCards}</section>
      <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.5;">You are receiving this because MyFlyer weekly email is enabled in account email preferences. <a href="${escapeAttribute(input.manageUrl)}" style="color:#0f172a;">Manage preferences</a>.</p>
    </main>
  </body>
</html>`;
}

function renderOfferCard(offer: MyFlyerEmailOffer) {
  const savings = typeof offer.regularPrice === 'number' && offer.regularPrice > offer.offerPrice
    ? `<strong style="color:#166534;">Save ${escapeHtml(formatMoney(offer.regularPrice - offer.offerPrice, offer.currency))}</strong>`
    : '<span style="color:#64748b;">Weekly flyer price</span>';
  const image = offer.imageUrl
    ? `<img src="${escapeAttribute(offer.imageUrl)}" alt="" style="width:96px;height:96px;object-fit:contain;border-radius:8px;background:#f8fafc;">`
    : '';
  const source = offer.sourceUrl
    ? `<a href="${escapeAttribute(offer.sourceUrl)}" style="color:#475569;">source</a>`
    : 'source-backed row';

  return `<article style="display:flex;gap:14px;border:1px solid #d6d3d1;border-radius:8px;background:#ffffff;padding:14px;">
    ${image}
    <div>
      <p style="margin:0 0 4px;color:#9a3412;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">${escapeHtml(offer.brand || offer.chainName)}</p>
      <h2 style="margin:0 0 8px;font-size:18px;line-height:1.25;">${escapeHtml(offer.productName)}</h2>
      <p style="margin:0 0 8px;font-size:24px;font-weight:800;">${escapeHtml(formatMoney(offer.offerPrice, offer.currency))}</p>
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.45;">${escapeHtml([offer.chainName, offer.storeName].filter(Boolean).join(' · '))} · ${savings} · confidence ${Math.round(offer.confidence * 100)}% · ${source}</p>
    </div>
  </article>`;
}

function formatTextOffer(offer: MyFlyerEmailOffer, index: number) {
  const regular = typeof offer.regularPrice === 'number' ? `, was ${formatMoney(offer.regularPrice, offer.currency)}` : '';
  return `${index + 1}. ${offer.productName}${offer.brand ? ` (${offer.brand})` : ''} - ${formatMoney(offer.offerPrice, offer.currency)}${regular} at ${[offer.chainName, offer.storeName].filter(Boolean).join(' / ')}`;
}

function formatMoney(value: number, currency: string) {
  return `${value.toFixed(2)} ${currency}`;
}

function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
