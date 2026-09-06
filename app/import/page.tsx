import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { Import } from '@/lib/container/Import/Import';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
  }

  return (
    <Import
      user={{
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        image: session.user.image ?? null,
      }}
    />
  );
}
