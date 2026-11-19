/**
 * @fileoverview App header bar component for React Native — the counterpart
 * of `AppTopBar` in `@sudobility/building_blocks`.
 *
 * The web's sections in the web's order: the logo and app name on the left,
 * an optional center section, then the actions on the right — the menu items,
 * the language selector and the account section. A phone header has no room
 * for a row of labelled links, so the menu items are icon buttons, and there
 * is no hamburger menu or sticky positioning (a screen's navigation is its tab
 * bar and stack).
 *
 * Also provides `AppHeaderWithFirebaseAuth` (the web's
 * `AppTopBarWithFirebaseAuth`) and a `createAppHeaderOptions()` helper for
 * React Navigation integration.
 */
import React, { type ComponentType } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MenuItemConfig, LogoConfig, LanguageConfig } from '../../types';
import { useThemeColors } from '../../theme/ThemeContext';
import {
  LanguageSelector,
  type LanguageSelectorProps,
} from '../settings/LanguagePicker';
import type { AuthActionProps, AuthMenuItem } from './AuthAction';

export interface AppHeaderProps {
  /** Logo configuration */
  logo: LogoConfig;
  /** Menu items (shown as icon buttons on the right) */
  menuItems?: MenuItemConfig[];
  /** Available languages for selector (defaults to the built-in languages) */
  languages?: LanguageConfig[];
  /** Current language code */
  currentLanguage?: string;
  /**
   * Language change handler. The language selector is shown when this is
   * given: without it the selector could change nothing.
   */
  onLanguageChange?: (languageCode: string) => void;
  /** Hide language selector */
  hideLanguageSelector?: boolean;
  /** Language selector props override */
  languageSelectorProps?: Partial<LanguageSelectorProps>;
  /** Render prop for account/auth section (right side of the header) */
  renderAccountSection?: () => React.ReactNode;
  /** Render prop for center section (e.g., search bar) */
  renderCenterSection?: () => React.ReactNode;
  /** Optional left section (e.g., back button) — replaces the logo */
  renderLeft?: () => React.ReactNode;
  /**
   * Optional right section, after the account section. This package's earlier
   * name for the account slot; `renderAccountSection` is the web's.
   */
  renderRight?: () => React.ReactNode;
  /** Accessibility label for the header (default: 'Main navigation') */
  ariaLabel?: string;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
}

function LogoMark({ logo }: { logo: LogoConfig }) {
  const colors = useThemeColors();
  return (
    <>
      {logo.source && (
        <Image
          source={logo.source}
          style={styles.logoImage}
          resizeMode='contain'
          accessibilityLabel={logo.alt || logo.appName}
        />
      )}
      <Text style={[styles.appName, { color: colors.text }]}>
        {logo.appName}
      </Text>
    </>
  );
}

export function AppHeader({
  logo,
  menuItems,
  languages,
  currentLanguage = 'en',
  onLanguageChange,
  hideLanguageSelector = false,
  languageSelectorProps,
  renderAccountSection,
  renderCenterSection,
  renderLeft,
  renderRight,
  ariaLabel = 'Main navigation',
  style,
}: AppHeaderProps) {
  const colors = useThemeColors();
  const showLanguageSelector = !hideLanguageSelector && !!onLanguageChange;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        style,
      ]}
      accessibilityRole='header'
      accessibilityLabel={ariaLabel}
    >
      <View style={styles.leftSection}>
        {renderLeft ? (
          renderLeft()
        ) : (
          <Pressable
            onPress={logo.onPress}
            style={styles.logoContainer}
            accessibilityRole='button'
            accessibilityLabel={logo.appName}
          >
            <LogoMark logo={logo} />
          </Pressable>
        )}
      </View>

      {renderCenterSection && (
        <View style={styles.centerSection}>{renderCenterSection()}</View>
      )}

      <View style={styles.rightSection}>
        {menuItems
          ?.filter(item => item.show !== false)
          .map(item => {
            const IconComponent = item.icon;
            return (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                style={styles.menuButton}
                accessibilityRole='button'
                accessibilityLabel={item.label}
              >
                {IconComponent ? (
                  <IconComponent size={22} color={colors.textSecondary} />
                ) : (
                  <Text style={[styles.menuLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        {showLanguageSelector && (
          <LanguageSelector
            languages={languages}
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
            variant='compact'
            {...languageSelectorProps}
          />
        )}
        {renderAccountSection?.()}
        {renderRight?.()}
      </View>
    </View>
  );
}

export interface AppHeaderWithFirebaseAuthProps extends Omit<
  AppHeaderProps,
  'renderAccountSection'
> {
  /**
   * The auth action component for the account section — typically made with
   * `createAuthAction`. Passed in, as on the web, so the header depends on no
   * auth provider.
   */
  AuthActionComponent: ComponentType<AuthActionProps>;
  /** Additional menu items for authenticated users */
  authenticatedMenuItems?: AuthMenuItem[];
  /** Login button press handler */
  onLoginPress?: () => void;
  /** Avatar size in pixels */
  avatarSize?: number;
  /** Custom login button text */
  loginButtonText?: string;
}

/**
 * AppHeaderWithFirebaseAuth - the header with an auth action in its account
 * section. The counterpart of the web's `AppTopBarWithFirebaseAuth`.
 *
 * @example
 * ```tsx
 * const AuthAction = createAuthAction({ useAuth });
 *
 * <AppHeaderWithFirebaseAuth
 *   logo={{ appName: 'My App' }}
 *   AuthActionComponent={AuthAction}
 *   onLoginPress={() => navigation.navigate('Login')}
 *   authenticatedMenuItems={[
 *     { id: 'dashboard', label: 'Dashboard', onPress: openDashboard },
 *   ]}
 * />
 * ```
 */
export function AppHeaderWithFirebaseAuth({
  AuthActionComponent,
  authenticatedMenuItems = [],
  onLoginPress,
  avatarSize = 32,
  loginButtonText,
  ...headerProps
}: AppHeaderWithFirebaseAuthProps) {
  const renderAccountSection = () => (
    <AuthActionComponent
      avatarSize={avatarSize}
      onLoginPress={onLoginPress}
      menuItems={authenticatedMenuItems}
      loginButtonText={loginButtonText}
    />
  );

  return (
    <AppHeader {...headerProps} renderAccountSection={renderAccountSection} />
  );
}

function HeaderTitle({ logo }: { logo: LogoConfig }) {
  return (
    <View style={styles.logoContainer}>
      <LogoMark logo={logo} />
    </View>
  );
}

/**
 * Create React Navigation screen options from header config.
 * Useful for integrating AppHeader into a navigation stack.
 */
export function createAppHeaderOptions(config: {
  logo: LogoConfig;
  menuItems?: MenuItemConfig[];
  renderRight?: () => React.ReactNode;
}) {
  return {
    headerTitle: () => <HeaderTitle logo={config.logo} />,
    headerRight: config.renderRight
      ? () => <View style={styles.headerRightNav}>{config.renderRight!()}</View>
      : undefined,
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerRightNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginEnd: 8,
  },
});
