'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    startTransition(async () => {
      try {
        const { error: authError } = await authClient.signIn.email(
          {
            email,
            password,
            callbackURL: '/dashboard',
          },
          {}
        );
        if (authError) {
          if (
            authError.code === 'EMAIL_NOT_VERIFIED' ||
            authError.message === 'Email not verified'
          ) {
            setNeedsVerification(true);
          } else {
            setError(authError.message || 'Login failed.');
          }
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error.');
      }
    });
  }

  async function resendVerification() {
    setError(null);
    setResent(false);
    setIsResending(true);
    try {
      const { error: resendErr } = await authClient.sendVerificationEmail({
        email,
        callbackURL: '/',
      });
      if (resendErr) {
        setError(resendErr.message || 'Failed to resend.');
      } else {
        setResent(true);
      }
    } catch {
      setError('Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                />
              </Field>
              {needsVerification && (
                <Field>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-normal text-destructive">
                      Your email isn&apos;t verified yet.
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      A new verification link was sent to {email}. Check your
                      inbox.
                    </span>
                  </div>
                  {resent && (
                    <p className="text-xs font-normal text-primary">
                      Verification email resent.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    type="button"
                    onClick={resendVerification}
                    disabled={isResending}
                  >
                    {isResending ? 'Sending...' : 'Resend verification email'}
                  </Button>
                </Field>
              )}
              {error && (
                <Field>
                  <FieldError>{error}</FieldError>
                </Field>
              )}
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Logging in...' : 'Login'}
                </Button>
                <Button variant="outline" type="button" disabled>
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
