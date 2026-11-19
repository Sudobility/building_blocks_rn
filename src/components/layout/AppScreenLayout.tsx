/**
 * @fileoverview Screen layout wrapper component for React Native — the
 * counterpart of `AppPageLayout` in `@sudobility/building_blocks`.
 *
 * Provides a SafeAreaView (top, left, right edges) with optional header/footer
 * slots, scrollable (default) or fixed content mode, and the web's page
 * options: the content's max width, its padding, and the background variant.
 */
import React from 'react';
import { View, ScrollView } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BackgroundVariant, ContentPadding, MaxWidth } from '../../types';
import { createThemedStyles } from '../../utils/styles';

export interface AppScreenLayoutProps {
  children: React.ReactNode;
  /** Optional header component (rendered above scroll content) */
  header?: React.ReactNode;
  /** Optional footer component (rendered below scroll content) */
  footer?: React.ReactNode;
  /** Whether to wrap content in a ScrollView (default: true) */
  scrollable?: boolean;
  /**
   * Max width for the content area (default: '5xl' — 1024). Narrower windows
   * are unaffected; on a tablet or desktop the content is capped at a readable
   * line length and centred. Pass 'full' to remove the cap.
   */
  maxWidth?: MaxWidth;
  /** Content padding (default: 'md') */
  contentPadding?: ContentPadding;
  /**
   * Background variant. 'gradient' is drawn as 'default': React Native has no
   * gradient without a native dependency this package does not take.
   */
  background?: BackgroundVariant;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Custom content style */
  contentStyle?: StyleProp<ViewStyle>;
}

/** The web's `max-w-*` widths, in logical pixels. */
const maxWidthMap: Record<MaxWidth, number | undefined> = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  '2xl': 672,
  '4xl': 896,
  '5xl': 1024,
  '7xl': 1280,
  full: undefined,
};

/**
 * The web's content padding: 16 at the sides for every size but 'none'
 * (`px-4`), and 24 / 32 / 48 above and below (`py-6` / `py-8` / `py-12`).
 */
const paddingMap: Record<
  ContentPadding,
  { paddingHorizontal: number; paddingVertical: number }
> = {
  none: { paddingHorizontal: 0, paddingVertical: 0 },
  sm: { paddingHorizontal: 16, paddingVertical: 24 },
  md: { paddingHorizontal: 16, paddingVertical: 32 },
  lg: { paddingHorizontal: 16, paddingVertical: 48 },
};

export function AppScreenLayout({
  children,
  header,
  footer,
  scrollable = true,
  maxWidth = '5xl',
  contentPadding = 'md',
  background = 'default',
  style,
  contentStyle,
}: AppScreenLayoutProps) {
  const styles = useStyles();

  const backgroundStyle =
    background === 'white' ? styles.bgWhite : styles.bgDefault;

  const content = (
    <View
      style={[
        styles.content,
        paddingMap[contentPadding],
        { maxWidth: maxWidthMap[maxWidth], flex: scrollable ? undefined : 1 },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, backgroundStyle, style]}
      edges={['top', 'left', 'right']}
    >
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.fixedContent}>{content}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles(colors => ({
  container: {
    flex: 1,
  },
  bgDefault: {
    backgroundColor: colors.background,
  },
  bgWhite: {
    backgroundColor: colors.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Centred, so a capped width sits in the middle of a wide window.
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  fixedContent: {
    flex: 1,
  },
}));
