/**
 * @fileoverview Structured text content screen for React Native — the
 * counterpart of `AppTextPage` in `@sudobility/building_blocks`.
 *
 * Takes the web's `TextPageContent` and draws it in the web's order: the
 * title, the "last updated" line, then each section — a paragraph, a list
 * (with its optional description and closing paragraph), or titled
 * subsections of lists — and, when given, the contact section: its heading and
 * description, the contact details in a panel, and the GDPR notice in an info
 * panel below it. Use it for a Privacy Policy, Terms of Service and the like.
 *
 * What is native here: the page scrolls in a `ScrollView` (or the
 * `ScreenWrapper` the app gives), addresses open through `Linking`, and HTML
 * is drawn as inline text (see `../../utils/inline-html`).
 */
import React from 'react';
import { View, Text, ScrollView, Linking, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type {
  GdprNotice,
  TextPageContactInfo,
  TextPageContent,
  TextSection,
} from '../../types';
import { createThemedStyles } from '../../utils/styles';
import { renderInlineHtml } from '../../utils/inline-html';
import { useIsRTL } from '../../hooks/useRTL';

const rtlStyles = StyleSheet.create({
  text: {
    writingDirection: 'rtl',
  },
});

export interface AppTextScreenProps {
  /** All text content (same data type as the web's `AppTextPage`) */
  text: TextPageContent;
  /**
   * Current date for the "last updated" line (default: today, in the device's
   * locale — as on the web)
   */
  lastUpdatedDate?: string;
  /** Optional wrapper component for the screen layout (the web's `PageWrapper`) */
  ScreenWrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /** Custom style for the content container */
  style?: StyleProp<ViewStyle>;
  /**
   * Opens an address the page links to — `mailto:` for the contact emails, the
   * website URL, and any `<a href>` in HTML content. Default: `Linking.openURL`.
   */
  onLinkPress?: (url: string) => void;
}

/**
 * The shape a section may have at run time: the web's three, plus what this
 * package accepted before it took the web's types (a section with both a
 * paragraph and a list, a subsection with a paragraph).
 */
interface LooseSection {
  title: string;
  content?: string;
  isHtml?: boolean;
  description?: string;
  items?: string[];
  additionalContent?: string;
  subsections?: LooseSection[];
}

function openUrl(url: string) {
  // A device with no mail client rejects `mailto:`; that must not surface as
  // an unhandled rejection from a tap.
  Promise.resolve(Linking.openURL(url)).catch(() => {});
}

interface TextParts {
  styles: ReturnType<typeof useStyles>;
  isRTL: boolean;
  onLinkPress: (url: string) => void;
}

function Paragraph({
  children,
  html,
  parts,
  tight,
}: {
  children: string;
  html?: boolean;
  parts: TextParts;
  tight?: boolean;
}) {
  const { styles, isRTL, onLinkPress } = parts;
  return (
    <Text
      style={[
        styles.paragraph,
        tight && styles.paragraphTight,
        isRTL && rtlStyles.text,
      ]}
    >
      {html
        ? renderInlineHtml(children, { linkStyle: styles.link, onLinkPress })
        : children}
    </Text>
  );
}

/** A bulleted list. Items are inline HTML, as on the web. */
function List({ items, parts }: { items: string[]; parts: TextParts }) {
  const { styles, isRTL, onLinkPress } = parts;
  return (
    <View style={styles.list} accessibilityRole='list'>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>{'•'}</Text>
          <Text style={[styles.listItemText, isRTL && rtlStyles.text]}>
            {renderInlineHtml(item, { linkStyle: styles.link, onLinkPress })}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SectionBody({
  section,
  parts,
}: {
  section: TextSection;
  parts: TextParts;
}) {
  const { styles, isRTL } = parts;
  const loose = section as LooseSection;

  if (Array.isArray(loose.subsections)) {
    // Section with subsections (h3 + lists)
    return (
      <>
        {loose.subsections.map((subsection, index) => (
          <React.Fragment key={index}>
            <Text
              style={[styles.subsectionHeading, isRTL && rtlStyles.text]}
              accessibilityRole='header'
            >
              {subsection.title}
            </Text>
            {subsection.content ? (
              <Paragraph parts={parts} html={subsection.isHtml} tight>
                {subsection.content}
              </Paragraph>
            ) : null}
            {Array.isArray(subsection.items) ? (
              <List items={subsection.items} parts={parts} />
            ) : null}
          </React.Fragment>
        ))}
      </>
    );
  }

  if (Array.isArray(loose.items)) {
    // Section with list
    const lead = loose.description ?? loose.content;
    return (
      <>
        {lead ? (
          <Paragraph parts={parts} tight>
            {lead}
          </Paragraph>
        ) : null}
        <List items={loose.items} parts={parts} />
        {loose.additionalContent ? (
          <Paragraph parts={parts}>{loose.additionalContent}</Paragraph>
        ) : null}
      </>
    );
  }

  // Section with paragraph content (HTML or plain text)
  return loose.content ? (
    <Paragraph parts={parts} html={loose.isHtml}>
      {loose.content}
    </Paragraph>
  ) : null;
}

function ContactInfo({
  info,
  parts,
}: {
  info: TextPageContactInfo | string;
  parts: TextParts;
}) {
  const { styles, isRTL, onLinkPress } = parts;
  const link = (label: string, url: string) => (
    <Text
      style={styles.link}
      accessibilityRole='link'
      onPress={() => onLinkPress(url)}
    >
      {label}
    </Text>
  );

  return (
    <View style={styles.contactPanel}>
      <Text style={[styles.contactText, isRTL && rtlStyles.text]}>
        {typeof info === 'string' ? (
          info
        ) : (
          <>
            {info.emailLabel} {link(info.email, `mailto:${info.email}`)}
            {'\n'}
            {info.websiteLabel} {link(info.websiteUrl, info.websiteUrl)}
            {info.dpoLabel && info.dpoEmail ? (
              <>
                {'\n'}
                {info.dpoLabel} {link(info.dpoEmail, `mailto:${info.dpoEmail}`)}
              </>
            ) : null}
          </>
        )}
      </Text>
    </View>
  );
}

function GdprPanel({
  notice,
  dpoEmail,
  parts,
}: {
  notice: GdprNotice | string;
  dpoEmail?: string;
  parts: TextParts;
}) {
  const { styles, isRTL, onLinkPress } = parts;
  return (
    <View style={styles.gdprPanel}>
      {typeof notice === 'string' ? (
        <Text style={[styles.gdprText, isRTL && rtlStyles.text]}>{notice}</Text>
      ) : (
        <>
          <Text
            style={[styles.gdprTitle, isRTL && rtlStyles.text]}
            accessibilityRole='header'
          >
            {notice.title}
          </Text>
          <Text style={[styles.gdprText, isRTL && rtlStyles.text]}>
            {notice.content}
            {dpoEmail ? (
              <>
                {' '}
                <Text
                  style={styles.link}
                  accessibilityRole='link'
                  onPress={() => onLinkPress(`mailto:${dpoEmail}`)}
                >
                  {dpoEmail}
                </Text>
              </>
            ) : null}
          </Text>
        </>
      )}
    </View>
  );
}

/**
 * AppTextScreen - a text screen for legal/informational pages.
 *
 * @example
 * ```tsx
 * <AppTextScreen
 *   text={{
 *     title: 'Privacy Policy',
 *     lastUpdated: 'Last updated: {{date}}',
 *     sections: [
 *       { title: 'Introduction', content: 'We respect your privacy...' },
 *       { title: 'Data We Collect', items: ['Email', 'Usage data'] },
 *       {
 *         title: 'Information We Collect',
 *         subsections: [
 *           { title: 'You Provide', items: ['Email', 'Name'] },
 *           { title: 'Automatic', items: ['IP', 'Device'] },
 *         ],
 *       },
 *     ],
 *     contact: {
 *       title: 'Contact',
 *       description: 'Questions?',
 *       info: {
 *         emailLabel: 'Email:',
 *         email: 'support@example.com',
 *         websiteLabel: 'Website:',
 *         websiteUrl: 'https://example.com',
 *       },
 *     },
 *   }}
 *   lastUpdatedDate='January 1, 2025'
 * />
 * ```
 */
export function AppTextScreen({
  text,
  lastUpdatedDate = new Date().toLocaleDateString(),
  ScreenWrapper,
  style,
  onLinkPress = openUrl,
}: AppTextScreenProps) {
  const styles = useStyles();
  const isRTL = useIsRTL();
  const parts: TextParts = { styles, isRTL, onLinkPress };
  const contact = text.contact;

  const content = (
    <View style={[styles.container, style]}>
      <Text
        style={[styles.title, isRTL && rtlStyles.text]}
        accessibilityRole='header'
      >
        {text.title}
      </Text>

      {text.lastUpdated ? (
        <Paragraph parts={parts}>
          {text.lastUpdated.replace('{{date}}', lastUpdatedDate)}
        </Paragraph>
      ) : null}

      {/* Render all sections */}
      {text.sections.map((section, index) => (
        <React.Fragment key={index}>
          <Text
            style={[styles.sectionHeading, isRTL && rtlStyles.text]}
            accessibilityRole='header'
          >
            {section.title}
          </Text>
          <SectionBody section={section} parts={parts} />
        </React.Fragment>
      ))}

      {/* Contact Section */}
      {contact ? (
        <>
          <Text
            style={[styles.sectionHeading, isRTL && rtlStyles.text]}
            accessibilityRole='header'
          >
            {contact.title}
          </Text>
          <Paragraph parts={parts} html={contact.isHtml}>
            {contact.description}
          </Paragraph>
          <ContactInfo info={contact.info} parts={parts} />

          {/* GDPR Notice */}
          {contact.gdprNotice ? (
            <GdprPanel
              notice={contact.gdprNotice}
              dpoEmail={
                typeof contact.info === 'string'
                  ? undefined
                  : contact.info.dpoEmail
              }
              parts={parts}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );

  if (ScreenWrapper) {
    return <ScreenWrapper>{content}</ScreenWrapper>;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      // Full-bleed, with the safe area as scroll insets.
      contentInsetAdjustmentBehavior='automatic'
    >
      {content}
    </ScrollView>
  );
}

const useStyles = createThemedStyles(colors => ({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    padding: 16,
  },
  // The web's h1: bold, 32px below.
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 32,
  },
  // The web's h2: bold, 32px above and 16px below.
  sectionHeading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 32,
    marginBottom: 16,
  },
  // The web's h3: semibold, 24px above and 12px below.
  subsectionHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  // The web's body text: foreground, relaxed leading, 24px below.
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.text,
    marginBottom: 24,
  },
  // A list's description sits closer to its list.
  paragraphTight: {
    marginBottom: 16,
  },
  list: {
    marginBottom: 24,
    gap: 4,
  },
  listItem: {
    flexDirection: 'row',
  },
  bullet: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.text,
    marginEnd: 8,
  },
  listItemText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.text,
    flex: 1,
  },
  link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  contactPanel: {
    padding: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  contactText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.text,
  },
  gdprPanel: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    backgroundColor: colors.infoBg,
  },
  gdprTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 8,
  },
  gdprText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: colors.info,
  },
}));
