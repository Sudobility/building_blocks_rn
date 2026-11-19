/**
 * @fileoverview Inline HTML: what the web puts on the page with
 * `dangerouslySetInnerHTML`, parsed for native text.
 */
import { describe, it, expect } from 'vitest';
import {
  decodeHtmlEntities,
  inlineHtmlToText,
  parseInlineHtml,
} from '../utils/inline-html';

describe('parseInlineHtml', () => {
  it('leaves plain text as one string', () => {
    expect(parseInlineHtml('Just text.')).toEqual(['Just text.']);
  });

  it('keeps bold, italic and underline, under one name each', () => {
    expect(
      parseInlineHtml('<strong>a</strong><b>b</b><em>c</em><i>d</i><u>e</u>')
    ).toEqual([
      { tag: 'b', children: ['a'] },
      { tag: 'b', children: ['b'] },
      { tag: 'i', children: ['c'] },
      { tag: 'i', children: ['d'] },
      { tag: 'u', children: ['e'] },
    ]);
  });

  it('nests tags', () => {
    expect(parseInlineHtml('We <b>never <i>sell</i></b> data')).toEqual([
      'We ',
      { tag: 'b', children: ['never ', { tag: 'i', children: ['sell'] }] },
      ' data',
    ]);
  });

  it('reads a link and its address', () => {
    expect(
      parseInlineHtml(
        'See <a href="https://example.com/a?b=1&amp;c=2">here</a>.'
      )
    ).toEqual([
      'See ',
      { tag: 'a', href: 'https://example.com/a?b=1&c=2', children: ['here'] },
      '.',
    ]);
    expect(parseInlineHtml("<a href='mailto:a@b.co'>mail</a>")).toEqual([
      { tag: 'a', href: 'mailto:a@b.co', children: ['mail'] },
    ]);
  });

  it('does not make a link of an address it should not open', () => {
    const [node] = parseInlineHtml('<a href="javascript:alert(1)">x</a>');
    expect(node).toEqual({ tag: 'a', href: undefined, children: ['x'] });
  });

  it('turns line breaks and block tags into new lines', () => {
    expect(parseInlineHtml('a<br>b<br/>c')).toEqual(['a\nb\nc']);
    expect(parseInlineHtml('<p>one</p><p>two</p>')).toEqual(['one\ntwo']);
  });

  it('drops a tag it does not draw and keeps its text', () => {
    expect(
      parseInlineHtml('<span class="x">kept</span> <script>y</script>')
    ).toEqual(['kept y']);
  });

  it('survives a closer with no opener and an opener never closed', () => {
    expect(parseInlineHtml('a</b>b')).toEqual(['ab']);
    expect(parseInlineHtml('a<b>b')).toEqual([
      'a',
      { tag: 'b', children: ['b'] },
    ]);
  });
});

describe('decodeHtmlEntities', () => {
  it('decodes named and numeric entities', () => {
    expect(
      decodeHtmlEntities('A &amp; B &lt;c&gt; &quot;d&quot; &#39;e&#x27;')
    ).toBe('A & B <c> "d" \'e\'');
    expect(decodeHtmlEntities('&copy; 2025 &mdash; x&nbsp;y')).toBe(
      '© 2025 — x y'
    );
  });

  it('leaves what is not an entity alone', () => {
    expect(decodeHtmlEntities('R&D &unknown; 5 & 6')).toBe(
      'R&D &unknown; 5 & 6'
    );
  });
});

describe('inlineHtmlToText', () => {
  it('is the text with the markup removed', () => {
    expect(inlineHtmlToText('<b>Email</b> &amp; <a href="/x">name</a>')).toBe(
      'Email & name'
    );
  });
});
