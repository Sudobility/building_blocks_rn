/**
 * @fileoverview AppShell for React Native — the one screen shell (mirror of the
 * web building_blocks `AppShell`).
 *
 * Composes `AppScreenLayout` (SafeArea + header/footer slots + scroll) and owns
 * the `PageConfigContext`, so a screen deep in the tree can override the
 * shell-level layout (scroll / padding / background) via `useSetPageConfig`
 * without the shell knowing about it.
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
  /** Screen-level defaults; a screen overrides these via `useSetPageConfig`. */
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
  defaults,
  style,
  contentStyle,
}: AppShellProps) {
  const [pageConfig, setPageConfig] = useState<PageConfig>({});
  const ctx = useMemo(() => ({ pageConfig, setPageConfig }), [pageConfig]);
  const merged = { ...defaults, ...pageConfig };

  return (
    <PageConfigContext.Provider value={ctx}>
      <AppScreenLayout
        header={header}
        footer={footer}
        scrollable={merged.scrollable}
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
