import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface ProvidersProps { children: ReactNode }

function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

export function renderWithTheme(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from '@testing-library/react-native';

export async function renderWithThemeAsync(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const utils = render(ui, { wrapper: Providers, ...options });
  // Flush pending microtasks from async effects (e.g., ThemeContext AsyncStorage)
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
}
