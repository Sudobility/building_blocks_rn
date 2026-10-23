/**
 * @fileoverview Tests for ThemeProvider, useTheme, and useThemeSafe.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, renderHookSync, render } from './test-utils';
import { ThemeProvider, useTheme, useThemeSafe } from '../theme/ThemeContext';
import { Theme } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { __setColorScheme } from 'react-native';

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    __setColorScheme('light');
  });

  it('should provide default theme (system)', async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    expect(result.current.theme).toBe(Theme.SYSTEM);
  });

  it('should resolve system theme to light when useColorScheme returns light', async () => {
    __setColorScheme('light');

    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    expect(result.current.resolvedTheme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('should resolve system theme to dark when useColorScheme returns dark', async () => {
    __setColorScheme('dark');

    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    expect(result.current.resolvedTheme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('should use initialTheme prop', async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider initialTheme={Theme.DARK}>{children}</ThemeProvider>
      ),
    });

    expect(result.current.theme).toBe(Theme.DARK);
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should persist theme to AsyncStorage when setTheme is called', async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    expect(result.current.theme).toBe(Theme.SYSTEM);
    expect(typeof result.current.setTheme).toBe('function');
  });

  it('should load persisted theme from AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValue(Theme.LIGHT);

    await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      ),
    });

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@building_blocks/theme');
  });

  it('should use custom storage key prefix', async () => {
    await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider storageKeyPrefix='myapp'>{children}</ThemeProvider>
      ),
    });

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(
      'myapp/@building_blocks/theme'
    );
  });

  it('should provide light colors for light theme', async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider initialTheme={Theme.LIGHT}>{children}</ThemeProvider>
      ),
    });

    expect(result.current.colors.background).toBe('#f8fafc');
  });

  it('should provide dark colors for dark theme', async () => {
    const { result } = await renderHook(() => useTheme(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider initialTheme={Theme.DARK}>{children}</ThemeProvider>
      ),
    });

    expect(result.current.colors.background).toBe('#020817');
  });
});

describe('useTheme', () => {
  it('should throw when not within a ThemeProvider', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let caughtError: Error | null = null;

    function ThrowCatcher() {
      try {
        useTheme();
      } catch (e) {
        caughtError = e as Error;
      }
      return null;
    }

    await render(<ThrowCatcher />);

    expect(caughtError).not.toBeNull();
    expect(caughtError!.message).toBe(
      'useTheme must be used within a ThemeProvider'
    );

    consoleSpy.mockRestore();
  });
});

describe('useThemeSafe', () => {
  it('should return null when not within a ThemeProvider', () => {
    const { result } = renderHookSync(() => useThemeSafe());
    expect(result.current).toBeNull();
  });
});
