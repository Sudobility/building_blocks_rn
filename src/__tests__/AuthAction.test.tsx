/**
 * @fileoverview AuthActionView / createAuthAction: the web topbar's auth
 * action, with a native menu.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, firePress } from './test-utils';
import {
  AuthActionView,
  createAuthAction,
} from '../components/header/AuthAction';

/** How many divider lines the open menu draws. */
function menuChildren(container: HTMLElement): string[] {
  const menu = container.querySelector('[role="menu"]');
  return [...(menu?.children ?? [])].map(child =>
    child.getAttribute('role') === 'menuitem'
      ? (child.textContent ?? '')
      : '---'
  );
}

describe('AuthActionView', () => {
  it('signed out: a "Log in" button', async () => {
    const onLoginPress = vi.fn();
    const { getByTestId } = await render(
      <AuthActionView
        user={null}
        onSignOut={vi.fn()}
        onLoginPress={onLoginPress}
      />
    );
    const button = getByTestId('log-in-button');
    expect(button.textContent).toBe('Log in');
    firePress(button);
    expect(onLoginPress).toHaveBeenCalledTimes(1);
  });

  it('takes its login text from loginButtonText', async () => {
    const { getByTestId } = await render(
      <AuthActionView
        user={null}
        onSignOut={vi.fn()}
        loginButtonText='Anmelden'
      />
    );
    expect(getByTestId('log-in-button').textContent).toBe('Anmelden');
  });

  it('signed in: an avatar that opens the menu items, then sign-out', async () => {
    const onSignOut = vi.fn();
    const onSettings = vi.fn();
    const { container, getByTestId, getByText } = await render(
      <AuthActionView
        user={{ displayName: 'Ada Lovelace', email: 'ada@example.com' }}
        onSignOut={onSignOut}
        signOutLabel='Sign out'
        menuItems={[
          { id: 'settings', label: 'Settings', onPress: onSettings },
          { id: 'billing', label: 'Billing' },
        ]}
      />
    );
    const avatar = getByTestId('account-menu');
    expect(avatar.textContent).toBe('AD');
    expect(menuChildren(container)).toEqual([]);

    firePress(avatar);
    // One divider between the app's items and sign-out.
    expect(menuChildren(container)).toEqual([
      'Settings',
      'Billing',
      '---',
      'Sign out',
    ]);

    firePress(getByText('Settings'));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(menuChildren(container)).toEqual([]);

    firePress(avatar);
    firePress(getByText('Sign out'));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('does not double the divider when the last item already draws one', async () => {
    const { container, getByTestId } = await render(
      <AuthActionView
        user={{ email: 'ada@example.com' }}
        onSignOut={vi.fn()}
        menuItems={[
          { id: 'a', label: 'A', dividerAfter: true },
          { id: 'b', label: 'B', dividerAfter: true },
        ]}
      />
    );
    firePress(getByTestId('account-menu'));
    expect(menuChildren(container)).toEqual([
      'A',
      '---',
      'B',
      '---',
      'Sign out',
    ]);
  });

  it('has no divider above sign-out when it is the only entry', async () => {
    const { container, getByTestId } = await render(
      <AuthActionView user={{ email: 'ada@example.com' }} onSignOut={vi.fn()} />
    );
    firePress(getByTestId('account-menu'));
    expect(menuChildren(container)).toEqual(['Sign out']);
  });

  it('names a user with neither name nor email by the account label', async () => {
    const { getByTestId } = await render(
      <AuthActionView user={{}} onSignOut={vi.fn()} accountLabel='Konto' />
    );
    expect(getByTestId('account-menu').textContent).toBe('KO');
  });

  it('still takes the three strings as one labels object', async () => {
    const signedOut = await render(
      <AuthActionView
        user={null}
        onSignOut={vi.fn()}
        labels={{ login: 'Entrar', signOut: 'Salir', account: 'Cuenta' }}
      />
    );
    expect(signedOut.getByTestId('log-in-button').textContent).toBe('Entrar');

    const signedIn = await render(
      <AuthActionView
        user={{}}
        onSignOut={vi.fn()}
        labels={{ login: 'Entrar', signOut: 'Salir', account: 'Cuenta' }}
      />
    );
    firePress(signedIn.getByTestId('account-menu'));
    expect(signedIn.getByText('Salir')).toBeTruthy();
  });
});

describe('createAuthAction', () => {
  it('binds the view to the app auth hook and labels', async () => {
    const signOut = vi.fn();
    let user: { email: string } | null = null;
    const AuthAction = createAuthAction({
      useAuth: () => ({ user, signOut }),
      useLabels: () => ({ signOut: 'Abmelden', account: 'Konto' }),
    });

    const signedOut = await render(<AuthAction />);
    expect(signedOut.getByTestId('log-in-button').textContent).toBe('Log in');
    signedOut.unmount();

    user = { email: 'ada@example.com' };
    const signedIn = await render(
      <AuthAction menuItems={[{ id: 'x', label: 'X' }]} />
    );
    firePress(signedIn.getByTestId('account-menu'));
    firePress(signedIn.getByText('Abmelden'));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
