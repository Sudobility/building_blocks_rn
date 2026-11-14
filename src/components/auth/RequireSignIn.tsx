/**
 * @fileoverview RequireSignIn gate for React Native (mirror of the web
 * building_blocks `RequireSignIn`).
 *
 * Gates a screen that needs an account without navigating away: while auth
 * resolves it shows a spinner; signed out, it shows a short notice and opens the
 * app's shared sign-in flow; signed in, it renders the screen. Provider-agnostic
 * — pass `user`/`loading`/`openSignIn`/`closeSignIn` from the app's own contexts
 * (or use {@link createRequireSignIn}).
 */
import React, { useEffect, type ComponentType } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { createThemedStyles } from '../../utils/styles';

export interface RequireSignInNotice {
  /** Optional heading. Omit for apps whose notice is body + button only. */
  title?: string;
  body: string;
  button: string;
}

export interface RequireSignInProps {
  children: React.ReactNode;
  /** The signed-in user (any truthy value counts as signed in). */
  user: unknown;
  /** Whether auth is still resolving. */
  loading: boolean;
  /** Override the "signed in" test (default: `Boolean(user)`). */
  isSignedIn?: boolean;
  /** Open the shared sign-in flow (needed only for the built-in notice). */
  openSignIn?: (onSuccess?: () => void) => void;
  /** Close the shared sign-in flow (called on unmount if provided). */
  closeSignIn?: () => void;
  /** What to show while auth resolves (default: a centered spinner). */
  loadingFallback?: React.ReactNode;
  /** Copy for the built-in signed-out notice (ignored when `signedOut` is given). */
  notice?: RequireSignInNotice;
  /**
   * Render the signed-out state yourself instead of the built-in notice — for
   * RN apps whose signed-out screen embeds its own `SignInModal` (and whose
   * tests assert that modal). When given, `openSignIn`/`notice` are not used.
   */
  signedOut?: React.ReactNode;
}

export function RequireSignIn({
  children,
  user,
  loading,
  isSignedIn,
  openSignIn,
  closeSignIn,
  loadingFallback,
  notice,
  signedOut,
}: RequireSignInProps) {
  const styles = useStyles();
  const signedIn = isSignedIn ?? Boolean(user);

  if (loading) {
    return (
      <>
        {loadingFallback ?? (
          <View style={styles.center}>
            <ActivityIndicator size='large' />
          </View>
        )}
      </>
    );
  }
  if (signedIn) return <>{children}</>;
  // App-provided signed-out UI (e.g. a screen that embeds its own modal).
  if (signedOut !== undefined) return <>{signedOut}</>;
  // Built-in notice (requires openSignIn + notice copy).
  if (openSignIn && notice) {
    return (
      <SignedOutNotice
        openSignIn={openSignIn}
        closeSignIn={closeSignIn}
        notice={notice}
      />
    );
  }
  return null;
}

function SignedOutNotice({
  openSignIn,
  closeSignIn,
  notice,
}: {
  openSignIn: (onSuccess?: () => void) => void;
  closeSignIn?: () => void;
  notice: RequireSignInNotice;
}) {
  const styles = useStyles();
  useEffect(() => {
    openSignIn();
    return () => closeSignIn?.();
  }, [openSignIn, closeSignIn]);

  return (
    <View style={styles.center} accessibilityLabel='signed-out-notice'>
      {notice.title ? <Text style={styles.title}>{notice.title}</Text> : null}
      <Text style={styles.body}>{notice.body}</Text>
      <Pressable
        onPress={() => openSignIn()}
        style={styles.button}
        accessibilityRole='button'
      >
        <Text style={styles.buttonText}>{notice.button}</Text>
      </Pressable>
    </View>
  );
}

export interface CreateRequireSignInConfig {
  useAuth: () => { user: unknown; loading: boolean };
  useSignIn: () => {
    openSignIn: (onSuccess?: () => void) => void;
    closeSignIn?: () => void;
  };
  /** Hook returning the (reactive, e.g. i18n) notice copy. */
  useText: () => RequireSignInNotice;
  /** Override the "signed in" test, given the current user. */
  isSignedIn?: (user: unknown) => boolean;
  loadingFallback?: React.ReactNode;
}

/** Bind {@link RequireSignIn} to an app's auth + sign-in contexts and copy. */
export function createRequireSignIn(
  config: CreateRequireSignInConfig
): ComponentType<{ children: React.ReactNode }> {
  const { useAuth, useSignIn, useText, isSignedIn, loadingFallback } = config;
  return function Gate({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const { openSignIn, closeSignIn } = useSignIn();
    const notice = useText();
    return (
      <RequireSignIn
        user={user}
        loading={loading}
        isSignedIn={isSignedIn ? isSignedIn(user) : undefined}
        openSignIn={openSignIn}
        closeSignIn={closeSignIn}
        loadingFallback={loadingFallback}
        notice={notice}
      >
        {children}
      </RequireSignIn>
    );
  };
}

const useStyles = createThemedStyles(colors => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.invertedText,
    fontSize: 15,
    fontWeight: '600',
  },
}));
