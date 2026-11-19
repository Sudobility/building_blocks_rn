/**
 * @fileoverview PageConfig context for React Native (mirror of the web
 * building_blocks `page-config`).
 *
 * A screen overrides the shell-level layout (scroll / width / padding /
 * background) via `useSetPageConfig`; `AppShell` merges the overrides into
 * `AppScreenLayout`.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { BackgroundVariant, ContentPadding, MaxWidth } from '../../types';

/**
 * The page-level layout options a screen may override at runtime — the web's
 * `AppPageProps`, less what only a browser page has (`layoutMode`,
 * `aspectRatio` and the class names).
 */
export interface PageConfig {
  /**
   * Max width for the content area (default: '5xl' — 1024). Caps the content
   * at a readable line length on a tablet or desktop window; pass 'full' to
   * remove the cap.
   */
  maxWidth?: MaxWidth;
  /** Content padding (default: 'md') */
  contentPadding?: ContentPadding;
  /** Background variant */
  background?: BackgroundVariant;
  /**
   * Whether the content area scrolls (default: true). Set to false for screens
   * whose panels handle their own scrolling.
   */
  scrollable?: boolean;
}

/** The web's name for {@link PageConfig}. */
export type AppPageProps = PageConfig;

export interface PageConfigContextValue {
  pageConfig: PageConfig;
  setPageConfig: (config: PageConfig) => void;
}

export const PageConfigContext = createContext<PageConfigContextValue>({
  pageConfig: {},
  setPageConfig: () => {},
});

/**
 * Standalone provider for the page-config context. `AppShell` provides this
 * context itself, so most apps never need this — it is for an app that keeps a
 * custom shell but still wants the shared `useSetPageConfig`/`usePageConfig`
 * instead of a per-app context.
 */
export function PageConfigProvider({ children }: { children: ReactNode }) {
  const [pageConfig, setPageConfig] = useState<PageConfig>({});
  const value = useMemo(() => ({ pageConfig, setPageConfig }), [pageConfig]);
  return (
    <PageConfigContext.Provider value={value}>
      {children}
    </PageConfigContext.Provider>
  );
}

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
