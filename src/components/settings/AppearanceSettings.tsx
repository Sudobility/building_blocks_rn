/**
 * @fileoverview Appearance settings for React Native — the counterpart of
 * `AppearanceSettings` in `@sudobility/building_blocks`.
 *
 * The web's sections in the web's order and wording: the heading and its
 * description, the theme setting and the font size setting (each a label, the
 * choices, and a line of help), and the "About Settings" information box. The
 * choices are a segmented control where the web has a dropdown; the
 * translation keys are the web's (`AppearanceSettingsTranslations`), so one set
 * of translations serves both.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Theme, FontSize } from '../../types';
import { createThemedStyles } from '../../utils/styles';

/**
 * Translation keys used by AppearanceSettings — the web's, key for key.
 * Provide a translation function to customize labels.
 */
export interface AppearanceSettingsTranslations {
  heading: string;
  description: string;
  themeLabel: string;
  /** Unused here: a segmented control has no placeholder. Kept for parity. */
  themeSelectPlaceholder: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  themeDescription: string;
  fontSizeLabel: string;
  /** Unused here: a segmented control has no placeholder. Kept for parity. */
  fontSizeSelectPlaceholder: string;
  fontSizeSmall: string;
  fontSizeMedium: string;
  fontSizeLarge: string;
  fontSizeDescription: string;
  infoHeading: string;
  infoDescription: string;
}

const defaultTranslations: AppearanceSettingsTranslations = {
  heading: 'Appearance',
  description: 'Customize the look and feel of the application.',
  themeLabel: 'Theme',
  themeSelectPlaceholder: 'Select theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',
  themeDescription: 'Choose your preferred color theme.',
  fontSizeLabel: 'Font Size',
  fontSizeSelectPlaceholder: 'Select font size',
  fontSizeSmall: 'Small',
  fontSizeMedium: 'Medium',
  fontSizeLarge: 'Large',
  fontSizeDescription: 'Adjust the text size for better readability.',
  infoHeading: 'About Settings',
  infoDescription:
    'Your appearance preferences are saved locally and will be applied automatically on your next visit.',
};

export interface AppearanceSettingsProps {
  /** Current theme value */
  theme: Theme | string;
  /** Current font size value */
  fontSize: FontSize | string;
  /** Callback when theme changes */
  onThemeChange: (theme: Theme) => void;
  /** Callback when font size changes */
  onFontSizeChange: (fontSize: FontSize) => void;
  /**
   * Optional translation function. Called with a key from
   * `AppearanceSettingsTranslations` and its English fallback, as on the web.
   */
  t?: (key: string, fallback?: string) => string;
  /** Optional style for the container */
  style?: StyleProp<ViewStyle>;
  /** Whether to show the information box at the bottom (default: true) */
  showInfoBox?: boolean;
}

type TranslationKey = keyof AppearanceSettingsTranslations;

const THEME_OPTIONS: Array<{ value: Theme; labelKey: TranslationKey }> = [
  { value: Theme.LIGHT, labelKey: 'themeLight' },
  { value: Theme.DARK, labelKey: 'themeDark' },
  { value: Theme.SYSTEM, labelKey: 'themeSystem' },
];

const FONT_SIZE_OPTIONS: Array<{ value: FontSize; labelKey: TranslationKey }> =
  [
    { value: FontSize.SMALL, labelKey: 'fontSizeSmall' },
    { value: FontSize.MEDIUM, labelKey: 'fontSizeMedium' },
    { value: FontSize.LARGE, labelKey: 'fontSizeLarge' },
  ];

/**
 * AppearanceSettings - theme and font size settings.
 *
 * @example
 * ```tsx
 * <AppearanceSettings
 *   theme={theme}
 *   fontSize={fontSize}
 *   onThemeChange={setTheme}
 *   onFontSizeChange={setFontSize}
 *   t={(key, fallback) => t(`appearance.${key}`, fallback)}
 * />
 * ```
 */
export function AppearanceSettings({
  theme,
  fontSize,
  onThemeChange,
  onFontSizeChange,
  t,
  style,
  showInfoBox = true,
}: AppearanceSettingsProps) {
  const styles = useStyles();
  // Helper to get translated string with fallback
  const getText = (key: TranslationKey): string => {
    const fallback = defaultTranslations[key];
    return t ? (t(key, fallback) ?? fallback) : fallback;
  };

  const segmented = <V extends string>(
    label: string,
    options: Array<{ value: V; labelKey: TranslationKey }>,
    selected: string,
    onChange: (value: V) => void
  ) => (
    <View
      style={styles.segmentedControl}
      accessibilityRole='radiogroup'
      accessibilityLabel={label}
    >
      {options.map(option => {
        const isSelected = selected === option.value;
        const optionLabel = getText(option.labelKey);
        return (
          <Pressable
            key={option.value}
            style={[styles.segment, isSelected && styles.segmentActive]}
            onPress={() => onChange(option.value)}
            accessibilityRole='radio'
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={optionLabel}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextActive,
              ]}
            >
              {optionLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <View>
        <Text style={styles.heading} accessibilityRole='header'>
          {getText('heading')}
        </Text>
        <Text style={styles.description}>{getText('description')}</Text>
      </View>

      {/* Theme Setting */}
      <View style={styles.setting}>
        <Text style={styles.label}>{getText('themeLabel')}</Text>
        {segmented(getText('themeLabel'), THEME_OPTIONS, theme, onThemeChange)}
        <Text style={styles.help}>{getText('themeDescription')}</Text>
      </View>

      {/* Font Size Setting */}
      <View style={styles.setting}>
        <Text style={styles.label}>{getText('fontSizeLabel')}</Text>
        {segmented(
          getText('fontSizeLabel'),
          FONT_SIZE_OPTIONS,
          fontSize,
          onFontSizeChange
        )}
        <Text style={styles.help}>{getText('fontSizeDescription')}</Text>
      </View>

      {/* Information Box */}
      {showInfoBox && (
        <View style={styles.infoBox}>
          <Text style={styles.infoHeading}>{getText('infoHeading')}</Text>
          <Text style={styles.infoText}>{getText('infoDescription')}</Text>
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  // The web's `space-y-6`: 24 between the heading, each setting and the box.
  container: {
    padding: 16,
    gap: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  // The web's `space-y-2`: 8 between a setting's label, control and help.
  setting: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  help: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  // The web's info alert: info-tinted fill and border, info text.
  infoBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    backgroundColor: colors.infoBg,
  },
  infoHeading: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.info,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.info,
  },
}));
