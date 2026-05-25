import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { routeMetadata } from '@/lib/seo';

const adminSession = {
  role: process.env.NEXT_PUBLIC_ADMIN_ROLE ?? 'viewer'
};

const users = [
  { id: 'ops-admin', email: 'ops@groceryview.example', role: 'admin', status: 'active' },
  { id: 'support-1', email: 'support@groceryview.example', role: 'ops', status: 'active' }
];

function hasAdminCapability(role: string) {
  return role === 'admin' || role === 'ops';
}

export function generateMetadata() {
  return routeMetadata({ path: '/admin/users', title: 'Admin users | GroceryView', description: 'Privileged user-management actions.', noIndex: true });
}

export default function AdminUsersPage() {
  const canManageUsers = hasAdminCapability(adminSession.role);

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-800">Admin users</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Privileged user management</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">The API fails closed with 401/403 unless the caller has an admin or ops role. This page hides user data and actions unless the same capability is present.</p>
        {canManageUsers ? (
          <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="p-4">Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id}><td className="p-4 font-bold">{user.email}</td><td>{user.role}</td><td>{user.status}</td><td className="space-x-2"><button className="rounded-full bg-rose-700 px-3 py-1 text-xs font-black text-white" type="button">Disable</button><button className="rounded-full bg-slate-800 px-3 py-1 text-xs font-black text-white" type="button">Resend invite</button></td></tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-amber-950"><h2 className="text-2xl font-black">Admin capability required</h2><p className="mt-2 text-sm font-semibold">User-management table and disable/resend actions are hidden until the session exposes an admin or ops role.</p></section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
