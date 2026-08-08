import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { Navbar } from '@/lib/components/Navbar';

import { AccountSettings } from './AccountSettings';
import { TokenDisplay } from './TokenDisplay';

export default async function Settings() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('better-auth.session_token')?.value ?? '';
  const { name, email, image } = session.user;

  return (
    <div className="flex flex-col flex-1">
      <Navbar email={email ?? ''} />

      <main className="flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-2xl font-semibold">Settings</h1>
          <AccountSettings
            user={{ name, email: email ?? '', image: image ?? null }}
          />
          <div className="mt-6">
            <TokenDisplay token={token} />
          </div>
        </div>
      </main>
    </div>
  );
}
