'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@/lib/components/ThemeToggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/collections', label: 'Collections' },
  { href: '/tags', label: 'Tags' },
  { href: '/import', label: 'Import' },
];

export function Navbar({
  user,
}: {
  user: { name: string; email: string; image: string | null };
}) {
  const pathname = usePathname();
  const initial = user.name.trim()[0]?.toUpperCase() ?? '?';

  return (
    <header className="flex items-center justify-between border-b px-6 py-4 md:px-10">
      <Link
        href={'/'}
        className="text-lg font-semibold tracking-tight cursor-pointer select-none"
      >
        Relic
      </Link>
      <div className="flex items-center gap-4">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              'text-sm hover:text-foreground',
              pathname === item.href
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            {item.label}
          </a>
        ))}
        <ThemeToggle />
        <a
          href="/settings"
          title={user.email}
          className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-medium"
          style={
            user.image
              ? {
                  backgroundImage: `url(${user.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {!user.image && initial}
        </a>
      </div>
    </header>
  );
}
