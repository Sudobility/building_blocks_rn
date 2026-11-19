/**
 * @fileoverview LanguageSelector: the web selector's rules, in a modal list.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, firePress } from './test-utils';
import {
  LanguagePicker,
  LanguageSelector,
} from '../components/settings/LanguagePicker';

const languages = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'fr', name: 'Français', flag: 'FR' },
];

/** The names of the rows of the open list, top to bottom. */
function rowNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[role="radio"]')].map(
    row => row.getAttribute('aria-label') ?? ''
  );
}

describe('LanguageSelector', () => {
  it('shows the current language and lists them alphabetically by name', async () => {
    const { container, getByText } = await render(
      <LanguageSelector languages={languages} currentLanguage='fr' />
    );
    const trigger = getByText('FR Français');
    expect(rowNames(container)).toEqual([]);

    firePress(trigger);
    expect(rowNames(container)).toEqual(['Deutsch', 'English', 'Français']);
  });

  it('falls back to the first language for a code it does not have', async () => {
    const { getByText } = await render(
      <LanguageSelector languages={languages} currentLanguage='xx' />
    );
    expect(getByText('EN English')).toBeTruthy();
  });

  it('reports a new language, closes, and ignores the one already in use', async () => {
    const onLanguageChange = vi.fn();
    const { container, getByText, getByLabel } = await render(
      <LanguageSelector
        languages={languages}
        currentLanguage='en'
        onLanguageChange={onLanguageChange}
      />
    );

    firePress(getByText('EN English'));
    firePress(getByLabel('English'));
    expect(onLanguageChange).not.toHaveBeenCalled();
    expect(rowNames(container)).toEqual([]);

    firePress(getByText('EN English'));
    firePress(getByLabel('Deutsch'));
    expect(onLanguageChange).toHaveBeenCalledWith('de');
    expect(rowNames(container)).toEqual([]);
  });

  it('compact (the default) has no label or help; full has the web defaults', async () => {
    const compact = await render(<LanguageSelector languages={languages} />);
    expect(compact.queryByText('Language')).toBeNull();
    expect(compact.queryByText('Select your preferred language')).toBeNull();

    const full = await render(
      <LanguageSelector languages={languages} variant='full' />
    );
    expect(full.getByText('Language')).toBeTruthy();
    expect(full.getByText('Select your preferred language')).toBeTruthy();
  });

  it('takes its label, help and list wording', async () => {
    const { getByText } = await render(
      <LanguageSelector
        languages={languages}
        variant='full'
        label='Sprache'
        helperText='Bevorzugte Sprache'
        doneLabel='Fertig'
      />
    );
    expect(getByText('Sprache')).toBeTruthy();
    expect(getByText('Bevorzugte Sprache')).toBeTruthy();
    firePress(getByText('EN English'));
    expect(getByText('Fertig')).toBeTruthy();
  });
});

describe('LanguagePicker', () => {
  it('is the full variant, with a label and help only when given', async () => {
    const bare = await render(<LanguagePicker languages={languages} />);
    expect(bare.getByText('EN English')).toBeTruthy();
    expect(bare.queryByText('Language')).toBeNull();
    expect(bare.queryByText('Select your preferred language')).toBeNull();

    const labelled = await render(
      <LanguagePicker languages={languages} label='App language' />
    );
    expect(labelled.getByText('App language')).toBeTruthy();
  });
});
