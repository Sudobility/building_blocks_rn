/**
 * @fileoverview Tests for useNavBar — asserts a NavBarSpec is mapped onto the options handed to
 * React Navigation's `setOptions`, and that the header is reset on unmount. The option render
 * functions are checked for presence only (not invoked), so no native components need to render.
 */
import { describe, it, expect, vi } from 'vitest';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { renderHook } from '../../__tests__/test-utils';
import { useNavBar, type NavBarNavigation } from './useNavBar';

function fakeNav() {
  const setOptions = vi.fn<(o: NativeStackNavigationOptions) => void>();
  const nav: NavBarNavigation = { setOptions };
  return { nav, setOptions };
}

const lastOptions = (setOptions: ReturnType<typeof fakeNav>['setOptions']) =>
  setOptions.mock.calls.at(-1)![0];

describe('useNavBar', () => {
  it('maps a plain title and leaves the native back in place', async () => {
    const { nav, setOptions } = fakeNav();
    await renderHook(() =>
      useNavBar({ navigation: nav, spec: { title: 'Home' } })
    );
    const opts = lastOptions(setOptions);
    expect(opts.title).toBe('Home');
    expect(opts.headerBackVisible).toBe(true);
    expect(opts.headerTitle).toBeUndefined();
    expect(opts.headerRight).toBeUndefined();
    expect(opts.headerLeft).toBeUndefined();
  });

  it('renders a composed headerTitle when a subtitle is present (no plain title)', async () => {
    const { nav, setOptions } = fakeNav();
    await renderHook(() =>
      useNavBar({ navigation: nav, spec: { title: 'T', subtitle: 'S' } })
    );
    const opts = lastOptions(setOptions);
    expect(typeof opts.headerTitle).toBe('function');
    expect(opts.title).toBeUndefined();
  });

  it('maps actions to a headerRight render function', async () => {
    const { nav, setOptions } = fakeNav();
    await renderHook(() =>
      useNavBar({
        navigation: nav,
        spec: {
          title: 'T',
          actions: [{ id: 'a', label: 'A', onPress: vi.fn() }],
        },
      })
    );
    expect(typeof lastOptions(setOptions).headerRight).toBe('function');
  });

  it('hides the native back and draws a custom headerLeft when back.onPress is set', async () => {
    const { nav, setOptions } = fakeNav();
    await renderHook(() =>
      useNavBar({
        navigation: nav,
        spec: { title: 'T', back: { onPress: vi.fn() } },
      })
    );
    const opts = lastOptions(setOptions);
    expect(opts.headerBackVisible).toBe(false);
    expect(typeof opts.headerLeft).toBe('function');
  });

  it('hides the native back without a custom control when back.visible is false', async () => {
    const { nav, setOptions } = fakeNav();
    await renderHook(() =>
      useNavBar({
        navigation: nav,
        spec: { title: 'T', back: { visible: false } },
      })
    );
    const opts = lastOptions(setOptions);
    expect(opts.headerBackVisible).toBe(false);
    expect(opts.headerLeft).toBeUndefined();
  });

  it('hides the whole bar when hidden, and restores it on unmount', async () => {
    const { nav, setOptions } = fakeNav();
    const { unmount } = await renderHook(() =>
      useNavBar({ navigation: nav, spec: { title: 'T', hidden: true } })
    );
    expect(lastOptions(setOptions)).toEqual({ headerShown: false });
    unmount();
    expect(lastOptions(setOptions)).toEqual({ headerShown: true });
  });
});
