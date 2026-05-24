import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { friendSocialSnapshot } from '@/lib/social';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/account/friends');
}

export default function AccountFriendsPage() {
  const social = friendSocialSnapshot();

  return (
    <PageShell>
      <Eyebrow>Social discovery</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Friends & follow invites</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Follow trusted shoppers to add personal influence signals to recommendations. Invite links are short-lived, hashed server-side, and turn accepted friends into one-way follow relationships.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Following</p>
            <p className="mt-2 text-4xl font-black text-emerald-950">{social.follows.length}</p>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Invite expiry</p>
            <p className="mt-2 text-4xl font-black text-emerald-950">{social.inviteTtlDays}d</p>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Pending invites</p>
            <p className="mt-2 text-4xl font-black text-emerald-950">{social.pendingInvites.length}</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <Eyebrow>Current follows</Eyebrow>
          <div className="mt-4 space-y-3">
            {social.follows.map((follow) => (
              <div className="rounded-2xl border border-slate-100 p-4" key={`${follow.followerId}-${follow.followingId}`}>
                <p className="text-lg font-black text-slate-950">{follow.user?.name ?? follow.followingId}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Influence weight {Math.round(follow.influenceWeight * 100)}% · followed {new Date(follow.createdAt).toLocaleDateString('sv-SE')}</p>
                <p className="mt-2 text-sm text-slate-700">Favorite chains: {follow.user?.favoriteChains.join(', ') ?? 'private'}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Eyebrow>Suggested friends</Eyebrow>
          <div className="mt-4 space-y-3">
            {social.suggestions.map((user) => (
              <div className="rounded-2xl border border-slate-100 p-4" key={user.id}>
                <p className="text-lg font-black text-slate-950">{user.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Recommendation influence score {user.influenceScore}</p>
                <p className="mt-2 text-sm text-slate-700">Often shops: {user.favoriteChains.join(', ')}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <Eyebrow>Invite workflow</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Secure token acceptance</h2>
        <ul className="mt-4 grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-3">
          {social.recommendationSignals.map((signal) => (
            <li className="rounded-2xl bg-white p-4 shadow-sm" key={signal}>{signal}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          API contract: <code className="rounded bg-white px-1 py-0.5">POST /api/social/invite</code> creates an invite for an email, while <code className="rounded bg-white px-1 py-0.5">PATCH /api/social/invite</code> accepts a token for the signed-in shopper.
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
