/**
 * @fileoverview Themed style utilities for React Native.
 *
 * Provides `createThemedStyles()`, the standard pattern for creating
 * theme-reactive StyleSheet objects used by every component in this package.
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Create a hook that generates themed styles.
 *
 * Returns a custom hook that, when called inside a component, produces
 * a memoized `StyleSheet` object derived from the current theme colors.
 * Styles recompute only when the theme changes (light/dark switch). The hook
 * works with or without a `ThemeProvider` (see `useThemeColors`).
 *
 * @param factory - Function that receives `ThemeColors` and returns a style object
 * @returns A React hook that returns the themed StyleSheet
 *
 * @example
 * ```tsx
 * const useStyles = createThemedStyles((colors) => ({
 *   container: { backgroundColor: colors.background },
 *   text: { color: colors.text },
 * }));
 *
 * function MyComponent() {
 *   const styles = useStyles();
 *   return <View style={styles.container}><Text style={styles.text}>Hello</Text></View>;
 * }
 * ```
 */
export function createThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ThemeColors) => T
) {
  return function useStyles(): T {
    // Not `useTheme()`: that throws without a ThemeProvider, and an app with a
    // theme of its own (it never mounts ours) must still be able to render a
    // building block.
    const colors = useThemeColors();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
