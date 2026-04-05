import { getCurrentUser } from '@/lib/auth';
import ContentGenerator from '@/components/content-generator/ContentGenerator';

export default async function ContentGeneratorPage() {
  const user = await getCurrentUser();
  return <ContentGenerator user={user!} />;
}
