import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { friendInviteAcceptanceWorkflow, listFriendFollows, listFriendInvites } from '@/lib/social';
import { routeMetadata } from '@/lib/seo';

const accountUserId = 'signed-in-user';
const accountDisplayName = 'Signed-in shopper';

export function generateMetadata() {
  return routeMetadata('/account/friends');
}

export default function AccountFriendsPage() {
  const follows = listFriendFollows(accountUserId);
  const invites = listFriendInvites(accountUserId);
  const pendingInvites = invites.filter((invite) => invite.status === 'pending');

  return (
    <PageShell>
      <Eyebrow>Friend follow model</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Friend invites and follow relationships</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Invite links create explicit user-to-user follows before friend activity can influence deal discovery. Acceptance stays token-gated, one-time, and separate from household list sharing.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Send friend invite</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              The invite API returns an opaque token and expiry. No follow relationship exists until the friend accepts the token.
            </p>
            <form action="/api/social/invite" className="mt-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm" method="post">
              <input name="action" type="hidden" value="create" />
              <input name="inviterDisplayName" type="hidden" value={accountDisplayName} />
              <input name="inviterUserId" type="hidden" value={accountUserId} />
              <label className="text-sm font-black text-slate-800" htmlFor="friend-invite-email">
                Friend email
                <input className="mt-1 w-full rounded-lg border border-emerald-200 px-3 py-2 font-semibold text-slate-950" id="friend-invite-email" name="inviteeEmail" placeholder="friend@example.com" type="email" required />
              </label>
              <button className="justify-self-start rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" type="submit">Create secure invite</button>
            </form>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">Acceptance workflow</h2>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              {friendInviteAcceptanceWorkflow.map((step) => <li className="rounded-xl bg-emerald-50 p-3" key={step}>{step}</li>)}
            </ul>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Active friend follows</h2>
          <div className="mt-4 grid gap-3">
            {follows.map((follow) => (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={follow.id}>
                <p className="font-black text-slate-950">{follow.followerDisplayName} follows {follow.followingDisplayName}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Accepted {new Date(follow.acceptedAt).toLocaleString('sv-SE')} through invite token {follow.sourceInviteToken}.</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Pending invites</h2>
          <div className="mt-4 grid gap-3">
            {pendingInvites.map((invite) => (
              <form action="/api/social/invite" className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={invite.id} method="post">
                <input name="action" type="hidden" value="accept" />
                <input name="acceptedByDisplayName" type="hidden" value="Friend account" />
                <input name="acceptedByUserId" type="hidden" value="friend-account-preview" />
                <input name="token" type="hidden" value={invite.token} />
                <p className="font-black text-slate-950">{invite.inviteeEmail}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Expires {new Date(invite.expiresAt).toLocaleString('sv-SE')}</p>
                <button className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" type="submit">Accept invite preview</button>
              </form>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
