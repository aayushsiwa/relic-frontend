'use client';

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

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    startTransition(async () => {
      try {
        const { error: signUpErr } = await authClient.signUp.email(
          {
            email,
            password,
            name,
          },
          {}
        );
        if (signUpErr) {
          setError(signUpErr.message || 'Signup failed.');
        } else {
          setPendingEmail(email);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error.');
      }
    });
  }

  async function resendVerification() {
    if (!pendingEmail) return;
    setError(null);
    setResent(false);
    setIsResending(true);
    try {
      const { error: resendErr } = await authClient.sendVerificationEmail({
        email: pendingEmail,
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

  if (pendingEmail) {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We sent a verification link to {pendingEmail}. Click it to activate
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resent && (
            <p className="text-sm font-normal text-primary">
              Verification email resent.
            </p>
          )}
          {error && (
            <p className="text-sm font-normal text-destructive">{error}</p>
          )}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={resendVerification}
              disabled={isResending}
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already verified? <a href="/login">Log in</a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </Field>
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
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            {error && (
              <Field>
                <FieldError>{error}</FieldError>
              </Field>
            )}
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Account'}
                </Button>
                <Button variant="outline" type="button" disabled>
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/login">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
