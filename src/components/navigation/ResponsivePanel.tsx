/**
 * A responsive host for a `@sudobility/navigation` stack — the RN counterpart of the web
 * `SlidingPanel`. The same framework-agnostic `NavStore` that drives React Navigation's header
 * (via `useNavBar`) here drives a self-contained panel that renders its own screen + nav bar:
 *
 * - **Phone** (`width < tabletBreakpoint`): the current screen is drawn full-screen, edge to edge,
 *   with its own nav bar on top.
 * - **Tablet** (`width >= tabletBreakpoint`): the same screen + nav bar are drawn as a bounded-width
 *   side panel anchored to one edge (`side`), over a scrim/backdrop.
 *
 * Unlike `useNavBar`, this does not touch React Navigation — it owns both the stack view and the
 * bar — so it renders the bar from the existing nav primitives (`NavBarTitle`/`NavBarActions`/
 * `HeaderBackButton`) directly. Back is wired to `store.pop()` (or the spec's `back.onPress`), and
 * the back control is shown whenever the store `canGoBack()` unless the spec forces it off.
 *
 * The store is a zustand *vanilla* store; it is bound into React with `useSyncExternalStore`, so
 * this component needs no `zustand` React import of its own.
 */
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { NavStore, NavBarSpec, ScreenEntry } from '@sudobility/navigation';
import { useThemeColors } from '../../theme/ThemeContext';
import { NavBarTitle } from './NavBarTitle';
import { NavBarActions } from './NavBarActions';
import { HeaderBackButton } from './HeaderBackButton';
import type { NavIconMap } from './types';

/** Width at or above which the panel renders as a side panel rather than full-screen. */
export const DEFAULT_TABLET_BREAKPOINT = 768;
/** Default bounded width of the tablet side panel (within the 360–420pt band). */
export const DEFAULT_PANEL_WIDTH = 380;
/** Backdrop fill behind the tablet side panel (theme-neutral, like a modal scrim). */
const SCRIM_COLOR = 'rgba(0, 0, 0, 0.4)';

export interface ResponsivePanelProps {
  /** The navigation stack to host (from `createNavStore`). */
  store: NavStore;
  /** screen `key` → renderer for its current entry. */
  screens: Record<string, (entry: ScreenEntry) => ReactNode>;
  /** name → icon component, for actions and a custom back. */
  icons?: NavIconMap;
  /** Composed-title override; wins over the spec's `title`/`subtitle`. */
  renderTitle?: (spec: NavBarSpec) => ReactNode;
  /** Composed-actions override; wins over the spec's `actions`. */
  renderActions?: (spec: NavBarSpec) => ReactNode;
  /**
   * Whether the panel is shown. Defaults to `true`. When it becomes `false` the panel renders
   * nothing and `onHidden` fires.
   */
  open?: boolean;
  /** Called when the panel has become hidden (i.e. `open` is falsey). */
  onHidden?: () => void;
  /** Which edge the tablet side panel is anchored to. Defaults to `'right'`. */
  side?: 'left' | 'right';
  /** Width (logical px) at or above which the tablet side panel is used. */
  tabletBreakpoint?: number;
  /** Bounded width (logical px) of the tablet side panel. */
  panelWidth?: number;
}

export function ResponsivePanel({
  store,
  screens,
  icons,
  renderTitle,
  renderActions,
  open = true,
  onHidden,
  side = 'right',
  tabletBreakpoint = DEFAULT_TABLET_BREAKPOINT,
  panelWidth = DEFAULT_PANEL_WIDTH,
}: ResponsivePanelProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();

  // Bind the vanilla zustand store without importing zustand's React entry: the snapshot is the
  // store's state object, which stays referentially stable between `set` calls.
  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState
  );

  // Fire `onHidden` whenever the panel is not open (including an initial closed mount).
  useEffect(() => {
    if (!open) onHidden?.();
  }, [open, onHidden]);

  if (!open) return null;

  const entry = state.current();
  const spec: NavBarSpec = entry?.nav ?? {};
  const renderScreen = entry ? screens[entry.key] : undefined;

  const canGoBack = state.canGoBack();
  const showBack = !spec.hidden && (spec.back?.visible ?? canGoBack);
  const onBack = () => {
    const custom = store.getState().current()?.nav?.back?.onPress;
    if (custom) custom();
    else store.getState().pop();
  };

  const bar = spec.hidden ? null : (
    <View style={[styles.bar, { borderBottomColor: colors.border }]}>
      <View style={styles.barSide}>
        {showBack ? (
          <HeaderBackButton
            label={spec.back?.label}
            icon={icons?.['back']}
            onPress={onBack}
          />
        ) : null}
      </View>
      <View style={styles.barTitle}>
        {renderTitle ? (
          renderTitle(spec)
        ) : spec.subtitle ? (
          <NavBarTitle title={spec.title} subtitle={spec.subtitle} />
        ) : spec.title ? (
          <Text
            numberOfLines={1}
            style={[styles.plainTitle, { color: colors.text }]}
          >
            {spec.title}
          </Text>
        ) : null}
      </View>
      <View style={styles.barSide}>
        {renderActions ? (
          renderActions(spec)
        ) : (spec.actions ?? []).some(a => a.show !== false) ? (
          <NavBarActions actions={spec.actions ?? []} icons={icons} />
        ) : null}
      </View>
    </View>
  );

  const content = (
    <>
      {bar}
      <View style={styles.screen}>
        {renderScreen ? renderScreen(entry!) : null}
      </View>
    </>
  );

  const isTablet = width >= tabletBreakpoint;

  if (!isTablet) {
    // Phone: the screen fills the whole window, edge to edge.
    return (
      <View
        testID='responsive-panel-full'
        style={[styles.full, { backgroundColor: colors.background }]}
      >
        {content}
      </View>
    );
  }

  // Tablet: a bounded-width panel anchored to one edge, over a scrim.
  return (
    <View
      testID='responsive-panel-overlay'
      style={[
        styles.overlay,
        { justifyContent: side === 'left' ? 'flex-start' : 'flex-end' },
      ]}
    >
      <View
        testID='responsive-panel-scrim'
        style={[styles.scrim, { backgroundColor: SCRIM_COLOR }]}
        pointerEvents='none'
      />
      <View
        testID='responsive-panel-side'
        style={[
          styles.side,
          {
            width: panelWidth,
            backgroundColor: colors.background,
            ...(side === 'left'
              ? { borderRightWidth: StyleSheet.hairlineWidth }
              : { borderLeftWidth: StyleSheet.hairlineWidth }),
            borderColor: colors.border,
          },
        ]}
      >
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  scrim: { ...StyleSheet.absoluteFillObject },
  side: { height: '100%' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barSide: { minWidth: 48, justifyContent: 'center' },
  barTitle: { flex: 1, alignItems: 'center' },
  plainTitle: { fontSize: 16, fontWeight: '600' },
  screen: { flex: 1 },
});
