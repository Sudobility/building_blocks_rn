/**
 * @fileoverview SudobilityAppRNWithFirebaseAuth: the web wrapper's provider
 * order, and the query cache reset on a change of user.
 */
import React, { createContext, useContext } from 'react';
import { Text } from 'react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from './test-utils';
import { SudobilityAppRNWithFirebaseAuth } from '../app/SudobilityAppRNWithFirebaseAuth';
import { AuthQueryCacheReset } from '../app/AuthQueryCacheReset';
import { ApiProvider, useApiSafe } from '../api/ApiContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext<string | null>(null);
const Auth = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value='signed-in'>{children}</AuthContext.Provider>
);

function apiProviderFor(userId: string | null) {
  return function Api({ children }: { children: React.ReactNode }) {
    return (
      <ApiProvider
        baseUrl='https://api.example'
        token={userId ? 'token' : null}
        userId={userId}
        isReady={!!userId}
        isLoading={false}
      >
        {children}
      </ApiProvider>
    );
  };
}

/** An app provider that reads what is around it, as an entity provider does. */
function AppProviders({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const api = useApiSafe();
  return (
    <>
      <Text>{`auth=${auth} user=${api?.userId ?? 'none'}`}</Text>
      {children}
    </>
  );
}

describe('SudobilityAppRNWithFirebaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('renders app providers inside the auth and API providers', async () => {
    const { getByText } = await render(
      <SudobilityAppRNWithFirebaseAuth
        AuthProviderWrapper={Auth}
        ApiProvider={apiProviderFor('u1')}
        AppProviders={AppProviders}
      >
        <Text>content</Text>
      </SudobilityAppRNWithFirebaseAuth>
    );
    expect(getByText('auth=signed-in user=u1')).toBeTruthy();
    expect(getByText('content')).toBeTruthy();
  });

  it('still takes its providers under the earlier prop names', async () => {
    const { getByText } = await render(
      <SudobilityAppRNWithFirebaseAuth
        AuthProvider={Auth}
        ApiProviderComponent={apiProviderFor('u2')}
        AppProviders={AppProviders}
      >
        <Text>content</Text>
      </SudobilityAppRNWithFirebaseAuth>
    );
    expect(getByText('auth=signed-in user=u2')).toBeTruthy();
  });

  it('mounts no API provider when told not to', async () => {
    const { getByText } = await render(
      <SudobilityAppRNWithFirebaseAuth
        AuthProviderWrapper={Auth}
        ApiProvider={false}
        ApiProviderComponent={apiProviderFor('u3')}
        AppProviders={AppProviders}
      >
        <Text>content</Text>
      </SudobilityAppRNWithFirebaseAuth>
    );
    expect(getByText('auth=signed-in user=none')).toBeTruthy();
  });

  it('drops the query cache when the signed-in user goes away', async () => {
    const queryClient = { clear: vi.fn() };
    // One API provider for the life of the tree, fed the user from above, so a
    // change of user is an update and not a remount.
    const UserId = createContext<string | null>(null);
    const Api = ({ children }: { children: React.ReactNode }) => {
      const userId = useContext(UserId);
      return (
        <ApiProvider
          baseUrl='https://api.example'
          token={userId ? 'token' : null}
          userId={userId}
          isReady={!!userId}
          isLoading={false}
        >
          {children}
        </ApiProvider>
      );
    };
    const app = (userId: string | null) => (
      <UserId.Provider value={userId}>
        <SudobilityAppRNWithFirebaseAuth
          AuthProviderWrapper={Auth}
          ApiProvider={Api}
          queryClient={queryClient}
        >
          <Text>content</Text>
        </SudobilityAppRNWithFirebaseAuth>
      </UserId.Provider>
    );

    // A user already signed in at launch clears nothing.
    const view = await render(app('u1'));
    expect(view.getByText('content')).toBeTruthy();
    expect(queryClient.clear).not.toHaveBeenCalled();

    await view.rerender(app(null));
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
  });

  it('leaves the cache alone when given no query client', async () => {
    const { getByText } = await render(
      <SudobilityAppRNWithFirebaseAuth
        AuthProviderWrapper={Auth}
        ApiProvider={apiProviderFor('u1')}
      >
        <Text>content</Text>
      </SudobilityAppRNWithFirebaseAuth>
    );
    expect(getByText('content')).toBeTruthy();
  });
});

describe('AuthQueryCacheReset', () => {
  it('clears on sign-out and on a switch of account, and not on arriving', async () => {
    const queryClient = { clear: vi.fn() };
    const view = await render(
      <AuthQueryCacheReset queryClient={queryClient} userId={null} />
    );

    // The session restored at launch, or a first sign-in: not a change of user.
    await view.rerender(
      <AuthQueryCacheReset queryClient={queryClient} userId='u1' />
    );
    expect(queryClient.clear).not.toHaveBeenCalled();

    // A switch straight to another account.
    await view.rerender(
      <AuthQueryCacheReset queryClient={queryClient} userId='u2' />
    );
    expect(queryClient.clear).toHaveBeenCalledTimes(1);

    // Sign-out.
    await view.rerender(
      <AuthQueryCacheReset queryClient={queryClient} userId={null} />
    );
    expect(queryClient.clear).toHaveBeenCalledTimes(2);

    // Signing in again from signed out clears nothing more.
    await view.rerender(
      <AuthQueryCacheReset queryClient={queryClient} userId='u1' />
    );
    expect(queryClient.clear).toHaveBeenCalledTimes(2);
  });

  it('reads the user from the API provider when not given one', async () => {
    const queryClient = { clear: vi.fn() };
    const tree = (userId: string | null) => (
      <ApiProvider
        baseUrl='https://api.example'
        token={userId ? 'token' : null}
        userId={userId}
        isReady={!!userId}
        isLoading={false}
      >
        <AuthQueryCacheReset queryClient={queryClient} />
      </ApiProvider>
    );

    const view = await render(tree('u1'));
    expect(queryClient.clear).not.toHaveBeenCalled();
    await view.rerender(tree(null));
    expect(queryClient.clear).toHaveBeenCalledTimes(1);
  });
});
