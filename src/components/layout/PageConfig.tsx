/**
 * @fileoverview PageConfig context for React Native (mirror of the web
 * building_blocks `page-config`).
 *
 * A screen overrides the shell-level layout (scroll / padding / background) via
 * `useSetPageConfig`; `AppShell` merges the overrides into `AppScreenLayout`.
 */
import { createContext, useContext, useLayoutEffect } from 'react';

/** The subset of `AppScreenLayout` options a screen may override at runtime. */
export interface PageConfig {
  scrollable?: boolean;
  contentPadding?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'default' | 'white';
}

export interface PageConfigContextValue {
  pageConfig: PageConfig;
  setPageConfig: (config: PageConfig) => void;
}

export const PageConfigContext = createContext<PageConfigContextValue>({
  pageConfig: {},
  setPageConfig: () => {},
});

/**
 * Apply a page-level layout override for the lifetime of the calling screen.
 * Runs in a layout effect so it lands before paint; resets on unmount.
 */
export function useSetPageConfig(config: PageConfig) {
  const { setPageConfig } = useContext(PageConfigContext);
  const configKey = JSON.stringify(config);
  useLayoutEffect(() => {
    setPageConfig(config);
    return () => setPageConfig({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, setPageConfig]);
}

/** The current page-level layout overrides (set by `useSetPageConfig`). */
export function usePageConfig(): PageConfig {
  return useContext(PageConfigContext).pageConfig;
}
