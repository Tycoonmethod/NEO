
'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/language-context';
import { ProjectProvider } from '@/contexts/project-context';
import { ThemeProvider } from '@/components/theme-provider';
import { useState, useEffect } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <LanguageProvider>
          <ProjectProvider>
            {children}
          </ProjectProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
