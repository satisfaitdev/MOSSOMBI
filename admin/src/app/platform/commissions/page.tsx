import DashboardLayout from '@/components/DashboardLayout';
import { fetchMe, isAdminRole } from '@/lib/auth';
import CommissionsClient from './ui';

export default async function CommissionsPage() {
  const me = await fetchMe();

  if (!me.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-semibold mb-2 text-zinc-100">Accès Restreint</h2>
          <p className="text-sm text-zinc-500">Veuillez vous authentifier.</p>
        </div>
      </div>
    );
  }

  const role = me.user?.role ? String(me.user.role) : null;
  if (!isAdminRole(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="glass-card rounded-3xl p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-semibold mb-2 text-zinc-100">Accès Refusé</h2>
          <p className="text-sm text-zinc-500">Rôle insuffisant.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={me.user}>
      <CommissionsClient />
    </DashboardLayout>
  );
}
