import { Card, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/cookies');
}

const cookieCategories = [
  {
    name: 'necessary',
    purpose: 'Security, consent proof, language, and core navigation cookies required to run GroceryView.',
    defaultState: 'always on'
  },
  {
    name: 'analytics',
    purpose: 'Optional aggregated product and source-coverage measurement after consent.',
    defaultState: 'denied until opt-in'
  },
  {
    name: 'ads',
    purpose: 'Optional ad storage. Ads stay non-personalised unless the user grants ad consent.',
    defaultState: 'denied until opt-in'
  },
  {
    name: 'personalisation',
    purpose: 'Optional recommendation and ad-personalisation signals after explicit consent.',
    defaultState: 'denied until opt-in'
  }
] as const;

export default function CookiePolicyPage() {
  return (
    <PageShell>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Cookiepolicy / Cookie policy</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Cookie policy and consent settings</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView uses an IAB TCF v2.2 category disclosure pattern with Google Consent Mode v2. Optional analytics, ads, and personalisation signals default to denied, and ads remain non-personalised until consent is granted.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-2xl font-black text-slate-950">Consent categories</h2>
          <div className="mt-4 grid gap-3">
            {cookieCategories.map((category) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={category.name}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-black capitalize text-slate-950">{category.name}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{category.defaultState}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{category.purpose}</p>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black text-slate-950">Consent proof</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Managed choices are stored locally with policyVersion, timestamp, action, and category state so the banner can prove which policy text was accepted without sending private grocery data to public pages.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>policyVersion changes force a fresh consent choice.</li>
            <li>timestamp records when the shopper accepted, rejected, or managed categories.</li>
            <li>Google Consent Mode v2 maps analytics_storage, ad_storage, ad_user_data, and ad_personalization from the chosen categories.</li>
            <li>AdSense and marketing integrations must keep non-personalised behavior unless ads and personalisation are granted.</li>
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">Svensk sammanfattning</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Nödvändiga cookies krävs för säkerhet och val av samtycke. Analys, ads och personalisation är frivilliga och avstängda tills du väljer dem. Du kan neka alla val utan att förlora kärnfunktioner för verifierade pris- och källdata.
        </p>
      </Card>
    </PageShell>
  );
}
