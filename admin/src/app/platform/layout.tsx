import DashboardLayout from '@/components/DashboardLayout';
import { fetchMe } from '@/lib/auth';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await fetchMe();
  
  return (
    <DashboardLayout user={me.user}>
      {children}
    </DashboardLayout>
  );
}
