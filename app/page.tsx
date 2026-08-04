import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { Home } from '@/lib/container/Home/Home';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <Home user={session?.user ?? null} />;
}
