/**
 * @fileoverview Base app wrapper for Sudobility React Native apps — the
 * counterpart of `SudobilityApp` in `@sudobility/building_blocks`.
 *
 * Composes essential providers (SafeArea, i18n, Theme, QueryClient, Toast)
 * in the web's order. Each provider slot is optional and replaceable via props.
 * The entire provider stack is wrapped in an ErrorBoundary to catch initialization
 * errors and display a user-friendly fallback screen.
 *
 * What the web wrapper has and this one does not, because a native app has no
 * equivalent: `HelmetProvider` (SEO), `BrowserRouter`/`RouterWrapper` and the
 * route-based `PageTracker` (navigation is the app's own navigator). What it
 * has and this one does not yet: a default `QueryClient` (pass
 * `QueryClientProvider`), the `NetworkProvider` and the `InfoBanner`.
 */
import React, { Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import type { i18n as I18nInstance } from 'i18next';
import { ThemeProvider } from '../theme/ThemeContext';
import { ToastProvider } from '../components/toast/ToastProvider';
import { ErrorBoundary } from '../components/error/ErrorBoundary';
import type { ErrorBoundaryProps } from '../components/error/ErrorBoundary';
import { Theme } from '../types';

/**
 * Props for the SudobilityAppRN base app wrapper.
 */
export interface SudobilityAppRNProps {
  children: ReactNode;
  /** Pre-configured i18n instance */
  i18n?: I18nInstance;
  /**
   * Custom ThemeProvider component (optional). Defaults to this package's
   * `ThemeProvider`. The building blocks draw with or without it, so an app
   * with a theme of its own can pass that provider here.
   */
  ThemeProvider?: ComponentType<{ children: ReactNode }>;
  /** @deprecated Use `ThemeProvider` — the web's name for the same slot. */
  ThemeProviderComponent?: ComponentType<{ children: ReactNode }>;
  /**
   * Custom ToastProvider component (optional). Defaults to this package's
   * `ToastProvider`.
   */
  ToastProvider?: ComponentType<{ children: ReactNode }>;
  /** @deprecated Use `ToastProvider` — the web's name for the same slot. */
  ToastProviderComponent?: ComponentType<{ children: ReactNode }>;
  /**
   * Fallback shown while a lazily loaded screen suspends (optional). When
   * given, the content is wrapped in a `Suspense` boundary, as on the web.
   */
  LoadingFallback?: ComponentType;
  /** Query client provider (e.g., from @tanstack/react-query) */
  QueryClientProvider?: ComponentType<{ children: ReactNode }>;
  /** Optional additional providers to wrap around children */
  AppProviders?: ComponentType<{ children: ReactNode }>;
  /** Initial theme */
  initialTheme?: Theme;
  /** Storage key prefix for persisted settings */
  storageKeyPrefix?: string;
  /** Custom error boundary fallback component */
  ErrorFallbackComponent?: ErrorBoundaryProps['FallbackComponent'];
  /** Called when the error boundary catches an error */
  onError?: ErrorBoundaryProps['onError'];
}

/**
 * Base app wrapper that composes providers in a specific order (outermost to innermost):
 *
 * 1. ErrorBoundary (outermost, catches provider initialization errors)
 * 2. SafeAreaProvider (always present)
 * 3. I18nextProvider (if `i18n` provided)
 * 4. ThemeProvider (or the custom `ThemeProvider`)
 * 5. QueryClientProvider (if provided)
 * 6. ToastProvider (or the custom `ToastProvider`)
 * 7. AppProviders (custom additional providers, innermost)
 * 8. Suspense (if `LoadingFallback` provided) around the content
 *
 * @example
 * ```tsx
 * import { SudobilityAppRN } from '@sudobility/building_blocks_rn';
 *
 * function App() {
 *   return (
 *     <SudobilityAppRN i18n={i18n} initialTheme={Theme.SYSTEM}>
 *       <NavigationContainer>
 *         <RootNavigator />
 *       </NavigationContainer>
 *     </SudobilityAppRN>
 *   );
 * }
 * ```
 */
export function SudobilityAppRN({
  children,
  i18n,
  ThemeProvider: ThemeProviderProp,
  ThemeProviderComponent: ThemeProviderLegacy,
  ToastProvider: ToastProviderProp,
  ToastProviderComponent: ToastProviderLegacy,
  LoadingFallback,
  QueryClientProvider,
  AppProviders,
  initialTheme,
  storageKeyPrefix,
  ErrorFallbackComponent,
  onError,
}: SudobilityAppRNProps) {
  const ThemeProviderComponent = ThemeProviderProp ?? ThemeProviderLegacy;
  const ToastProviderComponent = ToastProviderProp ?? ToastProviderLegacy;

  let content = LoadingFallback ? (
    <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
  ) : (
    <>{children}</>
  );

  // Wrap with additional providers (innermost)
  if (AppProviders) {
    content = <AppProviders>{content}</AppProviders>;
  }

  // Toast
  if (ToastProviderComponent) {
    content = <ToastProviderComponent>{content}</ToastProviderComponent>;
  } else {
    content = <ToastProvider>{content}</ToastProvider>;
  }

  // Query client
  if (QueryClientProvider) {
    content = <QueryClientProvider>{content}</QueryClientProvider>;
  }

  // Theme
  if (ThemeProviderComponent) {
    content = <ThemeProviderComponent>{content}</ThemeProviderComponent>;
  } else {
    content = (
      <ThemeProvider
        initialTheme={initialTheme}
        storageKeyPrefix={storageKeyPrefix}
      >
        {content}
      </ThemeProvider>
    );
  }

  // i18n
  if (i18n) {
    content = <I18nextProvider i18n={i18n}>{content}</I18nextProvider>;
  }

  // SafeArea (outermost)
  content = <SafeAreaProvider>{content}</SafeAreaProvider>;

  // ErrorBoundary (very outermost)
  return (
    <ErrorBoundary FallbackComponent={ErrorFallbackComponent} onError={onError}>
      {content}
    </ErrorBoundary>
  );
}
