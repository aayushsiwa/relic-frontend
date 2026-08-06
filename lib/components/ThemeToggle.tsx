'use client';
import { Moon, Sun } from 'phosphor-react';
import { useSyncExternalStore } from 'react';

import { useTheme } from './ThemeContext';

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Hide icon during SSR to avoid hydration issues
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  if (!mounted) return null;

  return (
    <button
      title={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded p-2 hover:bg-accent/30 text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      aria-label="Toggle dark mode"
      type="button"
    >
      {theme === 'dark' ? (
        <Sun size={18} weight="bold" className="text-yellow-400" />
      ) : (
        <Moon size={18} weight="bold" className="text-slate-800" />
      )}
    </button>
  );
}
