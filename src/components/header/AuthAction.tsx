/**
 * @fileoverview Auth-action header adapter for React Native — the RN counterpart
 * of the web building_blocks topbar `AuthActionView`/`createAuthAction`.
 *
 * Designed for `AppHeader`'s `renderRight` slot: a "Log in" button when signed
 * out, else an avatar that opens a small menu (the passed `menuItems` plus a
 * sign-out entry). Provider-agnostic — bind it to an app's `useAuth` with
 * {@link createAuthAction}, or render {@link AuthActionView} directly.
 */
import React, { useState, type ComponentType, type ReactNode } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { createThemedStyles } from '../../utils/styles';

export interface AuthActionUser {
  displayName?: string | null;
  email?: string | null;
}

export interface AuthActionMenuItem {
  id: string;
  label: string;
  onPress?: () => void;
  dividerAfter?: boolean;
}

export interface AuthActionLabels {
  /** Login button label. */
  login: string;
  /** Sign-out menu entry label. */
  signOut: string;
  /** Fallback display name. */
  account?: string;
}

export interface AuthActionViewProps {
  /** The signed-in user, or null when signed out. */
  user: AuthActionUser | null;
  /** Called when the user picks "sign out". */
  onSignOut: () => void;
  /** Called when the signed-out login button is pressed. */
  onLoginPress?: () => void;
  /** Menu entries shown above sign-out when signed in. */
  menuItems?: AuthActionMenuItem[];
  /** Labels (login / sign out / account fallback). */
  labels: AuthActionLabels;
  /** Override how the avatar is rendered (e.g. an uploaded photo). */
  renderAvatar?: (user: AuthActionUser) => ReactNode;
}

function initials(user: AuthActionUser, fallback: string): string {
  const base = user.displayName ?? user.email ?? fallback;
  return base.slice(0, 2).toUpperCase();
}

export function AuthActionView({
  user,
  onSignOut,
  onLoginPress,
  menuItems = [],
  labels,
  renderAvatar,
}: AuthActionViewProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Pressable
        onPress={() => onLoginPress?.()}
        style={styles.loginButton}
        accessibilityRole='button'
        accessibilityLabel={labels.login}
      >
        <Text style={styles.loginText}>{labels.login}</Text>
      </Pressable>
    );
  }

  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole='button'
        accessibilityLabel={labels.account ?? 'Account'}
      >
        {renderAvatar ? (
          renderAvatar(user)
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials(user, labels.account ?? '?')}
            </Text>
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
          <View style={styles.menu}>
            {menuItems.map(m => (
              <React.Fragment key={m.id}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    close();
                    m.onPress?.();
                  }}
                >
                  <Text style={styles.menuLabel}>{m.label}</Text>
                </Pressable>
                {m.dividerAfter && <View style={styles.divider} />}
              </React.Fragment>
            ))}
            {menuItems.length > 0 && <View style={styles.divider} />}
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                close();
                onSignOut();
              }}
            >
              <Text style={styles.menuLabel}>{labels.signOut}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export interface CreateAuthActionConfig {
  /** The app's auth hook — returns the signed-in user and a sign-out action. */
  useAuth: () => {
    user: AuthActionUser | null;
    signOut: () => void | Promise<void>;
  };
  /** Optional hook returning reactive (e.g. i18n) labels. */
  useLabels?: () => AuthActionLabels;
  /** Override how the avatar is rendered. */
  renderAvatar?: (user: AuthActionUser) => ReactNode;
}

export interface AuthActionProps {
  onLoginPress?: () => void;
  menuItems?: AuthActionMenuItem[];
}

/**
 * Bind {@link AuthActionView} to an app's `useAuth` (and optional label hook),
 * returning a component for `AppHeader`'s `renderRight` slot.
 */
export function createAuthAction(
  config: CreateAuthActionConfig
): ComponentType<AuthActionProps> {
  const { useAuth, useLabels, renderAvatar } = config;
  return function AuthAction(props: AuthActionProps) {
    const { user, signOut } = useAuth();
    const labels = useLabels?.() ?? {
      login: 'Log in',
      signOut: 'Sign out',
      account: 'Account',
    };
    return (
      <AuthActionView
        user={user}
        onSignOut={() => void signOut()}
        onLoginPress={props.onLoginPress}
        menuItems={props.menuItems}
        labels={labels}
        renderAvatar={renderAvatar}
      />
    );
  };
}

const useStyles = createThemedStyles(colors => ({
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  loginText: {
    color: colors.invertedText,
    fontSize: 14,
    fontWeight: '600',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
