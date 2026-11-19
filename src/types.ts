/**
 * @fileoverview Type definitions for @sudobility/building_blocks_rn
 *
 * Mirrors @sudobility/building_blocks types where possible,
 * adapted for React Native (style instead of className, onPress instead of href, etc.).
 */

import type { ComponentType, ReactNode } from 'react';

// Re-export LanguageConfig from constants
export type { LanguageConfig } from './constants/languages';

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Menu item configuration for AppHeader navigation.
 * Adapted from web MenuItemConfig: icon accepts RN icon props, uses onPress instead of href.
 */
export interface MenuItemConfig {
  /** Unique identifier for the menu item */
  id: string;
  /** Display label */
  label: string;
  /**
   * Icon component (RN style: accepts size and color). Optional, as on the
   * web: an item without one is drawn as its label.
   */
  icon?: ComponentType<{ size?: number; color?: string }>;
  /**
   * Route name for React Navigation. Informational — the header calls
   * `onPress`; the app's handler does the navigating.
   */
  routeName?: string;
  /** Optional route params */
  routeParams?: Record<string, unknown>;
  /** Optional: press handler (overrides routeName navigation) */
  onPress?: () => void;
  /** Optional: show only when condition is true */
  show?: boolean;
}

/**
 * Logo configuration for AppHeader.
 */
export interface LogoConfig {
  /** Logo image source (require() or { uri: string }) */
  source?: number | { uri: string };
  /** Accessibility label for the logo image (the web's `alt`) */
  alt?: string;
  /** App name to display next to logo */
  appName: string;
  /** Logo press handler (typically navigate to home) */
  onPress?: () => void;
}

// ============================================================================
// Footer Types
// ============================================================================

/**
 * Footer link item.
 * Uses onPress or url instead of href.
 */
export interface FooterLinkItem {
  /** Display label */
  label: string;
  /** URL to open (via Linking.openURL) */
  url?: string;
  /** Route name for in-app navigation */
  routeName?: string;
  /** Optional press handler */
  onPress?: () => void;
}

/**
 * System status indicator configuration (same shape as the web).
 */
export interface StatusIndicatorConfig {
  /** Status page URL (opened when the indicator is pressed) */
  statusPageUrl: string;
  /** API endpoint for fetching status */
  apiEndpoint?: string;
  /** Refresh interval in ms (default: 60000) */
  refreshInterval?: number;
}

// ============================================================================
// Layout Types
// ============================================================================

/**
 * Max width options for layout — the web's names, each the same width in
 * logical pixels as the web's `max-w-*` (see `AppScreenLayout`).
 */
export type MaxWidth =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '4xl'
  /** 1024 — the reading width, and the content default. */
  | '5xl'
  | '7xl'
  | 'full';

/**
 * Content padding options.
 */
export type ContentPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Background variant options.
 */
export type BackgroundVariant = 'default' | 'white' | 'gradient';

// ============================================================================
// Analytics Types
// ============================================================================

export type AnalyticsEventType =
  | 'button_click'
  | 'link_click'
  | 'navigation'
  | 'settings_change'
  | 'subscription_action'
  | 'page_view';

export interface AnalyticsTrackingParams {
  eventType: AnalyticsEventType;
  componentName: string;
  label: string;
  params?: Record<string, unknown>;
}

export interface AnalyticsTracker {
  onTrack: (params: AnalyticsTrackingParams) => void;
}

// ============================================================================
// Settings Types
// ============================================================================

/**
 * Theme options (shared with web).
 */
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * Font size options (shared with web).
 */
export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

// ============================================================================
// Text Page Types (the web `AppTextPage`'s, field for field)
// ============================================================================

/** A text section with paragraph content. */
export interface TextSectionWithContent {
  /** Section title */
  title: string;
  /** Paragraph content */
  content: string;
  /**
   * Whether `content` is HTML. There is no DOM here, so the inline tags a legal
   * page uses (`<strong>`, `<em>`, `<a href>`, `<br>`) are drawn and any other
   * tag is dropped, keeping its text.
   */
  isHtml?: boolean;
}

/** A text section with a list. */
export interface TextSectionWithList {
  /** Section title */
  title: string;
  /** Optional description before the list */
  description?: string;
  /** List items (inline HTML, as on the web) */
  items: string[];
  /** Optional additional content after the list */
  additionalContent?: string;
}

/**
 * A text section with subsections (e.g. "Information You Provide" and
 * "Information Collected Automatically").
 */
export interface TextSectionWithSubsections {
  /** Section title */
  title: string;
  /** Subsections, each with a title and list items */
  subsections: Array<{
    title: string;
    items: string[];
  }>;
}

/** Union type for all section types. */
export type TextSection =
  TextSectionWithContent | TextSectionWithList | TextSectionWithSubsections;

/** Contact information. */
export interface TextPageContactInfo {
  /** Email label (e.g., "Email:") */
  emailLabel: string;
  /** Email address */
  email: string;
  /** Website label (e.g., "Website:") */
  websiteLabel: string;
  /** Website URL */
  websiteUrl: string;
  /** Data Protection Officer label (optional, for privacy pages) */
  dpoLabel?: string;
  /** DPO email (optional, for privacy pages) */
  dpoEmail?: string;
}

/** GDPR notice (optional, for privacy pages). */
export interface GdprNotice {
  /** GDPR section title */
  title: string;
  /** GDPR section content */
  content: string;
}

/** Contact section. */
export interface TextPageContact {
  /** Section title */
  title: string;
  /** Section description */
  description: string;
  /** Whether description contains HTML */
  isHtml?: boolean;
  /**
   * Contact details. The web's structured `TextPageContactInfo`.
   *
   * @deprecated the `string` form — this package's earlier shape, kept so
   * existing screens still compile. It is drawn as plain lines; pass the
   * structured form so the addresses are links, as on the web.
   */
  info: TextPageContactInfo | string;
  /**
   * Optional GDPR notice (for privacy pages).
   *
   * @deprecated the `string` form — this package's earlier shape. Pass
   * `{ title, content }` as on the web.
   */
  gdprNotice?: GdprNotice | string;
}

/** All text content for the text page. */
export interface TextPageContent {
  /** Page title */
  title: string;
  /** Last updated text (use {{date}} as placeholder for the date) */
  lastUpdated?: string;
  /** All sections in order */
  sections: TextSection[];
  /** Contact information (optional) */
  contact?: TextPageContact;
}

// ============================================================================
// Settings Section Types
// ============================================================================

export interface SettingsSectionConfig {
  id: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
  label: string;
  description?: string;
  content: ReactNode;
}

// ============================================================================
// Subscription Types
// ============================================================================

export interface SubscriptionPageLabels {
  title?: string;
  subtitle?: string;
  currentPlan?: string;
  changePlan?: string;
  purchase?: string;
  restore?: string;
  restoreDescription?: string;
  monthly?: string;
  yearly?: string;
  lifetime?: string;
  free?: string;
  freePlanDescription?: string;
  mostPopular?: string;
  savePercent?: string;
  perMonth?: string;
  perYear?: string;
  oneTime?: string;
  features?: string;
  currentlyActive?: string;
  rateLimitsTitle?: string;
  rateLimitsDescription?: string;
}

export interface SubscriptionPageFormatters {
  formatPrice?: (price: number, currency: string) => string;
  formatPeriod?: (period: string) => string;
}
