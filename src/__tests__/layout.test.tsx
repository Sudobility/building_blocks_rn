/**
 * @fileoverview AppShell and the page-config context: a screen overrides the
 * shell's layout, as a page does on the web.
 */
import React from 'react';
import { Text } from 'react-native';
import { describe, it, expect, vi } from 'vitest';

type LayoutProps = Record<string, unknown>;
const layoutProps: { current: LayoutProps | null } = { current: null };

vi.mock('../components/layout/AppScreenLayout', () => ({
  AppScreenLayout: (props: LayoutProps & { children: React.ReactNode }) => {
    layoutProps.current = props;
    return <>{props.children}</>;
  },
}));

import { render } from './test-utils';
import { AppShell } from '../components/layout/AppShell';
import {
  PageConfigProvider,
  usePageConfig,
  useSetPageConfig,
} from '../components/layout/PageConfig';

function Screen({
  config,
}: {
  config: Parameters<typeof useSetPageConfig>[0];
}) {
  useSetPageConfig(config);
  return <Text>screen</Text>;
}

function ShowConfig() {
  return <Text>{JSON.stringify(usePageConfig())}</Text>;
}

describe('AppShell', () => {
  it('hands the layout its page defaults', async () => {
    await render(
      <AppShell pageDefaults={{ maxWidth: '7xl', contentPadding: 'sm' }}>
        <Text>content</Text>
      </AppShell>
    );
    expect(layoutProps.current).toMatchObject({
      maxWidth: '7xl',
      contentPadding: 'sm',
    });
  });

  it('lets a screen override them, and takes the override back when it leaves', async () => {
    const view = await render(
      <AppShell pageDefaults={{ maxWidth: '5xl', scrollable: true }}>
        <Screen config={{ maxWidth: 'full', scrollable: false }} />
      </AppShell>
    );
    expect(layoutProps.current).toMatchObject({
      maxWidth: 'full',
      scrollable: false,
    });

    await view.rerender(
      <AppShell pageDefaults={{ maxWidth: '5xl', scrollable: true }}>
        <Text>another screen</Text>
      </AppShell>
    );
    expect(layoutProps.current).toMatchObject({
      maxWidth: '5xl',
      scrollable: true,
    });
  });

  it('still takes its defaults under the earlier name', async () => {
    await render(
      <AppShell defaults={{ background: 'white' }}>
        <Text>content</Text>
      </AppShell>
    );
    expect(layoutProps.current).toMatchObject({ background: 'white' });
  });
});

describe('PageConfigProvider', () => {
  it('carries a screen override to whoever reads it, without a shell', async () => {
    const { getByText } = await render(
      <PageConfigProvider>
        <Screen config={{ contentPadding: 'none' }} />
        <ShowConfig />
      </PageConfigProvider>
    );
    expect(getByText('{"contentPadding":"none"}')).toBeTruthy();
  });
});
