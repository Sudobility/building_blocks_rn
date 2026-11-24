/**
 * @fileoverview Tests for ResponsivePanel — a NavStore-driven host that switches between a
 * full-screen phone layout and a bounded side panel on tablets, renders the current screen + a
 * nav bar from the existing primitives, shows a back control from `canGoBack`, and hides itself
 * (firing `onHidden`) when `open` is false.
 *
 * Window size is driven through the react-native mock's `__setWindowDimensions`; the screen
 * renderers return plain `<Text>` so assertions can match on text content. No ThemeProvider is
 * needed — `useThemeColors` never throws without one.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Text } from 'react-native';
import { __setWindowDimensions } from 'react-native';
import { createNavStore } from '@sudobility/navigation';
import { render } from '../../__tests__/test-utils';
import { ResponsivePanel } from './ResponsivePanel';

const screens = {
  home: () => <Text>Home screen</Text>,
  detail: () => <Text>Detail screen</Text>,
};

beforeEach(() => {
  // Default to a phone width before each test.
  __setWindowDimensions({ width: 400, height: 800 });
});

describe('ResponsivePanel', () => {
  it('renders the current screen full-screen on a phone', async () => {
    __setWindowDimensions({ width: 400, height: 800 });
    const store = createNavStore([{ key: 'home' }]);
    const { getByText, queryByTestId } = await render(
      <ResponsivePanel store={store} screens={screens} />
    );
    expect(getByText('Home screen')).toBeTruthy();
    expect(queryByTestId('responsive-panel-full')).toBeTruthy();
    expect(queryByTestId('responsive-panel-overlay')).toBeNull();
  });

  it('renders as a side panel over a scrim on a tablet', async () => {
    __setWindowDimensions({ width: 1024, height: 768 });
    const store = createNavStore([{ key: 'home' }]);
    const { getByText, queryByTestId } = await render(
      <ResponsivePanel store={store} screens={screens} />
    );
    expect(getByText('Home screen')).toBeTruthy();
    expect(queryByTestId('responsive-panel-overlay')).toBeTruthy();
    expect(queryByTestId('responsive-panel-side')).toBeTruthy();
    expect(queryByTestId('responsive-panel-scrim')).toBeTruthy();
    expect(queryByTestId('responsive-panel-full')).toBeNull();
  });

  it('renders the screen for the current (top) stack entry', async () => {
    const store = createNavStore([{ key: 'home' }]);
    store.getState().push({ key: 'detail' });
    const { getByText, queryByText } = await render(
      <ResponsivePanel store={store} screens={screens} />
    );
    expect(getByText('Detail screen')).toBeTruthy();
    expect(queryByText('Home screen')).toBeNull();
  });

  it('hides the back control at the stack root and shows it once it can go back', async () => {
    const atRoot = createNavStore([{ key: 'home' }]);
    const root = await render(
      <ResponsivePanel store={atRoot} screens={screens} />
    );
    expect(root.queryByText('‹')).toBeNull();

    const pushed = createNavStore([{ key: 'home' }]);
    pushed.getState().push({ key: 'detail' });
    const deep = await render(
      <ResponsivePanel store={pushed} screens={screens} />
    );
    expect(deep.queryByText('‹')).toBeTruthy();
  });

  it('hides when open is false and fires onHidden', async () => {
    const store = createNavStore([{ key: 'home' }]);
    const onHidden = vi.fn();
    const { queryByText, queryByTestId } = await render(
      <ResponsivePanel
        store={store}
        screens={screens}
        open={false}
        onHidden={onHidden}
      />
    );
    expect(queryByTestId('responsive-panel-full')).toBeNull();
    expect(queryByText('Home screen')).toBeNull();
    expect(onHidden).toHaveBeenCalledTimes(1);
  });
});
