import { ContactForm } from '@/components/contact-form';
import { Card, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/contact');
}

export default function ContactPage() {
  return (
    <PageShell>
      <Card className="border-slate-200 bg-white/80">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Support intake</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Contact GroceryView</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          The contact endpoint is intentionally a local stub for now. Submissions are validated in the browser, posted to /api/contact, and appended to /tmp/contact.jsonl for development review.
        </p>
      </Card>
      <ContactForm />
    </PageShell>
  );
}
