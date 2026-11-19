/**
 * @fileoverview Theme context and provider for React Native.
 *
 * Manages light/dark mode with automatic system detection via `useColorScheme()`.
 * Persists user preference to AsyncStorage and delays rendering until the
 * persisted theme is loaded (prevents theme flash on startup).
 *
 * Includes a subtle fade animation (250ms) when switching between light and dark
 * modes to provide a smooth visual transition.
 *
 * **Following the host's theme.** On the web the building blocks have no theme
 * state: they carry design-token classes and follow whatever the host document
 * is showing. Here the same is reached two ways:
 * - an app that keeps its own theme setting passes what it resolved as
 *   `colorScheme`, which then wins over this provider's stored preference and
 *   the device;
 * - a building block rendered with no `ThemeProvider` at all draws in the
 *   device's scheme (`useColorScheme()`, which NativeWind's `colorScheme.set()`
 *   drives on iOS/Android) instead of throwing.
 * Either way the palette is the host's active `@sudobility/design` theme.
 *
 * Hooks:
 * - `useTheme()` - throws if no ThemeProvider is present
 * - `useThemeSafe()` - returns null if no ThemeProvider is present
 * - `useThemeColors()` / `useResolvedColorScheme()` - never throw; what every
 *   component in this package styles itself with
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../types';
import { type ThemeColors, getThemeColors } from './colors';

const THEME_STORAGE_KEY = '@building_blocks/theme';

export interface ThemeContextValue {
  /** User's theme preference */
  theme: Theme;
  /** Resolved theme (light or dark) based on preference + system */
  resolvedTheme: 'light' | 'dark';
  /** Resolved color palette */
  colors: ThemeColors;
  /** Whether the resolved theme is dark */
  isDark: boolean;
  /** Update the theme preference */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Initial theme override (default: system) */
  initialTheme?: Theme;
  /** Custom storage key prefix */
  storageKeyPrefix?: string;
  /**
   * The scheme the host app resolved from its own theme setting. When given it
   * is what every building block draws in — it wins over this provider's stored
   * preference and over the device — so an app with a settings store of its own
   * passes `isDark ? 'dark' : 'light'` here and the two can never disagree.
   * Left out, the provider resolves its own preference as before.
   */
  colorScheme?: 'light' | 'dark';
}

export function ThemeProvider({
  children,
  initialTheme,
  storageKeyPrefix,
  colorScheme,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? Theme.SYSTEM);
  const [loaded, setLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const storageKey = storageKeyPrefix
    ? `${storageKeyPrefix}/${THEME_STORAGE_KEY}`
    : THEME_STORAGE_KEY;

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(stored => {
      if (stored && Object.values(Theme).includes(stored as Theme)) {
        setThemeState(stored as Theme);
      }
      setLoaded(true);
    });
  }, [storageKey]);

  const resolvedTheme = useMemo((): 'light' | 'dark' => {
    // The host's own resolved scheme, when it gives one, is the answer.
    if (colorScheme) {
      return colorScheme;
    }
    if (theme === Theme.SYSTEM) {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return theme === Theme.DARK ? 'dark' : 'light';
  }, [colorScheme, theme, systemColorScheme]);

  // Track previous resolved theme for animation
  const prevResolvedThemeRef = useRef(resolvedTheme);

  useEffect(() => {
    if (loaded && prevResolvedThemeRef.current !== resolvedTheme) {
      prevResolvedThemeRef.current = resolvedTheme;
      // Desktop (react-native-macos / -windows) has no native driver for this
      // animation: it never finishes there, leaving the whole app at 0.7
      // opacity (washed out over the window background) after a theme switch.
      // Only fade where the native driver exists, and always land on 1.
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        fadeAnim.setValue(1);
        return;
      }
      fadeAnim.setValue(0.7);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => fadeAnim.setValue(1));
    }
  }, [resolvedTheme, loaded, fadeAnim]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      AsyncStorage.setItem(storageKey, newTheme);
    },
    [storageKey]
  );

  // The host's active design theme, not a fixed palette (see `getThemeColors`).
  const colors = getThemeColors(resolvedTheme);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      colors,
      isDark: resolvedTheme === 'dark',
      setTheme,
    }),
    [theme, resolvedTheme, colors, setTheme]
  );

  // Don't render children until we've loaded the persisted theme — unless the
  // host supplies the scheme, in which case the stored preference cannot change
  // what is drawn and there is nothing to wait for.
  if (!loaded && !colorScheme) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context.
 * Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Safely access theme context.
 * Returns null if not within a ThemeProvider.
 */
export function useThemeSafe(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

/**
 * The scheme building blocks draw in: the `ThemeProvider`'s when there is one,
 * otherwise the device's. Never throws.
 */
export function useResolvedColorScheme(): 'light' | 'dark' {
  const context = useContext(ThemeContext);
  const systemColorScheme = useColorScheme();
  return (
    context?.resolvedTheme ?? (systemColorScheme === 'dark' ? 'dark' : 'light')
  );
}

/**
 * The colours building blocks draw in: the `ThemeProvider`'s when there is one,
 * otherwise the host's active design theme in the device's scheme. Never
 * throws — a component styled through this (every one in this package, via
 * `createThemedStyles`) renders with or without a `ThemeProvider`, as the web
 * components do.
 */
export function useThemeColors(): ThemeColors {
  const context = useContext(ThemeContext);
  const systemColorScheme = useColorScheme();
  return (
    context?.colors ??
    getThemeColors(systemColorScheme === 'dark' ? 'dark' : 'light')
  );
}
