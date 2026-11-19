/**
 * @fileoverview Parity with the web package's data, and the packaging rule
 * that keeps this package's screens styled.
 *
 * The web checks read `@sudobility/building_blocks`' source from the sibling
 * checkout (`../building_blocks`). Where it is not there — CI, a lone clone —
 * they are skipped rather than failed.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_LANGUAGES,
  RTL_LANGUAGES,
  isRTL,
} from '../constants/languages';

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webSrcDir = resolve(srcDir, '../../building_blocks/src');
const hasWeb = existsSync(join(webSrcDir, 'constants/languages.ts'));

describe('languages', () => {
  it('lists the 15 default languages and no RTL language', () => {
    expect(DEFAULT_LANGUAGES.map(language => language.code)).toEqual([
      'en',
      'de',
      'es',
      'fr',
      'it',
      'ja',
      'ko',
      'pt',
      'ru',
      'sv',
      'th',
      'uk',
      'vi',
      'zh',
      'zh-hant',
    ]);
    expect(RTL_LANGUAGES).toEqual([]);
    expect(isRTL('en')).toBe(false);
  });

  it.skipIf(!hasWeb)("is the web package's list, entry for entry", () => {
    const web = readFileSync(join(webSrcDir, 'constants/languages.ts'), 'utf8');
    const entries = [
      ...web.matchAll(
        /\{\s*code:\s*'([^']+)',\s*name:\s*'([^']+)',\s*flag:\s*'([^']+)'\s*\}/g
      ),
    ].map(([, code, name, flag]) => ({ code, name, flag }));
    expect(entries.length).toBeGreaterThan(0);
    expect(DEFAULT_LANGUAGES).toEqual(entries);
    expect(web).toMatch(/RTL_LANGUAGES: string\[\] = \[\]/);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === '__tests__' ? [] : sourceFiles(path);
    }
    return /\.tsx$/.test(entry) && !/\.test\.tsx$/.test(entry) ? [path] : [];
  });
}

/** React Native's own components: a `className` on one of these is inert. */
const CORE_COMPONENTS = [
  'View',
  'Text',
  'Pressable',
  'ScrollView',
  'FlatList',
  'SectionList',
  'Image',
  'TextInput',
  'Modal',
  'SafeAreaView',
  'KeyboardAvoidingView',
  'ActivityIndicator',
  'TouchableOpacity',
  'Animated\\.View',
  'Animated\\.Text',
];

describe('packaging: this package is loaded from compiled dist', () => {
  /*
    NativeWind turns `className` into style in JSX the app's Babel compiles.
    Apps load this package from `dist`, which calls `react/jsx-runtime`
    directly, so a `className` on a core component here does nothing and the
    screen renders unstyled. A class may only be handed, as a prop, to a
    `@sudobility/components-rn` component — that package is compiled from
    source by the app.
  */
  const files = sourceFiles(srcDir);

  it('puts no className on a core React Native component', () => {
    const pattern = new RegExp(
      `<(?:${CORE_COMPONENTS.join('|')})\\b[^>]*\\bclassName=`,
      's'
    );
    const offenders = files.filter(file =>
      pattern.test(readFileSync(file, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });

  const componentsRnSrc = resolve(
    srcDir,
    '../node_modules/@sudobility/components-rn/src'
  );

  it.skipIf(!existsSync(componentsRnSrc))(
    'hands components-rn only classes that package already uses',
    () => {
      // An app's Tailwind scans components-rn, not this package: a class that
      // appears only here is never generated.
      const classes = new Set<string>();
      for (const file of files) {
        const source = readFileSync(file, 'utf8');
        if (!/\bclassName=|ClassName=|title: '|link: '/.test(source)) continue;
        for (const [, literal] of source.matchAll(
          /(?:className|title|link)(?:=|: )\{?[`'"]([^`'"]+)[`'"]/g
        )) {
          literal
            .split(/\s+/)
            .filter(token => /^[a-z][a-z0-9:/.[\]-]*$/.test(token))
            .forEach(token => classes.add(token));
        }
      }
      expect(classes.size).toBeGreaterThan(0);

      const haystack = (function read(dir: string): string {
        return readdirSync(dir)
          .map(entry => {
            const path = join(dir, entry);
            if (statSync(path).isDirectory()) return read(path);
            return /\.tsx?$/.test(entry) ? readFileSync(path, 'utf8') : '';
          })
          .join('\n');
      })(componentsRnSrc);

      const missing = [...classes].filter(
        token =>
          !new RegExp(
            `(^|[\\s'"\`])${token.replace(/[.[\]/]/g, '\\$&')}($|[\\s'"\`])`,
            'm'
          ).test(haystack)
      );
      expect(missing).toEqual([]);
    }
  );
});
