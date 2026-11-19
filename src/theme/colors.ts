/**
 * @fileoverview Color palette and theme color definitions for React Native.
 *
 * Defines the color palette (matching Tailwind CSS color tokens), the
 * `ThemeColors` interface, and the light and dark theme color objects.
 *
 * The web package has no palette of its own: its components carry Tailwind
 * token classes (`bg-primary`, `text-muted-foreground`) that resolve against
 * whatever `@sudobility/design` theme the host configured. `getThemeColors()`
 * is the same thing for StyleSheet styles — it reads the theme the host passed
 * to `configureTheme()`, so a building block draws the host's primary rather
 * than the default theme's.
 */

import { getActiveTheme } from '@sudobility/design';
import type { ThemeTokens } from '@sudobility/design';
import { defaultTheme } from '@sudobility/design/themes';

/**
 * Convert a design-system HSL token ("H S% L%") to a hex string. React Native's
 * color parser cannot read space-separated `hsl()` (CSS Color 4) syntax, so the
 * theme is resolved to hex at module load. `lOverride` produces tint variants
 * (e.g. error/success backgrounds) from the same hue, keeping them theme-derived
 * rather than hardcoded.
 */
function hslToHex(token: string, lOverride?: number): string {
  const [h, s, l] = token.replace(/%|deg/g, '').trim().split(/\s+/).map(Number);
  const L = (lOverride ?? l) / 100;
  const S = s / 100;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// The palette's semantic singles are the default design theme's; the live
// theme colours (`getThemeColors`) follow whichever theme the host configured.
const L = defaultTheme.light;

export const palette = {
  // Numeric primary/gray scales are a raw Tailwind reference ramp kept for
  // fine-grained shades (hover tints, subtle borders). The design system
  // exposes only single semantic tokens (no numeric scale), so these stay as a
  // decorative reference scale; the live theme below derives from defaultTheme.
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Semantic singles map 1:1 to design-system tokens and are derived from them.
  success: hslToHex(L.success),
  error: hslToHex(L.destructive),
  warning: hslToHex(L.warning),
  info: hslToHex(L.info),
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export interface ThemeColors {
  primary: string;
  /** Text and icons drawn on `primary` (a primary button's label). */
  primaryForeground: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  notification: string;
  surface: string;
  surfaceSecondary: string;
  error: string;
  errorBg: string;
  success: string;
  successBg: string;
  successText: string;
  warning: string;
  info: string;
  /** The info alert's fill — the web's `bg-info/10`. */
  infoBg: string;
  /** The info alert's border — the web's `border-info/30`. */
  infoBorder: string;
  invertedText: string;
  invertedBackground: string;
}

/** A design-system theme's two palettes — all `getThemeColors` reads of one. */
type ThemePalettes = { light: ThemeTokens; dark: ThemeTokens };

/** `#rrggbb` with an alpha channel appended, like a Tailwind `/10` modifier. */
function withAlpha(hex: string, alpha: number): string {
  const channel = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${channel}`;
}

/**
 * The colours of one scheme of a design-system theme. A token the theme leaves
 * out falls back to the default theme's, so a partial theme draws rather than
 * throws.
 */
function buildThemeColors(
  scheme: 'light' | 'dark',
  theme: ThemePalettes
): ThemeColors {
  const dark = scheme === 'dark';
  const token = (from: 'light' | 'dark', key: keyof ThemeTokens): string =>
    theme[from]?.[key] ?? defaultTheme[from][key] ?? defaultTheme.light[key]!;
  const own = (key: keyof ThemeTokens, l?: number) =>
    hslToHex(token(scheme, key), l);
  const other = (key: keyof ThemeTokens) =>
    hslToHex(token(dark ? 'light' : 'dark', key));

  return {
    primary: own('primary'),
    primaryForeground: own('primaryForeground'),
    background: own('background'),
    card: own('card'),
    text: own('foreground'),
    textSecondary: own('mutedForeground'),
    textMuted: own('mutedForeground', dark ? 50 : 60),
    border: own('border'),
    notification: own('destructive'),
    surface: own('card'),
    surfaceSecondary: own('muted'),
    error: own('destructive'),
    errorBg: own('destructive', dark ? 14 : 96),
    success: own('success'),
    successBg: own('success', dark ? 14 : 92),
    successText: dark ? own('success', 70) : own('success'),
    warning: own('warning'),
    info: own('info'),
    infoBg: withAlpha(own('info'), 0.1),
    infoBorder: withAlpha(own('info'), 0.3),
    invertedText: other('foreground'),
    invertedBackground: other('background'),
  };
}

/** The default design theme's light palette. */
export const lightColors: ThemeColors = buildThemeColors('light', defaultTheme);

/** The default design theme's dark palette. */
export const darkColors: ThemeColors = buildThemeColors('dark', defaultTheme);

const paletteCache = new WeakMap<
  object,
  { light: ThemeColors; dark: ThemeColors }
>();

/**
 * The colours for `scheme` in the host's active `@sudobility/design` theme —
 * the one it passed to `configureTheme()` — or in the default theme when none
 * is configured (or the design system is a test stub without
 * `getActiveTheme`). Answers the same object for the same theme and scheme, so
 * it is safe as a memo dependency.
 */
export function getThemeColors(scheme: 'light' | 'dark'): ThemeColors {
  const active =
    typeof getActiveTheme === 'function'
      ? (getActiveTheme() as ThemePalettes | null)
      : null;
  if (!active || active === (defaultTheme as ThemePalettes)) {
    return scheme === 'dark' ? darkColors : lightColors;
  }
  let palettes = paletteCache.get(active);
  if (!palettes) {
    palettes = {
      light: buildThemeColors('light', active),
      dark: buildThemeColors('dark', active),
    };
    paletteCache.set(active, palettes);
  }
  return palettes[scheme];
}
