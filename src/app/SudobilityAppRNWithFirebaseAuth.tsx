/**
 * @fileoverview Firebase auth-aware app wrapper for Sudobility React Native
 * apps — the counterpart of `SudobilityAppWithFirebaseAuth` in
 * `@sudobility/building_blocks`.
 *
 * Extends `SudobilityAppRN` with:
 * - the app's auth provider (`AuthProviderWrapper`), mounted around everything;
 * - an API provider inside it (`ApiProvider`);
 * - the app's own providers (`AppProviders`) **inside both**, so they can read
 *   the signed-in user and the API context — the web's order;
 * - a query cache reset when the signed-in user changes (pass `queryClient`).
 *
 * Unlike the web wrapper there is no built-in default `ApiProvider`: this
 * package's `ApiProvider` is given its token by the app (it takes no Firebase
 * dependency), so the app passes one already bound to its auth state.
 */
import React from 'react';
import type { ComponentType, ReactNode } from 'react';
import { SudobilityAppRN } from './SudobilityAppRN';
import type { SudobilityAppRNProps } from './SudobilityAppRN';
import { AuthQueryCacheReset } from './AuthQueryCacheReset';
import type { QueryCacheLike } from './AuthQueryCacheReset';

export interface SudobilityAppRNWithFirebaseAuthProps extends SudobilityAppRNProps {
  /**
   * The app's auth provider component — typically the `AuthProvider` returned
   * by `createFirebaseAuthContext` (`@sudobility/auth_lib`). Mounted around the
   * whole app so `useAuth()` works everywhere. One of this or `AuthProvider`
   * is required.
   */
  AuthProviderWrapper?: ComponentType<{ children: ReactNode }>;
  /** @deprecated Use `AuthProviderWrapper` — the web's name for the same slot. */
  AuthProvider?: ComponentType<{ children: ReactNode }>;
  /**
   * API provider component (wraps the content with an auth-aware API context).
   * Pass `false`, or leave it out, for none.
   */
  ApiProvider?: ComponentType<{ children: ReactNode }> | false;
  /** @deprecated Use `ApiProvider` — the web's name for the same slot. */
  ApiProviderComponent?: ComponentType<{ children: ReactNode }>;
  /**
   * Additional providers to wrap around the content. These are rendered inside
   * the auth and API providers, so they can use both.
   */
  AppProviders?: ComponentType<{ children: ReactNode }>;
  /**
   * The app's query client. When given, its cache is dropped whenever the
   * signed-in user (the API provider's `userId`) signs out or changes, so one
   * user's data is never shown to the next.
   */
  queryClient?: QueryCacheLike;
}

export function SudobilityAppRNWithFirebaseAuth({
  children,
  AuthProviderWrapper,
  AuthProvider,
  ApiProvider: ApiProviderProp,
  ApiProviderComponent,
  AppProviders,
  queryClient,
  ...appProps
}: SudobilityAppRNWithFirebaseAuthProps) {
  const AuthProviderComponent = AuthProviderWrapper ?? AuthProvider;
  if (!AuthProviderComponent) {
    throw new Error(
      'SudobilityAppRNWithFirebaseAuth requires an AuthProviderWrapper'
    );
  }
  const ApiProviderResolved =
    ApiProviderProp === false
      ? null
      : (ApiProviderProp ?? ApiProviderComponent);

  let content: ReactNode = (
    <>
      {queryClient ? <AuthQueryCacheReset queryClient={queryClient} /> : null}
      {children}
    </>
  );

  // App providers (innermost: inside auth and API, so they can use both)
  if (AppProviders) {
    content = <AppProviders>{content}</AppProviders>;
  }

  // API provider (custom or none)
  if (ApiProviderResolved) {
    content = <ApiProviderResolved>{content}</ApiProviderResolved>;
  }

  // Mount the app-provided auth provider around everything.
  content = <AuthProviderComponent>{content}</AuthProviderComponent>;

  return <SudobilityAppRN {...appProps}>{content}</SudobilityAppRN>;
}
