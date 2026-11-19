/**
 * @fileoverview AppTextScreen: the web `AppTextPage`'s content model, drawn in
 * the web's order.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, firePress } from './test-utils';
import { AppTextScreen } from '../components/pages/AppTextScreen';
import type { TextPageContent } from '../types';

/** A content object exactly as a web page would pass it to `AppTextPage`. */
const webContent: TextPageContent = {
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: {{date}}',
  sections: [
    { title: 'Introduction', content: 'We respect your privacy.' },
    {
      title: 'How We Use It',
      description: 'We use your information to:',
      items: ['Provide the service', 'Keep it <strong>secure</strong>'],
      additionalContent: 'We never sell it.',
    },
    {
      title: 'Information We Collect',
      subsections: [
        { title: 'You Provide', items: ['Email', 'Name'] },
        { title: 'Automatic', items: ['Device model'] },
      ],
    },
    {
      title: 'Cookies',
      content: 'See our <a href="https://example.com/cookies">cookie page</a>.',
      isHtml: true,
    },
  ],
  contact: {
    title: 'Contact Us',
    description: 'Questions? Reach us:',
    info: {
      emailLabel: 'Email:',
      email: 'support@example.com',
      websiteLabel: 'Website:',
      websiteUrl: 'https://example.com',
      dpoLabel: 'Data Protection Officer:',
      dpoEmail: 'dpo@example.com',
    },
    gdprNotice: {
      title: 'GDPR Rights',
      content: 'You may lodge a complaint. Contact:',
    },
  },
};

/** Document order of every piece of text on the screen. */
function textsInOrder(container: HTMLElement): string {
  return container.textContent ?? '';
}

describe('AppTextScreen', () => {
  it('draws the sections in the order the web does', async () => {
    const { container } = await render(
      <AppTextScreen text={webContent} lastUpdatedDate='January 1, 2025' />
    );
    const all = textsInOrder(container);
    const order = [
      'Privacy Policy',
      'Last updated: January 1, 2025',
      'Introduction',
      'We respect your privacy.',
      'How We Use It',
      'We use your information to:',
      'Provide the service',
      'We never sell it.',
      'Information We Collect',
      'You Provide',
      'Email',
      'Name',
      'Automatic',
      'Device model',
      'Cookies',
      'Contact Us',
      'Questions? Reach us:',
      'Email:',
      'support@example.com',
      'Website:',
      'https://example.com',
      'Data Protection Officer:',
      'dpo@example.com',
      'GDPR Rights',
      'You may lodge a complaint. Contact:',
    ];
    let cursor = -1;
    for (const piece of order) {
      const at = all.indexOf(piece, cursor + 1);
      expect(at, `"${piece}" after position ${cursor}`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("dates the last-updated line with today's date by default", async () => {
    const { getByText } = await render(<AppTextScreen text={webContent} />);
    expect(
      getByText(`Last updated: ${new Date().toLocaleDateString()}`)
    ).toBeTruthy();
  });

  it('shows no last-updated line when the content has none', async () => {
    const { queryByText } = await render(
      <AppTextScreen
        text={{ title: 'Terms', sections: [] }}
        lastUpdatedDate='January 1, 2025'
      />
    );
    expect(queryByText(/January 1, 2025/)).toBeNull();
    expect(queryByText(/Last updated/)).toBeNull();
  });

  it('draws HTML as text, never as markup', async () => {
    const { container, getByText } = await render(
      <AppTextScreen text={webContent} />
    );
    const all = textsInOrder(container);
    expect(all).not.toContain('<strong>');
    expect(all).not.toContain('<a ');
    // The bold run and the link are their own text.
    expect(getByText('secure')).toBeTruthy();
    expect(getByText('cookie page')).toBeTruthy();
  });

  it('opens the addresses it links to', async () => {
    const onLinkPress = vi.fn();
    const { getByText, getAllByText } = await render(
      <AppTextScreen text={webContent} onLinkPress={onLinkPress} />
    );

    firePress(getByText('support@example.com'));
    expect(onLinkPress).toHaveBeenLastCalledWith('mailto:support@example.com');

    firePress(getByText('https://example.com'));
    expect(onLinkPress).toHaveBeenLastCalledWith('https://example.com');

    // Once in the contact panel, once in the GDPR notice.
    const dpo = getAllByText('dpo@example.com');
    expect(dpo).toHaveLength(2);
    firePress(dpo[1]);
    expect(onLinkPress).toHaveBeenLastCalledWith('mailto:dpo@example.com');

    firePress(getByText('cookie page'));
    expect(onLinkPress).toHaveBeenLastCalledWith('https://example.com/cookies');
  });

  it('leaves the Data Protection Officer out unless given both halves', async () => {
    const { queryByText } = await render(
      <AppTextScreen
        text={{
          title: 'Terms',
          sections: [],
          contact: {
            title: 'Contact',
            description: 'Write to us.',
            info: {
              emailLabel: 'Email:',
              email: 'a@b.co',
              websiteLabel: 'Website:',
              websiteUrl: 'https://b.co',
              dpoLabel: 'Data Protection Officer:',
            },
          },
        }}
      />
    );
    expect(queryByText(/Data Protection Officer/)).toBeNull();
  });

  it('still draws the contact details it took as strings before', async () => {
    const { getByText } = await render(
      <AppTextScreen
        text={{
          title: 'Privacy',
          sections: [{ title: 'Rights', items: ['Access', 'Deletion'] }],
          contact: {
            title: 'Contact Us',
            description: 'Questions?',
            info: 'Email: a@b.co\nWebsite: https://b.co',
            gdprNotice: 'GDPR Rights\nYou may lodge a complaint.',
          },
        }}
      />
    );
    expect(getByText('Email: a@b.co\nWebsite: https://b.co')).toBeTruthy();
    expect(getByText('GDPR Rights\nYou may lodge a complaint.')).toBeTruthy();
  });

  it('hands its content to the ScreenWrapper', async () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <div data-testid='wrapper'>{children}</div>
    );
    const { getByTestId } = await render(
      <AppTextScreen text={webContent} ScreenWrapper={Wrapper} />
    );
    expect(getByTestId('wrapper').textContent).toContain('Privacy Policy');
  });
});
