import { getCurrentUser } from '@/lib/auth';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  return <DashboardClient user={user!} />;
}
