import DashboardLayout from '@/components/DashboardLayout';
import AdminCard from '@/components/AdminCard';
import AdsClient from './ui';
import { fetchMe } from '@/lib/auth';

export default async function AdsPage() {
  const me = await fetchMe();

  return (
    <DashboardLayout user={me.user}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Gestion Ads</h1>
            <p className="text-zinc-500 text-lg">Banners, Popups, Splash — CRUD + upload image.</p>
          </div>
        </div>

        <AdminCard title="Campagnes" description="Créer, activer/désactiver et organiser les ads.">
          <AdsClient />
        </AdminCard>
      </div>
    </DashboardLayout>
  );
}
