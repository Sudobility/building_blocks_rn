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
  /** Icon component (RN style: accepts size and color) */
  icon: ComponentType<{ size?: number; color?: string }>;
  /** Route name for React Navigation */
  routeName: string;
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

// ============================================================================
// Layout Types
// ============================================================================

/**
 * Max width options for layout.
 * Maps to numeric pixel values in RN.
 */
export type MaxWidth =
  'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';

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
// Text Page Types (shared with web)
// ============================================================================

export interface TextSection {
  title: string;
  content?: string;
  items?: string[];
  subsections?: TextSection[];
}

export interface TextPageContact {
  title: string;
  description: string;
  info: string;
  gdprNotice?: string;
}

export interface TextPageContent {
  title: string;
  lastUpdated?: string;
  sections: TextSection[];
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
