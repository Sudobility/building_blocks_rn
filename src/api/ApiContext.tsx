/**
 * @fileoverview API context and provider for React Native (Firebase entry only).
 *
 * Provides a network client context with typed HTTP methods (get, post, put, delete),
 * authentication state (token, userId, isReady, isLoading), and optional token
 * refresh. Uses a default fetch-based client with JSON content type, with support
 * for custom network client overrides.
 *
 * Exports dual hooks: `useApi()` (throws if no provider) and `useApiSafe()` (returns null).
 */
import React, { createContext, useContext, useMemo } from 'react';
// Use the shared platform NetworkClient so this context is interchangeable with
// the web building_blocks ApiProvider and accepted by @sudobility/entity_client's
// EntityClient. The default fetch client below is cast to it (same approach as
// the web ApiProvider): a real, injected networkClient is what entity/API
// features use at runtime.
import type { NetworkClient } from '@sudobility/types';

export type { NetworkClient };

export interface ApiContextValue {
  /** Network client for making API requests */
  networkClient: NetworkClient;
  /** Base URL for API calls */
  baseUrl: string;
  /** Authentication token (null if not logged in) */
  token: string | null;
  /** User ID (null if not logged in) */
  userId: string | null;
  /** Whether the context is ready */
  isReady: boolean;
  /** Whether authentication is loading */
  isLoading: boolean;
  /** Refresh the auth token */
  refreshToken?: () => Promise<string | null>;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export interface ApiProviderProps {
  children: React.ReactNode;
  /** Base URL for API calls */
  baseUrl: string;
  /** Authentication token */
  token: string | null;
  /** User ID */
  userId: string | null;
  /** Whether auth state is determined */
  isReady: boolean;
  /** Whether auth is loading */
  isLoading: boolean;
  /** Optional custom network client */
  networkClient?: NetworkClient;
  /** Optional token refresh function */
  refreshToken?: () => Promise<string | null>;
}

function createDefaultNetworkClient(): NetworkClient {
  async function makeRequest<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    const json = await response.json();
    return json as T;
  }

  // The default fetch client uses RequestInit/raw-JSON semantics, which differ
  // from @sudobility/types' NetworkRequestOptions/NetworkResponse. It is cast to
  // the shared interface (same as the web ApiProvider) and is a best-effort
  // fallback; apps that use entity/API features inject a real NetworkClient.
  const client = {
    request: makeRequest,
    get: <T,>(url: string, options?: Omit<RequestInit, 'method' | 'body'>) =>
      makeRequest<T>(url, { ...options, method: 'GET' }),
    post: <T,>(
      url: string,
      body?: unknown,
      options?: Omit<RequestInit, 'method'>
    ) =>
      makeRequest<T>(url, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    put: <T,>(
      url: string,
      body?: unknown,
      options?: Omit<RequestInit, 'method'>
    ) =>
      makeRequest<T>(url, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),
    delete: <T,>(url: string, options?: Omit<RequestInit, 'method' | 'body'>) =>
      makeRequest<T>(url, { ...options, method: 'DELETE' }),
  };

  return client as unknown as NetworkClient;
}

export function ApiProvider({
  children,
  baseUrl,
  token,
  userId,
  isReady,
  isLoading,
  networkClient,
  refreshToken,
}: ApiProviderProps) {
  const defaultClient = useMemo(() => createDefaultNetworkClient(), []);

  const value = useMemo<ApiContextValue>(
    () => ({
      networkClient: networkClient ?? defaultClient,
      baseUrl,
      token,
      userId,
      isReady,
      isLoading,
      refreshToken,
    }),
    [
      networkClient,
      defaultClient,
      baseUrl,
      token,
      userId,
      isReady,
      isLoading,
      refreshToken,
    ]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

/**
 * Hook to access API context. Throws if not within an ApiProvider.
 */
export function useApi(): ApiContextValue {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

/**
 * Safely access API context. Returns null if not within an ApiProvider.
 */
export function useApiSafe(): ApiContextValue | null {
  return useContext(ApiContext);
}

export { ApiContext };
