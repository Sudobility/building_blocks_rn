// Core components (no auth dependency)
export * from './src/components/header';
export * from './src/components/footer';
export * from './src/components/bottom-action-bar';
export * from './src/components/layout';
export * from './src/components/settings';
export * from './src/components/pages';
export * from './src/components/empty-state';

// App wrapper without auth dependency
export { SudobilityAppRN } from './src/app/SudobilityAppRN';
export type { SudobilityAppRNProps } from './src/app/SudobilityAppRN';

// SafeSubscriptionContext moved to @sudobility/subscription_pages_rn so this
// package keeps no subscription code (RN mirror of the web building_blocks /
// subscription_pages split).

// Theme
export * from './src/theme';

// Constants
export * from './src/constants';

// Types
export * from './src/types';

// Utils
export { createThemedStyles } from './src/utils';

// Hooks
export {
  useResponsive,
  useNotchPosition,
  useOrientation,
  useSizeClasses,
  NOTCH_POSITIONS,
  ORIENTATIONS,
  REGULAR_HEIGHT,
  REGULAR_WIDTH,
  SIZE_CLASSES,
  notchPositionFor,
  orientationFromInterface,
  orientationFromWindow,
  sizeClassFromInterface,
  sizeClassesFromWindow,
} from './src/hooks';
export type {
  ResponsiveInfo,
  EdgeInsets,
  NativeDeviceLayout,
  NotchPosition,
  Orientation,
  SizeClass,
  SizeClasses,
} from './src/hooks';

// Toast
export { ToastProvider, useToast } from './src/components/toast';
export type { Toast, ToastType } from './src/components/toast';

// Error Boundary
export { ErrorBoundary } from './src/components/error';
export type { ErrorBoundaryProps } from './src/components/error';

// i18n
export {
  initializeI18nRN,
  getI18n,
  i18n,
  getDeviceLocaleTags,
} from './src/i18n';
export type { I18nConfig } from './src/i18n';

// Native modules (desktop only)
export {
  WebAuth,
  authenticate as webAuthAuthenticate,
  generateCodeVerifier as webAuthGenerateCodeVerifier,
  sha256Base64Url as webAuthSha256Base64Url,
} from './src/native/WebAuth';

// Review prompts
export {
  isInAppReviewAvailable,
  requestInAppReview,
  recordSuccessfulActionAndPromptForReview,
} from './src/review';
export type { ReviewPromptOptions, ReviewPromptResult } from './src/review';
