import { ContactForm } from '@/components/contact-form';
import { Card, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/contact');
}

export default function ContactPage() {
  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-start">
        <section>
          <Eyebrow>Contact</Eyebrow>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Contact GroceryView</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            Send source corrections, partnership notes, accessibility issues, or product feedback to the GroceryView team. Messages are accepted by a local stub while production support routing is prepared.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Card className="border-emerald-200 bg-emerald-50 p-4">
              <StatusBadge tone="success">Accepted</StatusBadge>
              <p className="mt-3 text-sm font-bold leading-6 text-emerald-950">Catalogue corrections, broken source links, and store coverage notes.</p>
            </Card>
            <Card className="border-sky-200 bg-sky-50 p-4">
              <StatusBadge>Private beta</StatusBadge>
              <p className="mt-3 text-sm font-bold leading-6 text-sky-950">Retailer feed discussions and data quality follow-ups.</p>
            </Card>
            <Card className="border-amber-200 bg-amber-50 p-4">
              <StatusBadge tone="warning">No secrets</StatusBadge>
              <p className="mt-3 text-sm font-bold leading-6 text-amber-950">Do not submit passwords, API keys, full receipts, or payment details.</p>
            </Card>
          </div>
        </section>

        <Card className="border-emerald-200 bg-white p-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Send a message</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Name, email, and message are required.</p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
