/**
 * @fileoverview RequireSignIn: the web gate's three states and its notice.
 */
import React from 'react';
import { Text } from 'react-native';
import { describe, it, expect, vi } from 'vitest';
import { render, firePress } from './test-utils';
import {
  RequireSignIn,
  createRequireSignIn,
} from '../components/auth/RequireSignIn';

const notice = {
  title: 'Sign in required',
  body: 'Sign in to see your projects.',
  button: 'Sign in',
};

describe('RequireSignIn', () => {
  it('shows the loading fallback while auth resolves', async () => {
    const { getByText, queryByText } = await render(
      <RequireSignIn
        user={null}
        loading
        openSignIn={vi.fn()}
        notice={notice}
        loadingFallback={<Text>Loading</Text>}
      >
        <Text>Projects</Text>
      </RequireSignIn>
    );
    expect(getByText('Loading')).toBeTruthy();
    expect(queryByText('Projects')).toBeNull();
    expect(queryByText('Sign in required')).toBeNull();
  });

  it('renders the screen once signed in', async () => {
    const openSignIn = vi.fn();
    const { getByText } = await render(
      <RequireSignIn
        user={{ uid: 'u1' }}
        loading={false}
        openSignIn={openSignIn}
        notice={notice}
      >
        <Text>Projects</Text>
      </RequireSignIn>
    );
    expect(getByText('Projects')).toBeTruthy();
    expect(openSignIn).not.toHaveBeenCalled();
  });

  it('signed out: shows the notice and opens the sign-in flow over it', async () => {
    const openSignIn = vi.fn();
    const closeSignIn = vi.fn();
    const { getByText, getByTestId, getByLabel, queryByText, unmount } =
      await render(
        <RequireSignIn
          user={null}
          loading={false}
          openSignIn={openSignIn}
          closeSignIn={closeSignIn}
          notice={notice}
        >
          <Text>Projects</Text>
        </RequireSignIn>
      );

    expect(getByTestId('signed-out-notice')).toBeTruthy();
    expect(getByText('Sign in required')).toBeTruthy();
    expect(getByText('Sign in to see your projects.')).toBeTruthy();
    expect(queryByText('Projects')).toBeNull();
    expect(openSignIn).toHaveBeenCalledTimes(1);

    // Closed without signing in, the notice's button opens it again.
    firePress(getByLabel('Sign in'));
    expect(openSignIn).toHaveBeenCalledTimes(2);

    // Leaving the gated screen takes the sign-in flow along.
    expect(closeSignIn).not.toHaveBeenCalled();
    unmount();
    expect(closeSignIn).toHaveBeenCalledTimes(1);
  });

  it('the notice needs no title', async () => {
    const { getByText, queryByText } = await render(
      <RequireSignIn
        user={null}
        loading={false}
        openSignIn={vi.fn()}
        notice={{ body: 'Sign in to continue.', button: 'Sign in' }}
      >
        <Text>Projects</Text>
      </RequireSignIn>
    );
    expect(getByText('Sign in to continue.')).toBeTruthy();
    expect(queryByText('Sign in required')).toBeNull();
  });

  it('isSignedIn overrides the default test (a guest user is not signed in)', async () => {
    const { getByText } = await render(
      <RequireSignIn
        user={{ uid: 'guest', isAnonymous: true }}
        isSignedIn={false}
        loading={false}
        openSignIn={vi.fn()}
        notice={notice}
      >
        <Text>Projects</Text>
      </RequireSignIn>
    );
    expect(getByText('Sign in required')).toBeTruthy();
  });

  it("draws the app's own signed-out screen when given one", async () => {
    // And needs no ThemeProvider from this package to do it: an app with a
    // theme of its own never mounts one.
    const { getByText, queryByText } = await render(
      <RequireSignIn
        user={null}
        loading={false}
        signedOut={<Text>App prompt</Text>}
      >
        <Text>Projects</Text>
      </RequireSignIn>
    );
    expect(getByText('App prompt')).toBeTruthy();
    expect(queryByText('Projects')).toBeNull();
  });
});

describe('createRequireSignIn', () => {
  it('binds the gate to the app hooks', async () => {
    const openSignIn = vi.fn();
    let user: unknown = null;
    const Gate = createRequireSignIn({
      useAuth: () => ({ user, loading: false }),
      useSignIn: () => ({ openSignIn }),
      useText: () => notice,
      isSignedIn: u => !!u && !(u as { isAnonymous?: boolean }).isAnonymous,
    });

    const first = await render(
      <Gate>
        <Text>Projects</Text>
      </Gate>
    );
    expect(first.getByText('Sign in required')).toBeTruthy();
    expect(openSignIn).toHaveBeenCalledTimes(1);
    first.unmount();

    user = { uid: 'guest', isAnonymous: true };
    const guest = await render(
      <Gate>
        <Text>Projects</Text>
      </Gate>
    );
    expect(guest.getByText('Sign in required')).toBeTruthy();
    guest.unmount();

    user = { uid: 'u1' };
    const signedIn = await render(
      <Gate>
        <Text>Projects</Text>
      </Gate>
    );
    expect(signedIn.getByText('Projects')).toBeTruthy();
  });
});
