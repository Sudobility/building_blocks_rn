/**
 * Map a framework-agnostic `NavBarSpec` onto the React Navigation native-stack header, so the same
 * model that drives the web `SlidingPanel` drives the platform's own nav bar here. React
 * Navigation keeps ownership of the stack (native push/pop + gestures); this hook only sets the
 * current screen's `title`/back/actions via `navigation.setOptions`, and resets them on unmount.
 *
 * Modelled on `music_app_rn`'s `useEditorHeader`: a minimal `NavBarNavigation` contract (so a test
 * can stand in for the navigator), `headerBackVisible` for the native back, a custom `headerLeft`
 * only when the screen intercepts back, and `headerTitle`/`headerRight` render functions that read
 * the latest spec from a ref so changing handlers never need the effect to re-run.
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { NavBarSpec } from '@sudobility/navigation';
import { NavBarTitle } from './NavBarTitle';
import { NavBarActions } from './NavBarActions';
import { HeaderBackButton } from './HeaderBackButton';
import type { NavIconMap } from './types';

/** The one thing asked of the navigator, so a test can stand in for it. */
export interface NavBarNavigation {
  setOptions: (options: NativeStackNavigationOptions) => void;
}

export interface UseNavBarOptions {
  /** The screen's navigation object (from React Navigation). */
  navigation: NavBarNavigation;
  /** The nav-bar spec to apply. */
  spec: NavBarSpec;
  /** name → icon component, for actions and a custom back. */
  icons?: NavIconMap;
  /** Composed-title override; wins over `spec.title`/`spec.subtitle`. */
  renderTitle?: (spec: NavBarSpec) => ReactNode;
  /** Composed-actions override; wins over `spec.actions`. */
  renderActions?: (spec: NavBarSpec) => ReactNode;
}

/** A stable key over the serializable parts of the spec, so the effect re-runs only on real change. */
function specKey(
  spec: NavBarSpec,
  hasTitle: boolean,
  hasActions: boolean
): string {
  return JSON.stringify({
    t: spec.title,
    s: spec.subtitle,
    h: spec.hidden,
    bv: spec.back?.visible,
    bp: Boolean(spec.back?.onPress),
    bl: spec.back?.label,
    a: (spec.actions ?? []).map(x => [
      x.id,
      x.label,
      x.iconName,
      x.disabled,
      x.show,
      x.placement,
    ]),
    rt: hasTitle,
    ra: hasActions,
  });
}

export function useNavBar({
  navigation,
  spec,
  icons,
  renderTitle,
  renderActions,
}: UseNavBarOptions): void {
  // Render functions read the latest values from here, so changing handlers don't re-run the effect.
  const ref = useRef({ spec, icons, renderTitle, renderActions });
  ref.current = { spec, icons, renderTitle, renderActions };

  const key = specKey(spec, Boolean(renderTitle), Boolean(renderActions));

  useLayoutEffect(() => {
    const cur = () => ref.current;
    const s = cur().spec;

    if (s.hidden) {
      navigation.setOptions({ headerShown: false });
      return () => navigation.setOptions({ headerShown: true });
    }

    const options: NativeStackNavigationOptions = { headerShown: true };

    // Title: a composed override, else a title+subtitle block, else the plain native title string.
    if (cur().renderTitle) {
      options.headerTitle = () => cur().renderTitle!(cur().spec);
    } else if (s.subtitle) {
      options.headerTitle = () => (
        <NavBarTitle title={cur().spec.title} subtitle={cur().spec.subtitle} />
      );
    } else {
      options.headerTitle = undefined;
      options.title = s.title ?? '';
    }

    // Back: a custom handler hides the native back and draws our own; otherwise defer to the stack.
    if (s.back?.onPress) {
      options.headerBackVisible = false;
      options.headerLeft = () => (
        <HeaderBackButton
          label={cur().spec.back?.label}
          icon={cur().icons?.['back']}
          onPress={() => cur().spec.back?.onPress?.()}
        />
      );
    } else {
      options.headerBackVisible = s.back?.visible ?? true;
      options.headerLeft = undefined;
    }

    // Actions: a composed override, else the action row, else nothing.
    if (cur().renderActions) {
      options.headerRight = () => cur().renderActions!(cur().spec);
    } else if ((s.actions ?? []).some(a => a.show !== false)) {
      options.headerRight = () => (
        <NavBarActions actions={cur().spec.actions ?? []} icons={cur().icons} />
      );
    } else {
      options.headerRight = undefined;
    }

    navigation.setOptions(options);

    // Leave the header clean for the next screen.
    return () =>
      navigation.setOptions({
        headerShown: true,
        headerTitle: undefined,
        headerRight: undefined,
        headerLeft: undefined,
        headerBackVisible: undefined,
        title: undefined,
      });
  }, [navigation, key]);
}
