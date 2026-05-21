import { Card, Eyebrow, PageShell } from '@/components/data-ui';

export default function LoginPage() {
  return (
    <PageShell>
      <Eyebrow>Authentication</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Sign in is not connected in this static build</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">No test account, fake email, or mock session is displayed. When the production auth endpoint is wired, this page can render a real sign-in flow.</p>
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">Fail-closed auth state</h2>
        <p className="mt-3 leading-7 text-amber-950">The static website can be browsed without credentials. Private account, household, receipt, notification, and subscription records are withheld because the repo snapshot does not include verified production records.</p>
      </Card>
    </PageShell>
  );
}
