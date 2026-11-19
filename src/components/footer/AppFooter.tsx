/**
 * @fileoverview App footer component for React Native — the counterpart of
 * the compact `AppFooter` in `@sudobility/building_blocks`.
 *
 * The web's content and rules: the version, the copyright line
 * (`© <year> <company>. <rights>`, the year defaulting to
 * `getCopyrightYear()`), the optional system status indicator, and the links
 * (Privacy, Terms, …), each reported to `onTrack` as `footer_link_clicked`.
 * Links open with `onPress` or `Linking.openURL(url)` where the web follows an
 * `href`.
 */
import React, { type ComponentType } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type {
  FooterLinkItem,
  AnalyticsTrackingParams,
  StatusIndicatorConfig,
} from '../../types';
import { createThemedStyles } from '../../utils/styles';

/**
 * Props the injected status indicator component is given — the web's
 * `SystemStatusIndicatorProps`.
 */
export interface SystemStatusIndicatorProps {
  statusPageUrl: string;
  apiEndpoint?: string;
  refreshInterval?: number;
  size?: 'sm' | 'md' | 'lg';
  version?: string;
  isNetworkOnline?: boolean;
}

/**
 * Helper to get copyright year or range — the web's `getCopyrightYear`.
 *
 * @param startYear - The starting year for the copyright range (default: 2025)
 * @returns A string representing the year or year range
 */
export function getCopyrightYear(startYear = 2025): string {
  const currentYear = new Date().getFullYear();
  if (currentYear > startYear) {
    return `${startYear}-${currentYear}`;
  }
  return String(startYear);
}

export interface AppFooterProps {
  /** App version string */
  version?: string;
  /** Copyright year or range (e.g., "2025" or "2025-2026") */
  copyrightYear?: string;
  /** Company name */
  companyName: string;
  /** Company URL (optional - opened via Linking when the name is pressed) */
  companyUrl?: string;
  /** Rights text (default: "All rights reserved") */
  rightsText?: string;
  /** Status indicator config (optional) */
  statusIndicator?: StatusIndicatorConfig;
  /**
   * A system status indicator component. Pass this to enable status indicator
   * functionality; injected, as on the web, so this package depends on none.
   */
  StatusIndicatorComponent?: ComponentType<SystemStatusIndicatorProps>;
  /** Footer links (Privacy, Terms, etc.) */
  links?: FooterLinkItem[];
  /** Network online status (for status indicator) */
  isNetworkOnline?: boolean;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** Optional analytics tracking callback */
  onTrack?: (params: AnalyticsTrackingParams) => void;
}

export function AppFooter({
  version,
  copyrightYear,
  companyName,
  companyUrl,
  rightsText = 'All rights reserved',
  statusIndicator,
  StatusIndicatorComponent,
  links = [],
  isNetworkOnline = true,
  style,
  onTrack,
}: AppFooterProps) {
  const styles = useStyles();
  const year = copyrightYear || getCopyrightYear();

  const handleLinkPress = (link: FooterLinkItem) => {
    onTrack?.({
      eventType: 'link_click',
      componentName: 'AppFooter',
      label: 'footer_link_clicked',
      params: { link_label: link.label, link_href: link.url },
    });

    if (link.onPress) {
      link.onPress();
    } else if (link.url) {
      Linking.openURL(link.url);
    }
  };

  const handleCompanyPress = () => {
    if (companyUrl) {
      Linking.openURL(companyUrl);
    }
  };

  return (
    <View style={[styles.container, style]} accessibilityLabel='App footer'>
      <View style={styles.topRow}>
        {version && <Text style={styles.versionText}>v{version}</Text>}
        <Text style={styles.copyrightText}>
          {`\u00A9 ${year} `}
          {companyUrl ? (
            <Text
              style={styles.companyLink}
              onPress={handleCompanyPress}
              accessibilityRole='link'
            >
              {companyName}
            </Text>
          ) : (
            companyName
          )}
          {rightsText ? `. ${rightsText}` : ''}
        </Text>
        {statusIndicator && StatusIndicatorComponent && (
          <StatusIndicatorComponent
            statusPageUrl={statusIndicator.statusPageUrl}
            apiEndpoint={statusIndicator.apiEndpoint}
            refreshInterval={statusIndicator.refreshInterval || 60000}
            size='sm'
            version={version}
            isNetworkOnline={isNetworkOnline}
          />
        )}
      </View>

      {links.length > 0 && (
        <View style={styles.linksRow} accessibilityRole='list'>
          {links.map((link, index) => (
            <React.Fragment key={link.url || link.label || index}>
              {index > 0 && <Text style={styles.separator}>{'\u00B7'}</Text>}
              <Pressable
                onPress={() => handleLinkPress(link)}
                accessibilityRole='link'
                accessibilityLabel={link.label}
              >
                <Text style={styles.linkText}>{link.label}</Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles(colors => ({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  versionText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  copyrightText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  companyLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  separator: {
    color: colors.textMuted,
    fontSize: 12,
  },
  linkText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
}));
