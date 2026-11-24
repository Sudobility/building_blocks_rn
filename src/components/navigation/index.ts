export {
  useNavBar,
  type NavBarNavigation,
  type UseNavBarOptions,
} from './useNavBar';
export { createNavBarOptions } from './createNavBarOptions';
export { NavBarTitle } from './NavBarTitle';
export { NavBarActions } from './NavBarActions';
export { HeaderBackButton } from './HeaderBackButton';
export type { NavIconComponent, NavIconMap } from './types';

// Re-export the framework-agnostic model vocabulary so RN consumers can get it
// from building_blocks_rn without a separate import.
export type {
  NavAction,
  NavBack,
  NavBarSpec,
  ScreenEntry,
  ScreenInput,
  NavState,
  NavStore,
} from '@sudobility/navigation';
export { createNavStore } from '@sudobility/navigation';
