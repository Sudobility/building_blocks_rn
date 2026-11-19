/**
 * @fileoverview Following the host's theme: the scheme it resolved, the design
 * theme it configured, and no provider at all.
 */
import React from 'react';
import { Text } from 'react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureTheme } from '@sudobility/design';
import { defaultTheme } from '@sudobility/design/themes';
import { renderHook, renderHookSync, render } from './test-utils';
import {
  ThemeProvider,
  useResolvedColorScheme,
  useTheme,
  useThemeColors,
} from '../theme/ThemeContext';
import { darkColors, getThemeColors, lightColors } from '../theme/colors';
import { createThemedStyles } from '../utils/styles';
import { Theme } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { __setColorScheme } from 'react-native';

const wrapperWith =
  (props: Partial<React.ComponentProps<typeof ThemeProvider>>) =>
  ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider {...props}>{children}</ThemeProvider>
  );

describe('ThemeProvider colorScheme (the scheme the host resolved)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    __setColorScheme('light');
  });

  it('wins over the device', async () => {
    __setColorScheme('light');
    const { result } = await renderHook(() => useTheme(), {
      wrapper: wrapperWith({ colorScheme: 'dark' }),
    });
    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toBe(darkColors);
  });

  it("wins over this provider's own stored preference", async () => {
    AsyncStorage.getItem.mockResolvedValue(Theme.DARK);
    const { result } = await renderHook(() => useTheme(), {
      wrapper: wrapperWith({ colorScheme: 'light' }),
    });
    // The preference is still loaded and reported; it just does not decide.
    expect(result.current.theme).toBe(Theme.DARK);
    expect(result.current.resolvedTheme).toBe('light');
    expect(result.current.colors).toBe(lightColors);
  });

  it('follows the host when it changes its mind', async () => {
    const seen: string[] = [];
    const Probe = () => {
      seen.push(useTheme().resolvedTheme);
      return null;
    };
    const view = await render(
      <ThemeProvider colorScheme='light'>
        <Probe />
      </ThemeProvider>
    );
    await view.rerender(
      <ThemeProvider colorScheme='dark'>
        <Probe />
      </ThemeProvider>
    );
    expect(seen[0]).toBe('light');
    expect(seen[seen.length - 1]).toBe('dark');
  });

  it('does not hold the first render back for a preference that cannot matter', async () => {
    // A stored preference that never arrives.
    AsyncStorage.getItem.mockReturnValue(new Promise(() => {}));

    const waiting = await render(
      <ThemeProvider>
        <Text>app</Text>
      </ThemeProvider>
    );
    expect(waiting.queryByText('app')).toBeNull();

    const given = await render(
      <ThemeProvider colorScheme='dark'>
        <Text>app</Text>
      </ThemeProvider>
    );
    expect(given.getByText('app')).toBeTruthy();
  });
});

describe('with no ThemeProvider', () => {
  beforeEach(() => {
    __setColorScheme('light');
  });

  it("draws in the device's scheme instead of throwing", () => {
    const light = renderHookSync(() => ({
      colors: useThemeColors(),
      scheme: useResolvedColorScheme(),
    }));
    expect(light.result.current.colors).toBe(lightColors);
    expect(light.result.current.scheme).toBe('light');

    __setColorScheme('dark');
    const dark = renderHookSync(() => ({
      colors: useThemeColors(),
      scheme: useResolvedColorScheme(),
    }));
    expect(dark.result.current.colors).toBe(darkColors);
    expect(dark.result.current.scheme).toBe('dark');
  });

  it('createThemedStyles works, which is what every component here uses', () => {
    __setColorScheme('dark');
    const useStyles = createThemedStyles(colors => ({
      box: { backgroundColor: colors.background },
    }));
    const { result } = renderHookSync(() => useStyles());
    expect(result.current.box.backgroundColor).toBe(darkColors.background);
  });
});

describe("getThemeColors (the host's active design theme)", () => {
  afterEach(() => {
    configureTheme(defaultTheme);
  });

  it('is the default theme when that is what is active', () => {
    configureTheme(defaultTheme);
    expect(getThemeColors('light')).toBe(lightColors);
    expect(getThemeColors('dark')).toBe(darkColors);
  });

  it("draws the host's primary, not the default theme's", () => {
    const hostTheme = {
      ...defaultTheme,
      name: 'host',
      light: {
        ...defaultTheme.light,
        primary: '0 100% 50%',
        primaryForeground: '0 0% 100%',
      },
      dark: { ...defaultTheme.dark, primary: '120 100% 25%' },
    };
    configureTheme(hostTheme);

    const light = getThemeColors('light');
    expect(light.primary).toBe('#ff0000');
    expect(light.primaryForeground).toBe('#ffffff');
    expect(getThemeColors('dark').primary).toBe('#008000');
    // What the host did not change is unchanged.
    expect(light.background).toBe(lightColors.background);
    // The same object each time, so it can be a memo dependency.
    expect(getThemeColors('light')).toBe(light);
  });

  it('reaches components through the provider and through no provider', async () => {
    configureTheme({
      ...defaultTheme,
      name: 'host',
      light: { ...defaultTheme.light, primary: '0 100% 50%' },
    });
    __setColorScheme('light');

    expect(renderHookSync(() => useThemeColors()).result.current.primary).toBe(
      '#ff0000'
    );

    AsyncStorage.getItem.mockResolvedValue(null);
    const { result } = await renderHook(() => useTheme(), {
      wrapper: wrapperWith({}),
    });
    expect(result.current.colors.primary).toBe('#ff0000');
  });
});
