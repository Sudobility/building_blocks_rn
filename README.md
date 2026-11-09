# @sudobility/building_blocks_rn

Higher-level shared UI building blocks for Sudobility React Native apps. Provides pre-built screens (login, settings, legal/text), theming, i18n, toast, and app-shell components.

This is a **library**, not an app — it is consumed by downstream RN apps and ships
built output in `dist/`. It targets **bare React Native** (`react-native >= 0.72`,
dev-pinned to 0.83.10), not Expo, and carries native iOS/macOS/Windows bridges
(see [Native desktop bridges](#native-desktop-bridges)). React, React Native,
navigation, safe-area, i18next, and the `@sudobility/*` packages are **peer
dependencies** — the host app provides them.

## Installation

The package is published to **GitHub Packages**, not the public npm registry, so the
consuming app needs an `.npmrc` pointing the `@sudobility` scope at it:

```
@sudobility:registry=https://npm.pkg.github.com
```

Then install (with the peer dependencies the host app does not already have):

```bash
bun add @sudobility/building_blocks_rn
```

Taking a new version requires a `pod install` in the consuming iOS/macOS app.

## Usage

```tsx
import {
  SudobilityAppRN,
  ThemeProvider,
  useTheme,
  LoginPage,
  AppScreenLayout,
  ToastProvider,
  useToast,
  createThemedStyles,
  initializeI18nRN,
} from '@sudobility/building_blocks_rn';

// Firebase-dependent imports (separate entry point)
import {
  SudobilityAppRNWithFirebaseAuth,
  ApiProvider,
  useApi,
} from '@sudobility/building_blocks_rn/firebase';
```

## API

### Main Entry (`@sudobility/building_blocks_rn`)

| Export | Description |
|--------|-------------|
| `SudobilityAppRN` | Base app wrapper composing providers (SafeArea, Theme, Toast, i18n, Query) |
| `LoginPage` | Full-screen sign-in page: app name, a heading that follows the mode, and `LoginView` from `@sudobility/components-rn` (email, sign-up, password reset, Google, Apple). For sign-in in the middle of a flow use components-rn's `LoginModal`. Mirrors the web `LoginPage` |
| `AppTextScreen` | Scrollable text/legal screen (e.g. terms, privacy) |
| `AppScreenLayout` | SafeAreaView wrapper with optional header/footer |
| `AppHeader` / `createAppHeaderOptions` | Themed navigation header + options factory |
| `AppFooter` | Footer bar |
| `BottomActionBar` | Pinned bottom action bar that pads by the safe-area inset |
| `EmptyState` | Empty/placeholder state view |
| `SettingsListScreen` | Settings menu with icon rows |
| `AppearanceSettings` | Theme and font size segmented controls |
| `LanguagePicker` | Modal language selector (16 languages) |
| `ThemeProvider` / `useTheme` / `useThemeSafe` | Light/dark theme with AsyncStorage persistence |
| `ToastProvider` / `useToast` | Animated toast notifications |
| `ErrorBoundary` | React error boundary |
| `createThemedStyles` | Memoized StyleSheet factory from theme colors |
| `initializeI18nRN` / `getI18n` | i18next setup with RN locale detection |
| `getDeviceLocaleTags` | Ordered device locale tags, including Windows `Intl` detection |
| `useResponsive` | Window dimension breakpoints (isSmall, isMedium, isLarge) |
| `useOrientation` / `useSizeClasses` / `useNotchPosition` | Device-layout hooks |
| `useIsRTL` / `useRTLTextStyle` | RTL helpers |
| `WebAuth` | Loopback OAuth bridge (macOS/Windows desktop sign-in) |
| `requestInAppReview` / `recordSuccessfulActionAndPromptForReview` | In-app review prompts |

> Subscription screens were moved to `@sudobility/subscription_pages_rn`; this
> package no longer ships subscription UI.

## Native desktop bridges

- macOS native modules live in `macos/` and are included by the package's
  CocoaPods specification. `WebAuthModule` is already shared here.
- Windows native sources live in `windows/`. React Native Windows apps that use
  these bridges manually include the relevant source files in their `.vcxproj`
  and register attributed modules with `AddAttributedModules`. `WebAuthModule`
  provides the PKCE/system-browser bridge; `FileSystemUtils.h` provides shared
  Windows base64 encoding for app-specific file-system modules.

### Firebase Entry (`@sudobility/building_blocks_rn/firebase`)

| Export | Description |
|--------|-------------|
| `SudobilityAppRNWithFirebaseAuth` | App wrapper with Firebase auth + API layers |
| `ApiProvider` / `useApi` | Network client context with auth token management |

## Development

```bash
bun install            # Install deps (Bun only — do not use npm)
bun run build          # Build TypeScript to dist/ (tsc + fix-esm-imports)
bun run dev            # Watch mode build
bun run clean          # Remove dist/
bun run typecheck      # Type-check (no emit)
bun run test:unit      # Run unit tests (vitest under jsdom)
bun run lint           # ESLint check (max 0 warnings)
bun run lint:fix       # Auto-fix ESLint issues
bun run format         # Prettier format
bun run format:check   # Prettier check
```

Tests run under jsdom with no real React Native: `vitest.config.ts` aliases
`react-native`, async-storage, safe-area-context, and `react-i18next` to
hand-written mocks in `src/__tests__/mocks/`.

## License

BUSL-1.1
