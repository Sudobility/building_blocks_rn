/**
 * @fileoverview Tests for SudobilityAppRN app wrapper.
 */
import React from 'react';
import { Text } from 'react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from './test-utils';
import { SudobilityAppRN } from '../app/SudobilityAppRN';
import { ThemeProvider } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('SudobilityAppRN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('should render children within the provider stack', async () => {
    const { getByText } = await render(
      <SudobilityAppRN>
        <Text>Child Content</Text>
      </SudobilityAppRN>
    );

    expect(getByText('Child Content')).toBeTruthy();
  });

  it('should accept custom ThemeProviderComponent', async () => {
    // Custom ThemeProvider must still provide theme context since
    // ToastProvider (default) uses useTheme() internally.
    const CustomTheme = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { getByText } = await render(
      <SudobilityAppRN ThemeProviderComponent={CustomTheme}>
        <Text>Custom Theme Child</Text>
      </SudobilityAppRN>
    );

    expect(getByText('Custom Theme Child')).toBeTruthy();
  });

  it("accepts a ThemeProvider that is not this package's (the web prop name)", async () => {
    // An app with a theme of its own passes that provider. The default
    // ToastProvider under it must still draw, with no theme context of ours.
    const AppTheme = ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    );

    const { getByText } = await render(
      <SudobilityAppRN ThemeProvider={AppTheme}>
        <Text>App Theme Child</Text>
      </SudobilityAppRN>
    );

    expect(getByText('App Theme Child')).toBeTruthy();
  });

  it('accepts a ToastProvider (the web prop name)', async () => {
    const CustomToast = ({ children }: { children: React.ReactNode }) => (
      <>
        <Text>custom toast host</Text>
        {children}
      </>
    );

    const { getByText } = await render(
      <SudobilityAppRN ToastProvider={CustomToast}>
        <Text>Toast Child</Text>
      </SudobilityAppRN>
    );

    expect(getByText('custom toast host')).toBeTruthy();
    expect(getByText('Toast Child')).toBeTruthy();
  });

  it('shows LoadingFallback while a screen suspends', async () => {
    const pending = new Promise<never>(() => {});
    const Suspends = () => {
      throw pending;
    };
    const Loading = () => <Text>Loading screen</Text>;

    const { getByText, queryByText } = await render(
      <SudobilityAppRN LoadingFallback={Loading}>
        <Suspends />
      </SudobilityAppRN>
    );

    expect(getByText('Loading screen')).toBeTruthy();
    expect(queryByText('Oops!')).toBeNull();
  });

  it('should accept custom ToastProviderComponent', async () => {
    const CustomToast = ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    );

    const { getByText } = await render(
      <SudobilityAppRN ToastProviderComponent={CustomToast}>
        <Text>Custom Toast Child</Text>
      </SudobilityAppRN>
    );

    expect(getByText('Custom Toast Child')).toBeTruthy();
  });

  it('should accept QueryClientProvider', async () => {
    const MockQCP = ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    );

    const { getByText } = await render(
      <SudobilityAppRN QueryClientProvider={MockQCP}>
        <Text>QCP Child</Text>
      </SudobilityAppRN>
    );

    expect(getByText('QCP Child')).toBeTruthy();
  });

  it('should accept AppProviders', async () => {
    const MockProviders = ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    );

    const { getByText } = await render(
      <SudobilityAppRN AppProviders={MockProviders}>
        <Text>Provider Child</Text>
      </SudobilityAppRN>
    );

    expect(getByText('Provider Child')).toBeTruthy();
  });

  it('should catch errors with ErrorBoundary', async () => {
    const ErrorChild = () => {
      throw new Error('Test error');
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = await render(
      <SudobilityAppRN>
        <ErrorChild />
      </SudobilityAppRN>
    );

    expect(getByText('Oops!')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();

    consoleSpy.mockRestore();
  });
});
