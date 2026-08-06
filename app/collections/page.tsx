import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { Collections } from '@/lib/container/Collections/Collections';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
  }

  return <Collections email={session.user.email ?? ''} />;
}
