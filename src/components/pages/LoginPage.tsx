/**
 * @fileoverview A full-screen sign-in page for React Native — the counterpart
 * of `LoginPage` in `@sudobility/building_blocks`.
 *
 * **The form is `LoginView` from `@sudobility/components-rn`** — the same view
 * `LoginModal` puts in a modal — so a page and a modal are one form, and a
 * change to it (password reset was the first) reaches both. What this adds is
 * the page around it: the subtle background, the logo, the app's name in the
 * page's colour, and a heading that follows the form's mode.
 *
 * Use it where somebody *goes to* sign in — a screen of its own. Where signing
 * in interrupts something they were doing, use `LoginModal` instead, which
 * leaves them where they were.
 *
 * Every colour is a design-token class drawn by a components-rn component
 * (`PageContainer`, `Heading`, `LoginView`), so the page follows the app's
 * NativeWind theme and needs no `ThemeProvider` from this package — and no
 * class is written here that an app's Tailwind would have to scan this package
 * to generate.
 */
import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  DEFAULT_LOGIN_VIEW_TEXT,
  Heading,
  LOGIN_VIEW_MAX_WIDTH,
  LoginView,
  PageContainer,
} from '@sudobility/components-rn';
import type {
  AppleLogoTone,
  LoginViewError,
  LoginViewMode,
  LoginViewText,
} from '@sudobility/components-rn';

/** Auth error info passed to `onAuthError`. */
export type AuthErrorInfo = LoginViewError;

/**
 * Color variant for the page's title and links — the web `LoginPage`'s, each
 * mapped to the same design token.
 */
export type LoginPageColorVariant =
  'primary' | 'blue' | 'indigo' | 'violet' | 'orange' | 'emerald' | 'rose';

/**
 * Text content for the LoginPage: the page's headings, and every string the
 * form (`LoginView`) shows.
 */
export interface LoginPageText extends LoginViewText {
  /** The heading while creating an account. */
  createAccount: string;
  /** The heading while signing in. */
  signInToAccount: string;
  /** The heading while sending a link to reset a password. */
  resetPassword: string;
}

const defaultText: LoginPageText = {
  ...DEFAULT_LOGIN_VIEW_TEXT,
  createAccount: 'Create your account',
  signInToAccount: 'Sign in to your account',
  resetPassword: 'Reset your password',
};

const colorVariantClasses: Record<
  LoginPageColorVariant,
  { title: string; link: string }
> = {
  primary: { title: 'text-primary', link: 'text-primary' },
  blue: { title: 'text-primary', link: 'text-primary' },
  indigo: { title: 'text-primary', link: 'text-primary' },
  violet: {
    title: 'text-accent-foreground',
    link: 'text-accent-foreground',
  },
  orange: { title: 'text-warning', link: 'text-warning' },
  emerald: { title: 'text-success', link: 'text-success' },
  rose: {
    title: 'text-secondary-foreground',
    link: 'text-secondary-foreground',
  },
};

/** Props for the LoginPage component. Provider-agnostic, as on the web. */
export interface LoginPageProps {
  /** Application name displayed as the main title */
  appName: string;
  /** Optional logo element to display above the title */
  logo?: ReactNode;
  /** Email/password sign-in; should throw on error. */
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  /**
   * Email/password sign-up; should throw on error. Creating an account is
   * offered only when this is given and `showSignUp` is true.
   */
  onEmailSignUp?: (email: string, password: string) => Promise<void>;
  /**
   * Sends a link to reset the password for an address; should throw on error.
   * "Forgot password?" is offered only when this is given.
   */
  onPasswordReset?: (email: string) => Promise<void>;
  /** Google sign-in; used only when `showGoogleSignIn` is true. */
  onGoogleSignIn?: () => Promise<void>;
  /** Apple sign-in; used only when `showAppleSignIn` is true. */
  onAppleSignIn?: () => Promise<void>;
  /** Callback fired on successful authentication */
  onSuccess: () => void;
  /**
   * Which form the page opens on (default: 'signIn') — a register screen
   * passes 'signUp'. A mode the page has no way to do opens on signing in.
   */
  initialMode?: LoginViewMode;
  /** Callback fired on auth errors - if provided, errors won't be shown inline */
  onAuthError?: (error: AuthErrorInfo) => void;
  /** Whether to show Google sign-in option (default: true) */
  showGoogleSignIn?: boolean;
  /** Whether to show Apple sign-in option (default: false) */
  showAppleSignIn?: boolean;
  /** Whether to show sign-up option (default: true) */
  showSignUp?: boolean;
  /** Custom text overrides for localization. Falls back to English defaults. */
  text?: Partial<LoginPageText>;
  /** Color variant for the title and links (default: 'primary'). */
  colorVariant?: LoginPageColorVariant;
  /**
   * Apple's mark in black or white. An app with a theme of its own passes
   * what that theme resolved to; left out, it follows the device.
   */
  appleLogoTone?: AppleLogoTone;
  /** Custom style for the page's content column */
  style?: StyleProp<ViewStyle>;
}

/**
 * A full-screen sign-in page: the app's name, a heading that says what the
 * form is doing, and the form, on the subtle page background — the web
 * `LoginPage`'s layout (`pt-12 pb-12 px-4`, `max-w-md`, `space-y-8`).
 *
 * @example
 * ```tsx
 * <LoginPage
 *   appName="My App"
 *   onEmailSignIn={signInWithEmail}
 *   onEmailSignUp={signUpWithEmail}
 *   onPasswordReset={sendPasswordResetEmail}
 *   onGoogleSignIn={signInWithGoogle}
 *   onSuccess={() => navigation.goBack()}
 * />
 * ```
 */
export function LoginPage({
  appName,
  logo,
  onEmailSignIn,
  onEmailSignUp,
  onPasswordReset,
  onGoogleSignIn,
  onAppleSignIn,
  onSuccess,
  onAuthError,
  initialMode = 'signIn',
  text: textOverrides,
  showGoogleSignIn = true,
  showAppleSignIn = false,
  showSignUp = true,
  colorVariant = 'primary',
  appleLogoTone,
  style,
}: LoginPageProps) {
  const canSignUp = showSignUp && !!onEmailSignUp;
  const [requestedMode, setMode] = useState<LoginViewMode>(initialMode);
  // The heading has to say what the form is doing, and the form falls back to
  // signing in for a mode it has no way to do.
  const mode: LoginViewMode =
    (requestedMode === 'signUp' && !canSignUp) ||
    (requestedMode === 'resetPassword' && !onPasswordReset)
      ? 'signIn'
      : requestedMode;
  const colors = colorVariantClasses[colorVariant];
  const text = { ...defaultText, ...textOverrides };
  const heading =
    mode === 'signUp'
      ? text.createAccount
      : mode === 'resetPassword'
        ? text.resetPassword
        : text.signInToAccount;

  return (
    <PageContainer background='default'>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          // A tap on a button while the keyboard is up presses the button,
          // rather than only putting the keyboard away.
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View
            testID='login-page'
            style={[
              {
                width: '100%',
                maxWidth: LOGIN_VIEW_MAX_WIDTH + 32,
                alignSelf: 'center',
                paddingTop: 48,
                paddingBottom: 48,
                paddingHorizontal: 16,
                gap: 32,
              },
              style,
            ]}
          >
            <View>
              {logo ? (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  {logo}
                </View>
              ) : null}
              <Heading
                level={1}
                size='3xl'
                weight='bold'
                className={`text-center ${colors.title}`}
              >
                {appName}
              </Heading>
              <View style={{ marginTop: 24 }}>
                <Heading
                  level={2}
                  size='2xl'
                  weight='semibold'
                  className='text-center'
                >
                  {heading}
                </Heading>
              </View>
            </View>

            <LoginView
              onEmailSignIn={onEmailSignIn}
              {...(showSignUp && onEmailSignUp ? { onEmailSignUp } : {})}
              {...(onPasswordReset ? { onPasswordReset } : {})}
              {...(showGoogleSignIn && onGoogleSignIn
                ? { onGoogleSignIn }
                : {})}
              {...(showAppleSignIn && onAppleSignIn ? { onAppleSignIn } : {})}
              onSuccess={onSuccess}
              {...(onAuthError ? { onAuthError } : {})}
              {...(appleLogoTone ? { appleLogoTone } : {})}
              mode={mode}
              onModeChange={setMode}
              text={text}
              linkClassName={colors.link}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PageContainer>
  );
}
