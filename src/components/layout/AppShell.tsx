/**
 * @fileoverview AppShell for React Native — the one screen shell (mirror of the
 * web building_blocks `AppShell`).
 *
 * Composes `AppScreenLayout` (SafeArea + header/footer slots + scroll) and owns
 * the `PageConfigContext`, so a screen deep in the tree can override the
 * shell-level layout (scroll / width / padding / background) via
 * `useSetPageConfig` without the shell knowing about it.
 *
 * The web shell takes `topBar`/`footer` configuration objects and picks the
 * component; here the header and footer are passed as elements (an
 * `AppHeader`, an `AppFooter`), since a native screen's chrome is as often the
 * navigator's. There are no breadcrumbs: a stack's back button is the trail.
 */
import React, { useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { AppScreenLayout } from './AppScreenLayout';
import { PageConfigContext, type PageConfig } from './PageConfig';

export interface AppShellProps {
  children: React.ReactNode;
  /** Optional header (e.g. an `AppHeader`). */
  header?: React.ReactNode;
  /** Optional footer. */
  footer?: React.ReactNode;
  /**
   * Screen-level page defaults. A screen overrides these at runtime via
   * `useSetPageConfig`; the override is merged in last.
   */
  pageDefaults?: PageConfig;
  /** @deprecated Use `pageDefaults` — the web's name for the same thing. */
  defaults?: PageConfig;
  /** Custom container style, forwarded to `AppScreenLayout`. */
  style?: StyleProp<ViewStyle>;
  /** Custom content style, forwarded to `AppScreenLayout`. */
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppShell({
  children,
  header,
  footer,
  pageDefaults,
  defaults,
  style,
  contentStyle,
}: AppShellProps) {
  const [pageConfig, setPageConfig] = useState<PageConfig>({});
  const ctx = useMemo(() => ({ pageConfig, setPageConfig }), [pageConfig]);
  const merged = { ...defaults, ...pageDefaults, ...pageConfig };

  return (
    <PageConfigContext.Provider value={ctx}>
      <AppScreenLayout
        header={header}
        footer={footer}
        scrollable={merged.scrollable}
        maxWidth={merged.maxWidth}
        contentPadding={merged.contentPadding}
        background={merged.background}
        style={style}
        contentStyle={contentStyle}
      >
        {children}
      </AppScreenLayout>
    </PageConfigContext.Provider>
  );
}

export default AppShell;
