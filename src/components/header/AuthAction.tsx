/**
 * @fileoverview Auth-action header adapter for React Native — the RN counterpart
 * of the web building_blocks topbar `AuthActionView`/`createAuthAction`.
 *
 * Designed for `AppHeader`'s account slot: a "Log in" button when signed out,
 * else an avatar that opens a small menu (the passed `menuItems` plus a
 * sign-out entry). Provider-agnostic — bind it to an app's `useAuth` with
 * {@link createAuthAction}, or render {@link AuthActionView} directly.
 *
 * The props are the web's (`signOutLabel`, `accountLabel`, `loginButtonText`,
 * `avatarSize`, `menuItems`), with `onPress` where the web has `onClick`. The
 * `labels` object is this package's earlier way of passing the same three
 * strings and still works.
 */
import React, { useState, type ComponentType, type ReactNode } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { createThemedStyles } from '../../utils/styles';

/**
 * The minimal user shape `AuthActionView` reads. Every app's `useAuth()` exposes
 * at least these, so a consolidated component can stay decoupled from any single
 * app's auth provider.
 */
export interface AuthActionUser {
  displayName?: string | null;
  email?: string | null;
}

/** An entry of the signed-in menu — the web's `AuthMenuItem`. */
export interface AuthMenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon element shown before the label */
  icon?: ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Show divider after this item */
  dividerAfter?: boolean;
}

/** This package's earlier name for {@link AuthMenuItem}. */
export type AuthActionMenuItem = AuthMenuItem;

/**
 * The three strings as one object — this package's earlier shape.
 *
 * @deprecated Pass `loginButtonText`, `signOutLabel` and `accountLabel`, as on
 * the web.
 */
export interface AuthActionLabels {
  /** Login button label. */
  login: string;
  /** Sign-out menu entry label. */
  signOut: string;
  /** Fallback display name. */
  account?: string;
}

/** What the header hands the auth action — the web's `AuthActionProps`. */
export interface AuthActionProps {
  /** Avatar size in pixels (default: 32) */
  avatarSize?: number;
  /** Login button press handler */
  onLoginPress?: () => void;
  /** Menu items for the signed-in menu, shown above sign-out */
  menuItems?: AuthMenuItem[];
  /** Custom login button text (default: 'Log in') */
  loginButtonText?: string;
}

export interface AuthActionViewProps extends AuthActionProps {
  /** The signed-in user, or null when signed out. */
  user: AuthActionUser | null;
  /** Called when the user picks "sign out". */
  onSignOut: () => void;
  /** Label for the appended sign-out menu entry (default: 'Sign out'). */
  signOutLabel?: string;
  /** Fallback display name when the user has neither displayName nor email. */
  accountLabel?: string;
  /** Override how the avatar is rendered (e.g. an uploaded photo). */
  renderAvatar?: (user: AuthActionUser) => ReactNode;
  /**
   * @deprecated Pass `loginButtonText`, `signOutLabel` and `accountLabel`.
   * When both are given, those win.
   */
  labels?: AuthActionLabels;
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function AuthActionView({
  user,
  onSignOut,
  onLoginPress,
  menuItems = [],
  avatarSize = 32,
  loginButtonText,
  signOutLabel,
  accountLabel,
  labels,
  renderAvatar,
}: AuthActionViewProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  const loginText = loginButtonText ?? labels?.login ?? 'Log in';
  const signOutText = signOutLabel ?? labels?.signOut ?? 'Sign out';
  const accountText = accountLabel ?? labels?.account ?? 'Account';

  if (!user) {
    return (
      <Pressable
        onPress={() => onLoginPress?.()}
        style={styles.loginButton}
        accessibilityRole='button'
        accessibilityLabel={loginText}
        testID='log-in-button'
      >
        <Text style={styles.loginText}>{loginText}</Text>
      </Pressable>
    );
  }

  const name = user.displayName ?? user.email ?? accountText;
  const close = () => setOpen(false);
  // A divider before sign-out, unless the last item already draws one.
  const lastItem = menuItems[menuItems.length - 1];
  const dividerBeforeSignOut = !!lastItem && !lastItem.dividerAfter;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole='button'
        accessibilityLabel={name}
        testID='account-menu'
      >
        {renderAvatar ? (
          renderAvatar(user)
        ) : (
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              },
            ]}
          >
            <Text style={styles.avatarText}>{initials(name)}</Text>
          </View>
        )}
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType='fade'
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <View style={styles.menu} accessibilityRole='menu'>
            {menuItems.map(m => (
              <React.Fragment key={m.id}>
                <Pressable
                  style={styles.menuItem}
                  accessibilityRole='menuitem'
                  onPress={() => {
                    close();
                    m.onPress?.();
                  }}
                >
                  {m.icon}
                  <Text style={styles.menuLabel}>{m.label}</Text>
                </Pressable>
                {m.dividerAfter && <View style={styles.divider} />}
              </React.Fragment>
            ))}
            {dividerBeforeSignOut && <View style={styles.divider} />}
            <Pressable
              style={styles.menuItem}
              accessibilityRole='menuitem'
              onPress={() => {
                close();
                onSignOut();
              }}
            >
              <Text style={styles.menuLabel}>{signOutText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export interface CreateAuthActionConfig {
  /** The app's auth hook — must return the signed-in user and a sign-out action. */
  useAuth: () => {
    user: AuthActionUser | null;
    signOut: () => void | Promise<void>;
  };
  /**
   * Optional hook returning the (reactive, e.g. i18n) labels. Called inside the
   * component so translations update with the language. `login` is this
   * package's addition: on the web the login text comes only from the header's
   * `loginButtonText`, which still wins here.
   */
  useLabels?: () => { signOut: string; account?: string; login?: string };
  /** Override how the avatar is rendered. */
  renderAvatar?: (user: AuthActionUser) => ReactNode;
}

/**
 * Bind {@link AuthActionView} to an app's `useAuth` (and optional label hook),
 * returning the `ComponentType<AuthActionProps>` a header expects as its
 * `AuthActionComponent` (see `AppHeaderWithFirebaseAuth`), or renders in
 * `AppHeader`'s account slot.
 *
 * @example
 * ```tsx
 * const AuthActionComponent = createAuthAction({
 *   useAuth,
 *   useLabels: () => { const { t } = useTranslation('common');
 *     return { signOut: t('nav.signOut'), account: t('nav.account') }; },
 * });
 * ```
 */
export function createAuthAction(
  config: CreateAuthActionConfig
): ComponentType<AuthActionProps> {
  const { useAuth, useLabels, renderAvatar } = config;
  return function AuthAction(props: AuthActionProps) {
    const { user, signOut } = useAuth();
    const labels = useLabels?.() ?? { signOut: 'Sign out', account: 'Account' };
    return (
      <AuthActionView
        {...props}
        loginButtonText={props.loginButtonText ?? labels.login}
        user={user}
        onSignOut={() => void signOut()}
        signOutLabel={labels.signOut}
        accountLabel={labels.account}
        renderAvatar={renderAvatar}
      />
    );
  };
}

const useStyles = createThemedStyles(colors => ({
  loginButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  loginText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  avatar: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingHorizontal: 12,
  },
  menu: {
    minWidth: 180,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuLabel: {
    color: colors.text,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
}));
