/**
 * @fileoverview AppearanceSettings: the web component's sections, wording and
 * translation keys, on a segmented control.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, firePress } from './test-utils';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { Theme, FontSize } from '../types';

describe('AppearanceSettings', () => {
  const defaultProps = {
    theme: Theme.SYSTEM as Theme | string,
    fontSize: FontSize.MEDIUM as FontSize | string,
    onThemeChange: vi.fn(),
    onFontSizeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the heading and its description', async () => {
    const { getByText } = await render(
      <AppearanceSettings {...defaultProps} />
    );

    expect(getByText('Appearance')).toBeTruthy();
    expect(
      getByText('Customize the look and feel of the application.')
    ).toBeTruthy();
  });

  it('shows the theme setting: label, choices and help', async () => {
    const { getByText } = await render(
      <AppearanceSettings {...defaultProps} />
    );

    expect(getByText('Theme')).toBeTruthy();
    expect(getByText('Light')).toBeTruthy();
    expect(getByText('Dark')).toBeTruthy();
    expect(getByText('System')).toBeTruthy();
    expect(getByText('Choose your preferred color theme.')).toBeTruthy();
  });

  it('shows the font size setting: label, choices and help', async () => {
    const { getByText } = await render(
      <AppearanceSettings {...defaultProps} />
    );

    expect(getByText('Font Size')).toBeTruthy();
    expect(getByText('Small')).toBeTruthy();
    expect(getByText('Medium')).toBeTruthy();
    expect(getByText('Large')).toBeTruthy();
    expect(
      getByText('Adjust the text size for better readability.')
    ).toBeTruthy();
  });

  it('shows the information box by default, as on the web', async () => {
    const { getByText } = await render(
      <AppearanceSettings {...defaultProps} />
    );

    expect(getByText('About Settings')).toBeTruthy();
    expect(
      getByText(
        'Your appearance preferences are saved locally and will be applied automatically on your next visit.'
      )
    ).toBeTruthy();
  });

  it('hides the information box when showInfoBox is false', async () => {
    const { queryByText } = await render(
      <AppearanceSettings {...defaultProps} showInfoBox={false} />
    );

    expect(queryByText('About Settings')).toBeNull();
  });

  it('asks the translation function for the web keys', async () => {
    const t = vi.fn((key: string, fallback?: string) =>
      key === 'heading' ? 'Aspetto' : (fallback ?? key)
    );

    const { getByText } = await render(
      <AppearanceSettings {...defaultProps} t={t} />
    );

    expect(getByText('Aspetto')).toBeTruthy();
    const keys = new Set(t.mock.calls.map(call => call[0]));
    expect([...keys].sort()).toEqual(
      [
        'heading',
        'description',
        'themeLabel',
        'themeLight',
        'themeDark',
        'themeSystem',
        'themeDescription',
        'fontSizeLabel',
        'fontSizeSmall',
        'fontSizeMedium',
        'fontSizeLarge',
        'fontSizeDescription',
        'infoHeading',
        'infoDescription',
      ].sort()
    );
    // Every key is handed its English fallback.
    expect(t).toHaveBeenCalledWith('themeLabel', 'Theme');
  });

  it('reports the theme and the font size that were chosen', async () => {
    const { getByText } = await render(
      <AppearanceSettings {...defaultProps} />
    );

    firePress(getByText('Dark'));
    expect(defaultProps.onThemeChange).toHaveBeenCalledWith(Theme.DARK);

    firePress(getByText('Large'));
    expect(defaultProps.onFontSizeChange).toHaveBeenCalledWith(FontSize.LARGE);
  });
});
