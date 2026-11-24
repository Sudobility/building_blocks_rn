/**
 * Static `NativeStackNavigationOptions` from a `NavBarSpec`, for screens that declare their options
 * up front (`<Stack.Screen options={createNavBarOptions(spec)} />`) rather than in an effect. The
 * declarative counterpart of `useNavBar`; it cannot intercept the back press (a `NavBack.onPress`
 * needs the hook), so it maps only title, back visibility, and actions.
 */
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { NavBarSpec } from '@sudobility/navigation';
import { NavBarTitle } from './NavBarTitle';
import { NavBarActions } from './NavBarActions';
import type { NavIconMap } from './types';

export function createNavBarOptions(
  spec: NavBarSpec,
  opts: { icons?: NavIconMap } = {}
): NativeStackNavigationOptions {
  if (spec.hidden) return { headerShown: false };

  const options: NativeStackNavigationOptions = {
    headerShown: true,
    headerBackVisible: spec.back?.visible ?? true,
  };

  if (spec.subtitle) {
    options.headerTitle = () => (
      <NavBarTitle title={spec.title} subtitle={spec.subtitle} />
    );
  } else {
    options.title = spec.title ?? '';
  }

  if ((spec.actions ?? []).some(a => a.show !== false)) {
    options.headerRight = () => (
      <NavBarActions actions={spec.actions ?? []} icons={opts.icons} />
    );
  }

  return options;
}
