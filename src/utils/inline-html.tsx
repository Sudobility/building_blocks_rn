/**
 * @fileoverview Inline HTML for React Native text.
 *
 * The web `AppTextPage` puts list items and `isHtml` paragraphs on the page
 * with `dangerouslySetInnerHTML`. There is no DOM here, so the same strings are
 * parsed into the handful of inline tags a legal page uses — bold, italic,
 * underline, links and line breaks — and drawn as nested `<Text>`. Any other
 * tag is dropped and its text kept, and entities are decoded, so a string that
 * reads correctly on the web never shows markup here.
 */
import React from 'react';
import { Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

/** The inline tags that are drawn; everything else is unwrapped. */
export type InlineTag = 'b' | 'i' | 'u' | 'a';

export type InlineNode =
  string | { tag: InlineTag; href?: string; children: InlineNode[] };

const TAG_ALIASES: Record<string, InlineTag> = {
  b: 'b',
  strong: 'b',
  i: 'i',
  em: 'i',
  u: 'u',
  a: 'a',
};

/** Tags that end a line on the web; their text is kept, on a line of its own. */
const BLOCK_TAGS = new Set(['p', 'div', 'li', 'tr', 'h1', 'h2', 'h3', 'h4']);

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

/** Decode the HTML entities a browser would (`&amp;`, `&#39;`, `&#x27;`, …). */
export function decodeHtmlEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (match, body: string) => {
      if (body[0] === '#') {
        const code =
          body[1] === 'x' || body[1] === 'X'
            ? parseInt(body.slice(2), 16)
            : parseInt(body.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : match;
      }
      return NAMED_ENTITIES[body.toLowerCase()] ?? match;
    }
  );
}

/** Only addresses a legal page links to; anything else is drawn as text. */
function safeHref(attributes: string): string | undefined {
  const match = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(
    attributes
  );
  const href = decodeHtmlEntities(
    (match?.[1] ?? match?.[2] ?? match?.[3] ?? '').trim()
  );
  return /^(https?:|mailto:|tel:)/i.test(href) ? href : undefined;
}

/**
 * Parse a string of inline HTML into a small tree. Plain text comes back as a
 * single string node, so calling this on text with no markup costs nothing.
 */
export function parseInlineHtml(html: string): InlineNode[] {
  const root: InlineNode[] = [];
  const stack: Array<{ tag: InlineTag; children: InlineNode[] }> = [];
  const current = () =>
    stack.length > 0 ? stack[stack.length - 1].children : root;
  const pushText = (text: string) => {
    if (!text) return;
    const target = current();
    const last = target[target.length - 1];
    if (typeof last === 'string') {
      target[target.length - 1] = last + text;
    } else {
      target.push(text);
    }
  };

  const tagPattern = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(html)) !== null) {
    pushText(decodeHtmlEntities(html.slice(cursor, match.index)));
    cursor = match.index + match[0].length;

    const closing = match[1] === '/';
    const name = match[2].toLowerCase();
    const tag = TAG_ALIASES[name];

    if (name === 'br') {
      pushText('\n');
    } else if (BLOCK_TAGS.has(name)) {
      if (closing) pushText('\n');
    } else if (tag && !closing) {
      const node = {
        tag,
        ...(tag === 'a' ? { href: safeHref(match[3]) } : {}),
        children: [] as InlineNode[],
      };
      current().push(node);
      stack.push(node);
    } else if (tag && closing) {
      // Close back to the nearest matching open tag; a stray closer is ignored.
      const index = stack.map(open => open.tag).lastIndexOf(tag);
      if (index >= 0) stack.length = index;
    }
  }
  pushText(decodeHtmlEntities(html.slice(cursor)));

  // A block tag's trailing line break is spacing the paragraph already has.
  const last = root[root.length - 1];
  if (typeof last === 'string') {
    const trimmed = last.replace(/\n+$/, '');
    if (trimmed) {
      root[root.length - 1] = trimmed;
    } else {
      root.pop();
    }
  }
  return root;
}

/** The text of a parsed tree with all markup removed. */
export function inlineHtmlToText(html: string): string {
  const flatten = (nodes: InlineNode[]): string =>
    nodes
      .map(node => (typeof node === 'string' ? node : flatten(node.children)))
      .join('');
  return flatten(parseInlineHtml(html));
}

export interface RenderInlineHtmlOptions {
  /** Style for `<a>` */
  linkStyle?: StyleProp<TextStyle>;
  /** Called with the address when a link is pressed */
  onLinkPress?: (href: string) => void;
}

const TAG_STYLES: Record<Exclude<InlineTag, 'a'>, TextStyle> = {
  b: { fontWeight: '700' },
  i: { fontStyle: 'italic' },
  u: { textDecorationLine: 'underline' },
};

function renderNodes(
  nodes: InlineNode[],
  options: RenderInlineHtmlOptions,
  keyPrefix: string
): React.ReactNode[] {
  return nodes.map((node, index) => {
    if (typeof node === 'string') return node;
    const key = `${keyPrefix}${index}`;
    const children = renderNodes(node.children, options, `${key}-`);
    if (node.tag === 'a') {
      const href = node.href;
      return href ? (
        <Text
          key={key}
          style={options.linkStyle}
          accessibilityRole='link'
          onPress={() => options.onLinkPress?.(href)}
        >
          {children}
        </Text>
      ) : (
        <Text key={key}>{children}</Text>
      );
    }
    return (
      <Text key={key} style={TAG_STYLES[node.tag]}>
        {children}
      </Text>
    );
  });
}

/**
 * Inline HTML as children for a `<Text>`: strings, and nested `<Text>` for
 * bold, italic, underline and links.
 */
export function renderInlineHtml(
  html: string,
  options: RenderInlineHtmlOptions = {}
): React.ReactNode {
  const nodes = parseInlineHtml(html);
  if (nodes.length === 1 && typeof nodes[0] === 'string') return nodes[0];
  return renderNodes(nodes, options, 'n');
}
