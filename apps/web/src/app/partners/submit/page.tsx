import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';
import { partnerOnboardingIntake } from '@/lib/source-health';

export function generateMetadata() {
  return routeMetadata({
    path: '/partners/submit',
    title: 'Submit a retailer feed | GroceryView',
    description: 'Store partners can submit feed contacts, coverage areas, and sample price files for GroceryView source onboarding.'
  });
}

export const dynamic = 'force-static';

const inputClass = 'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm';
const labelClass = 'text-sm font-black text-slate-950';

export default function PartnerSubmitPage() {
  return (
    <PageShell>
      <Eyebrow>Partner onboarding</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Submit a store price feed</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Share the contact owner, geographic coverage, and a representative sample price file so GroceryView can evaluate a new retailer feed with the same source-health checks used for existing coverage.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <Card>
          <form action={`mailto:${partnerOnboardingIntake.intakeEmail}`} encType="text/plain" method="post">
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}>
                Retailer or store group
                <input className={inputClass} name="retailer" placeholder="Example Market AB" required type="text" />
              </label>
              <label className={labelClass}>
                Feed owner email
                <input className={inputClass} name="feed_owner_email" placeholder="data@example.com" required type="email" />
              </label>
              <label className={labelClass}>
                Feed owner name and role
                <input className={inputClass} name="feed_owner_role" placeholder="Jane Doe, data partnerships" required type="text" />
              </label>
              <label className={labelClass}>
                Technical contact
                <input className={inputClass} name="technical_contact" placeholder="api-team@example.com" required type="text" />
              </label>
            </div>

            <label className={`${labelClass} mt-5 block`}>
              Coverage areas
              <textarea className={inputClass} name="coverage_areas" placeholder="Countries, regions, delivery zones, store formats, and store identifier boundaries" required rows={5} />
            </label>

            <label className={`${labelClass} mt-5 block`}>
              Refresh cadence and launch timing
              <textarea className={inputClass} name="refresh_cadence" placeholder="Price, promotion, and availability update frequency plus preferred onboarding window" required rows={4} />
            </label>

            <label className={`${labelClass} mt-5 block`}>
              Sample price file link
              <input className={inputClass} name="sample_price_file_link" placeholder="Secure CSV, XLSX, JSON, Parquet, or OpenAPI URL" required type="url" />
            </label>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              If your sample cannot be shared by URL, submit this form and attach the file when your email client opens.
            </p>

            <label className={`${labelClass} mt-5 block`}>
              Data notes
              <textarea className={inputClass} name="data_notes" placeholder="Field dictionary, redaction notes, VAT/unit-price conventions, promotion validity windows, and stock-status fields" rows={5} />
            </label>

            <button className="mt-6 rounded-full bg-emerald-900 px-6 py-3 text-sm font-black text-white shadow-sm" type="submit">
              Email onboarding packet
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="border-emerald-200 bg-emerald-50/70">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Required packet</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">What to include</h2>
            <Checklist items={partnerOnboardingIntake.requiredContactFields} title="Feed contacts" />
            <Checklist items={partnerOnboardingIntake.coverageAreaFields} title="Coverage areas" />
            <Checklist items={partnerOnboardingIntake.samplePriceFileRequirements} title="Sample price file" />
          </Card>

          <Card>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Routing</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Source-health review path</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              GroceryView responds within {partnerOnboardingIntake.expectedResponseWindow} at {partnerOnboardingIntake.intakeEmail}.
            </p>
            <ol className="mt-4 space-y-2 text-sm font-semibold leading-6 text-slate-700">
              {partnerOnboardingIntake.routingSteps.map((step) => <li key={step}>• {step}</li>)}
            </ol>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Checklist({ items, title }: Readonly<{ items: string[]; title: string }>) {
  return (
    <section className="mt-4 rounded-2xl bg-white/80 p-4">
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </section>
  );
}
