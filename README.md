# @sudobility/building_blocks_rn

Higher-level shared UI building blocks for Sudobility React Native apps. Provides pre-built screens (login, settings, legal/text), theming, i18n, toast, and app-shell components.

It is the React Native **mirror of `@sudobility/building_blocks`** (web): the
same exports, props, sections, wording and data model, with native idioms in
place of DOM ones. See [Mirror of the web package](#mirror-of-the-web-package).

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
  initializeI18n,
} from '@sudobility/building_blocks_rn';

// Auth-aware imports (separate entry point)
import {
  SudobilityAppRNWithFirebaseAuth,
  AuthQueryCacheReset,
  ApiProvider,
  useApi,
} from '@sudobility/building_blocks_rn/firebase';
```

### Following the app's theme

The building blocks follow the app, as the web ones follow the page:

```tsx
// An app with its own theme setting passes what it resolved. It wins over
// this provider's stored preference and over the device.
<ThemeProvider colorScheme={isDark ? 'dark' : 'light'}>{children}</ThemeProvider>
```

- With no `ThemeProvider` at all, a building block draws in the device's
  scheme (which NativeWind's `colorScheme.set()` drives on iOS/Android) — it
  does not throw.
- The colours are the `@sudobility/design` theme the app passed to
  `configureTheme()`, in that scheme (`getThemeColors`, `useThemeColors`).

## API

### Main Entry (`@sudobility/building_blocks_rn`)

| Export | Description |
|--------|-------------|
| `SudobilityAppRN` | Base app wrapper composing providers (SafeArea, Theme, Toast, i18n, Query) |
| `LoginPage` | Full-screen sign-in page: app name, a heading that follows the mode, and `LoginView` from `@sudobility/components-rn` (email, sign-up, password reset, Google, Apple). For sign-in in the middle of a flow use components-rn's `LoginModal`. Mirrors the web `LoginPage` |
| `AppTextScreen` | Text/legal screen (terms, privacy) from the web's `TextPageContent`: paragraphs, lists, subsections, contact panel with links, GDPR notice. Mirrors the web `AppTextPage` |
| `AppShell` / `AppScreenLayout` | The screen shell and its layout: SafeAreaView, header/footer slots, scroll, the web's page options (`maxWidth`, `contentPadding`, `background`) |
| `PageConfigProvider` / `useSetPageConfig` / `usePageConfig` | A screen overrides the shell's layout for as long as it is mounted |
| `AppHeader` / `AppHeaderWithFirebaseAuth` / `createAppHeaderOptions` | Header bar (logo, center, menu items, language selector, account section); the same with an auth action; options factory for React Navigation. Mirrors the web `AppTopBar` / `AppTopBarWithFirebaseAuth` |
| `AuthActionView` / `createAuthAction` | "Log in" button when signed out, avatar + menu when signed in |
| `AppFooter` / `getCopyrightYear` | Compact footer: version, copyright line, optional status indicator, links |
| `BottomActionBar` | Pinned bottom action bar that pads by the safe-area inset |
| `EmptyState` | Empty/placeholder state view |
| `RequireSignIn` / `createRequireSignIn` | Gate a screen that needs an account without leaving it |
| `SettingsListScreen` | Settings menu with icon rows |
| `AppearanceSettings` | Theme and font size settings, with the web's wording and translation keys |
| `LanguageSelector` / `LanguagePicker` | Modal language selector (15 languages), compact or full; `LanguagePicker` is the full variant |
| `ThemeProvider` / `useTheme` / `useThemeSafe` | Light/dark theme with AsyncStorage persistence; `colorScheme` to follow the app's own setting |
| `useThemeColors` / `useResolvedColorScheme` / `getThemeColors` | The colours and scheme building blocks draw in — with or without a `ThemeProvider` |
| `ToastProvider` / `useToast` | Animated toast notifications |
| `ErrorBoundary` | React error boundary |
| `createThemedStyles` | Memoized StyleSheet factory from theme colors |
| `initializeI18n` (`initializeI18nRN`) / `getI18n` | i18next setup with RN locale detection |
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
| `SudobilityAppRNWithFirebaseAuth` | App wrapper: `AuthProviderWrapper` > `ApiProvider` > `AppProviders` > content (app providers are inside auth and API, as on the web); pass `queryClient` to reset the cache on a change of user |
| `AuthQueryCacheReset` | Drops the query cache when the signed-in user signs out or changes |
| `ApiProvider` / `useApi` / `useApiSafe` | API context (network client, base URL, token, user id, `testMode`). The app hands it the token and user id |

## Mirror of the web package

| `@sudobility/building_blocks` | here |
|---|---|
| `LoginPage`, `EmptyState`, `RequireSignIn`, `AppFooter`, `AppearanceSettings`, `LanguageSelector`, `AuthActionView`, `createAuthAction`, `AppShell`, `PageConfig*`, `ApiProvider`, languages, analytics types | same names |
| `AppTextPage` | `AppTextScreen` |
| `AppPageLayout` | `AppScreenLayout` |
| `AppTopBar`, `AppTopBarWithFirebaseAuth` | `AppHeader`, `AppHeaderWithFirebaseAuth` |
| `SudobilityApp`, `SudobilityAppWithFirebaseAuth` | `SudobilityAppRN`, `SudobilityAppRNWithFirebaseAuth` |
| `initializeI18n` | `initializeI18n` (bundled `resources` instead of `loadPath`) |

Web-only by nature and deliberately absent: breadcrumbs, the sitemap page, the
landing-page footer, the wallet top bar, link/router components, `cn`, and the
wrapper's Helmet, router and route-based page tracker.

Not mirrored yet: `GlobalSettingsPage`, `MasterDetailPage`, a self-managing
`ApiProvider`, and the wrapper's default `QueryClient`, `NetworkProvider` and
`InfoBanner`.

### Packaging note

Apps load this package from compiled `dist`. NativeWind styles `className` only
in JSX the app's own Babel compiles, so nothing here puts a `className` on a
core React Native component — it would be ignored. Styling is `style` /
`createThemedStyles`; `LoginPage` alone passes classes, as props, to
`@sudobility/components-rn` components.

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
