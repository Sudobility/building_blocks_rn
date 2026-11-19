/**
 * @fileoverview AppHeader / AppHeaderWithFirebaseAuth: the web top bar's
 * sections.
 */
import React from 'react';
import { Text } from 'react-native';
import { describe, it, expect, vi } from 'vitest';
import { render, firePress } from './test-utils';
import {
  AppHeader,
  AppHeaderWithFirebaseAuth,
} from '../components/header/AppHeader';
import type { AuthActionProps } from '../components/header/AuthAction';

const Icon = () => <Text>icon</Text>;

describe('AppHeader', () => {
  it('lays out logo, center, menu items and account section in that order', async () => {
    const onDocs = vi.fn();
    const onLogo = vi.fn();
    const { container, getByLabel } = await render(
      <AppHeader
        logo={{ appName: 'My App', onPress: onLogo }}
        menuItems={[
          {
            id: 'docs',
            label: 'Docs',
            icon: Icon,
            routeName: 'Docs',
            onPress: onDocs,
          },
          {
            id: 'hidden',
            label: 'Hidden',
            icon: Icon,
            routeName: 'X',
            show: false,
          },
        ]}
        renderCenterSection={() => <Text>search</Text>}
        renderAccountSection={() => <Text>account</Text>}
        renderRight={() => <Text>extra</Text>}
      />
    );

    const text = container.textContent ?? '';
    expect(text.indexOf('My App')).toBeLessThan(text.indexOf('search'));
    expect(text.indexOf('search')).toBeLessThan(text.indexOf('icon'));
    expect(text.indexOf('icon')).toBeLessThan(text.indexOf('account'));
    expect(text.indexOf('account')).toBeLessThan(text.indexOf('extra'));
    expect(container.querySelector('[aria-label="Hidden"]')).toBeNull();
    expect(getByLabel('Main navigation')).toBeTruthy();

    firePress(getByLabel('Docs'));
    expect(onDocs).toHaveBeenCalledTimes(1);
    firePress(getByLabel('My App'));
    expect(onLogo).toHaveBeenCalledTimes(1);
  });

  it('shows the language selector when it can change the language', async () => {
    const onLanguageChange = vi.fn();
    const languages = [
      { code: 'en', name: 'English', flag: 'EN' },
      { code: 'de', name: 'Deutsch', flag: 'DE' },
    ];

    const without = await render(
      <AppHeader logo={{ appName: 'My App' }} languages={languages} />
    );
    expect(without.queryByText('EN English')).toBeNull();

    const hidden = await render(
      <AppHeader
        logo={{ appName: 'My App' }}
        languages={languages}
        onLanguageChange={onLanguageChange}
        hideLanguageSelector
      />
    );
    expect(hidden.queryByText('EN English')).toBeNull();

    const { getByText, getByLabel } = await render(
      <AppHeader
        logo={{ appName: 'My App' }}
        languages={languages}
        currentLanguage='en'
        onLanguageChange={onLanguageChange}
      />
    );
    firePress(getByText('EN English'));
    firePress(getByLabel('Deutsch'));
    expect(onLanguageChange).toHaveBeenCalledWith('de');
  });
});

describe('AppHeader menu items', () => {
  it('draws an item with no icon as its label', async () => {
    const onPricing = vi.fn();
    const { getByText } = await render(
      <AppHeader
        logo={{ appName: 'My App' }}
        menuItems={[{ id: 'pricing', label: 'Pricing', onPress: onPricing }]}
      />
    );
    firePress(getByText('Pricing'));
    expect(onPricing).toHaveBeenCalledTimes(1);
  });
});

describe('AppHeaderWithFirebaseAuth', () => {
  it('puts the auth action in the account section, with what the header was given', async () => {
    const seen: AuthActionProps[] = [];
    const AuthAction = (props: AuthActionProps) => {
      seen.push(props);
      return <Text>auth</Text>;
    };
    const onLoginPress = vi.fn();
    const items = [{ id: 'dashboard', label: 'Dashboard' }];

    const { getByText } = await render(
      <AppHeaderWithFirebaseAuth
        logo={{ appName: 'My App' }}
        AuthActionComponent={AuthAction}
        authenticatedMenuItems={items}
        onLoginPress={onLoginPress}
        loginButtonText='Sign in'
      />
    );

    expect(getByText('auth')).toBeTruthy();
    expect(seen[0]).toEqual({
      avatarSize: 32,
      onLoginPress,
      menuItems: items,
      loginButtonText: 'Sign in',
    });
  });
});
