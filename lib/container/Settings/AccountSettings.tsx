'use client';

import { useRef, useState } from 'react';

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

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function AccountSettings({
  user,
}: {
  user: { name: string; email: string; image: string | null };
}) {
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState<string | null>(user.image);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setProfileError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setProfileError('Image must be 2MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
        image,
      });
      if (error) {
        setProfileError(error.message || 'Failed to update profile.');
      } else {
        setProfileSaved(true);
      }
    } catch {
      setProfileError('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (error) {
        setPasswordError(error.message || 'Failed to change password.');
      } else {
        setPasswordSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailMessage(null);
    if (!newEmail.trim()) {
      setEmailError('Enter the new email address.');
      return;
    }
    if (newEmail.trim() === user.email) {
      setEmailError('That is already your email.');
      return;
    }
    setIsChangingEmail(true);
    try {
      const { data, error } = await authClient.changeEmail({
        newEmail: newEmail.trim(),
        callbackURL: '/settings',
      });
      if (error) {
        setEmailError(error.message || 'Failed to change email.');
      } else if (data?.status) {
        setEmailMessage(
          'Verification email sent. Click the link in the email to finish changing your email address.'
        );
        setNewEmail('');
      } else {
        setEmailError('Failed to change email.');
      }
    } catch {
      setEmailError('Failed to change email.');
    } finally {
      setIsChangingEmail(false);
    }
  }

  async function signOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      window.location.href = '/login';
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your name and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile}>
            <FieldGroup>
              <Field orientation="horizontal">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border text-lg font-medium"
                    style={
                      image
                        ? {
                            backgroundImage: `url(${image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    {!image && (user.name.trim()[0] ?? '?').toUpperCase()}
                  </span>
                  <div className="flex flex-col items-start gap-1">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change photo
                    </Button>
                    {image && (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => setImage(null)}
                      >
                        Remove
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  readOnly
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-email">Change email</FieldLabel>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="new@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isChangingEmail}
                />
                <FieldDescription>
                  A verification link will be sent before the change takes
                  effect.
                </FieldDescription>
              </Field>
              {emailError && (
                <Field>
                  <FieldError>{emailError}</FieldError>
                </Field>
              )}
              {emailMessage && (
                <p className="text-xs font-normal text-primary">
                  {emailMessage}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={changeEmail}
                disabled={isChangingEmail}
              >
                {isChangingEmail ? 'Sending...' : 'Change email'}
              </Button>
              {profileError && (
                <Field>
                  <FieldError>{profileError}</FieldError>
                </Field>
              )}
              {profileSaved && (
                <p className="text-xs font-normal text-primary">
                  Profile updated.
                </p>
              )}
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving...' : 'Save profile'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change the password used to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="current-password">
                  Current password
                </FieldLabel>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">
                  Confirm new password
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Field>
              {passwordError && (
                <Field>
                  <FieldError>{passwordError}</FieldError>
                </Field>
              )}
              {passwordSaved && (
                <p className="text-xs font-normal text-primary">
                  Password changed.
                </p>
              )}
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Changing...' : 'Change password'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Sign out of Relic on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={signOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
