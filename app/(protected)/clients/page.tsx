import { getCurrentUser } from '@/lib/auth';
import ClientsManager from '@/components/clients/ClientsManager';

export default async function ClientsPage() {
  const user = await getCurrentUser();
  return <ClientsManager user={user!} />;
}
