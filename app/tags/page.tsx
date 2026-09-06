import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { Tags } from '@/lib/container/Tags/Tags';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
  }

  return (
    <Tags
      user={{
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        image: session.user.image ?? null,
      }}
    />
  );
}
