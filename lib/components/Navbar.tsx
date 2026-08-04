'use client';

import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@/lib/components/ThemeToggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/collections', label: 'Collections' },
  { href: '/settings', label: 'Settings' },
];

export function Navbar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b px-6 py-4 md:px-10">
      <span className="text-lg font-semibold tracking-tight">Relic</span>
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
        <span className="text-sm text-muted-foreground">{email}</span>
      </div>
    </header>
  );
}
