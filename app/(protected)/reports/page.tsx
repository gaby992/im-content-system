import { getCurrentUser } from '@/lib/auth';
import ReportsManager from '@/components/reports/ReportsManager';

export default async function ReportsPage() {
  const user = await getCurrentUser();
  return <ReportsManager user={user!} />;
}
