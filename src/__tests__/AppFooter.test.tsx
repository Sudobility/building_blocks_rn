/**
 * @fileoverview AppFooter: the web compact footer's content and rules.
 */
import React from 'react';
import { Linking, Text } from 'react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, firePress } from './test-utils';
import {
  AppFooter,
  getCopyrightYear,
  type SystemStatusIndicatorProps,
} from '../components/footer/AppFooter';

describe('getCopyrightYear', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is the start year in that year, and a range after it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:00Z'));
    expect(getCopyrightYear()).toBe('2025');
    vi.setSystemTime(new Date('2027-06-01T12:00:00Z'));
    expect(getCopyrightYear()).toBe('2025-2027');
    expect(getCopyrightYear(2027)).toBe('2027');
    expect(getCopyrightYear(2030)).toBe('2030');
  });
});

describe('AppFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes the copyright line as the web does', async () => {
    const { container } = await render(
      <AppFooter version='1.2.3' companyName='Sudobility Inc.' />
    );
    const text = container.textContent ?? '';
    expect(text).toContain('v1.2.3');
    // The year is filled in, and the rights text ends the line as given.
    expect(text).toContain(
      `© ${getCopyrightYear()} Sudobility Inc.. All rights reserved`
    );
    expect(text).not.toContain('All rights reserved.');
  });

  it('takes the year and rights text it is given, and may have none', async () => {
    const { container } = await render(
      <AppFooter
        companyName='Acme'
        copyrightYear='2020-2026'
        rightsText='Alle Rechte vorbehalten'
      />
    );
    expect(container.textContent).toContain(
      '© 2020-2026 Acme. Alle Rechte vorbehalten'
    );

    const bare = await render(<AppFooter companyName='Acme' rightsText='' />);
    expect(bare.container.textContent).toContain(
      `© ${getCopyrightYear()} Acme`
    );
    expect(bare.container.textContent).not.toContain('Acme.');
  });

  it('opens the company link', async () => {
    const { getByText } = await render(
      <AppFooter companyName='Acme' companyUrl='https://acme.example' />
    );
    firePress(getByText('Acme'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://acme.example');
  });

  it('tracks a link press with its label and address, then follows it', async () => {
    const onTrack = vi.fn();
    const onTerms = vi.fn();
    const { getByText } = await render(
      <AppFooter
        companyName='Acme'
        onTrack={onTrack}
        links={[
          { label: 'Privacy', url: 'https://acme.example/privacy' },
          { label: 'Terms', onPress: onTerms },
        ]}
      />
    );

    firePress(getByText('Privacy'));
    expect(onTrack).toHaveBeenLastCalledWith({
      eventType: 'link_click',
      componentName: 'AppFooter',
      label: 'footer_link_clicked',
      params: {
        link_label: 'Privacy',
        link_href: 'https://acme.example/privacy',
      },
    });
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://acme.example/privacy'
    );

    firePress(getByText('Terms'));
    expect(onTerms).toHaveBeenCalledTimes(1);
    expect(onTrack).toHaveBeenCalledTimes(2);
  });

  it('shows the status indicator only when given both its config and component', async () => {
    const seen: SystemStatusIndicatorProps[] = [];
    const Indicator = (props: SystemStatusIndicatorProps) => {
      seen.push(props);
      return <Text>status</Text>;
    };

    const without = await render(
      <AppFooter
        companyName='Acme'
        statusIndicator={{ statusPageUrl: 'https://status.acme.example' }}
      />
    );
    expect(without.queryByText('status')).toBeNull();

    const { getByText } = await render(
      <AppFooter
        companyName='Acme'
        version='2.0.0'
        isNetworkOnline={false}
        statusIndicator={{ statusPageUrl: 'https://status.acme.example' }}
        StatusIndicatorComponent={Indicator}
      />
    );
    expect(getByText('status')).toBeTruthy();
    expect(seen[0]).toEqual({
      statusPageUrl: 'https://status.acme.example',
      apiEndpoint: undefined,
      refreshInterval: 60000,
      size: 'sm',
      version: '2.0.0',
      isNetworkOnline: false,
    });
  });
});
