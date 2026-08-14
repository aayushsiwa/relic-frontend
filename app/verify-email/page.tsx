'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { authClient } from '@/lib/auth-client';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const callbackURL = searchParams.get('callbackURL') ?? '/settings';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    authClient
      .verifyEmail({ query: { token, callbackURL } })
      .then((res) => {
        if (res.data?.status) {
          window.location.href = callbackURL;
        } else {
          setError(res.error?.message || 'Verification failed.');
        }
      })
      .catch(() => setError('Verification failed.'));
  }, [token, callbackURL]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        {!token ? (
          <>
            <h1 className="mb-2 text-xl font-semibold">Missing token</h1>
            <p className="text-sm text-muted-foreground">
              The verification link is missing its token.
            </p>
          </>
        ) : error ? (
          <>
            <h1 className="mb-2 text-xl font-semibold">
              Couldn&apos;t verify email
            </h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-xl font-semibold">Verifying email...</h1>
            <p className="text-sm text-muted-foreground">
              You&apos;ll be redirected shortly.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
