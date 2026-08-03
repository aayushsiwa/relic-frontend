import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

import { LoginForm } from './LoginForm';

export default async function Login() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect('/');
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
