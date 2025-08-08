'use client';

import { ThemeProvider } from '@/lib/theme';
import { ReactNode } from 'react';

// This component wraps children in a client-only context.
// Currently, it’s a pass-through, but you can add providers (e.g., ThemeProvider) here.
export function ClientProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}