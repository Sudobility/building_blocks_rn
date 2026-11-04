# building_blocks_rn - AI Development Guide

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it.

## Overview

Higher-level shared UI building blocks for Sudobility React Native apps. Provides pre-built screens (login, settings, subscriptions), theming, i18n, and app shell components -- the RN counterpart to `@sudobility/building_blocks` (web). This package is designed to be consumed by downstream Expo/React Native apps and supplies composable providers, themed components, and opinionated layout primitives.

- **Package**: `@sudobility/building_blocks_rn`
- **Version**: 0.0.8
- **License**: BUSL-1.1
- **Module format**: ESM (`"type": "module"`)
- **Package Manager**: Bun (never npm)
- **TypeScript**: ~5.9.2, target ES2020, bundler module resolution, strict mode
- **Build output**: `dist/` (declarations + JS)

## Two Entry Points (Main vs Firebase)

The package is split into two entry points to allow apps that do not use Firebase to avoid pulling in Firebase-related dependencies.

| Entry | Import Path | Purpose |
|-------|-------------|---------|
| **Main** | `@sudobility/building_blocks_rn` | Core components, theme, i18n, toast, settings, subscription UI -- no Firebase dependency |
| **Firebase** | `@sudobility/building_blocks_rn/firebase` | Firebase auth-dependent components: `SudobilityAppRNWithFirebaseAuth`, `ApiProvider`, `useApi`/`useApiSafe` |

### Main entry (`index.ts` at project root)

Exports everything that has zero Firebase dependency:

- All components: header, footer, layout, settings, pages (LoginPage, AppTextScreen, AppSubscriptionPage)
- `SudobilityAppRN` app wrapper
- Subscription context (`SafeSubscriptionContext`, `useSafeSubscription`, `SubscriptionScreen`)
- Full theme system (`ThemeProvider`, `useTheme`, `useThemeSafe`, palette, colors, spacing, typography)
- Constants (`DEFAULT_LANGUAGES`, `RTL_LANGUAGES`, `isRTL`)
- All shared types (enums: `Theme`, `FontSize`; interfaces: `MenuItemConfig`, `LogoConfig`, `FooterLinkItem`, etc.)
- Utility: `createThemedStyles`
- Hooks: `useResponsive`, `useOrientation`, `useSizeClasses`, `useNotchPosition` (see **Device layout** below)
- Toast: `ToastProvider`, `useToast`
- i18n: `initializeI18nRN`, `getI18n`, `i18n`

### Firebase entry (`firebase.ts` at project root)

Exports Firebase-coupled components only:

- `SudobilityAppRNWithFirebaseAuth` -- wraps `SudobilityAppRN` adding an `AuthProvider` and optional `ApiProviderComponent`
- `ApiProvider`, `ApiContext`, `useApi`, `useApiSafe` -- network client context with auth token management
- Types: `ApiContextValue`, `ApiProviderProps`, `NetworkClient`

## Project Structure

```
building_blocks_rn/
├── index.ts                        # Main entry point (re-exports from src/)
├── firebase.ts                     # Firebase entry point (re-exports from src/)
├── tsconfig.json                   # Base TS config (noEmit, path aliases)
├── tsconfig.build.json             # Build TS config (extends base, emits to dist/)
├── eslint.config.js                # Flat ESLint config (TS + React Hooks + Prettier)
├── .prettierrc                     # Prettier config (single quotes, trailing comma es5)
├── package.json
├── bun.lock
├── dist/                           # Build output (committed for consumers)
└── src/
    ├── types.ts                    # Shared type definitions & enums
    ├── app/
    │   ├── index.ts
    │   ├── SudobilityAppRN.tsx             # Base app wrapper (composable providers)
    │   └── SudobilityAppRNWithFirebaseAuth.tsx  # Firebase-aware app wrapper
    ├── api/
    │   ├── index.ts
    │   └── ApiContext.tsx                   # ApiProvider + NetworkClient + useApi hooks
    ├── components/
    │   ├── header/
    │   │   ├── index.ts
    │   │   └── AppHeader.tsx               # Logo + nav menu bar
    │   ├── footer/
    │   │   ├── index.ts
    │   │   └── AppFooter.tsx               # Copyright + footer links
    │   ├── layout/
    │   │   ├── index.ts
    │   │   └── AppScreenLayout.tsx         # SafeArea + ScrollView screen wrapper
    │   ├── pages/
    │   │   ├── index.ts
    │   │   ├── LoginPage.tsx               # Full-screen sign-in around components-rn LoginView
    │   │   ├── AppTextScreen.tsx           # Structured text content (privacy, terms)
    │   │   └── AppSubscriptionPage.tsx     # Full subscription page with status
    │   ├── settings/
    │   │   ├── index.ts
    │   │   ├── AppearanceSettings.tsx      # Theme + font size segmented controls
    │   │   ├── LanguagePicker.tsx          # Modal language selector with flags
    │   │   └── SettingsListScreen.tsx      # Settings menu list with icons
    │   ├── subscription/
    │   │   ├── index.ts
    │   │   ├── SubscriptionScreen.tsx      # Package selector with purchase/restore
    │   │   └── SafeSubscriptionContext.tsx  # Safe subscription context (stub default)
    │   └── toast/
    │       ├── index.ts
    │       └── ToastProvider.tsx            # Animated toast notifications
    ├── hooks/
    │   ├── index.ts
    │   └── useResponsive.ts                # Window dimension breakpoints
    ├── theme/
    │   ├── index.ts
    │   ├── ThemeContext.tsx                 # ThemeProvider + useTheme/useThemeSafe
    │   ├── colors.ts                       # Palette, ThemeColors, light/dark variants
    │   ├── spacing.ts                      # Spacing scale (xs..5xl)
    │   └── typography.ts                   # Font sizes, weights, size multiplier
    ├── i18n/
    │   └── index.ts                        # i18next init with RN locale detection
    ├── constants/
    │   ├── index.ts
    │   └── languages.ts                    # 16 languages, RTL support, LanguageConfig type
    └── utils/
        ├── index.ts
        └── styles.ts                       # createThemedStyles utility
```

## Key Components

### App Wrappers

**`SudobilityAppRN`** (`src/app/SudobilityAppRN.tsx`)
Base app wrapper that composes providers in a specific order (outermost to innermost):
1. `SafeAreaProvider` (outermost, always present)
2. `I18nextProvider` (if `i18n` instance provided)
3. `ThemeProvider` (or custom `ThemeProviderComponent`)
4. `QueryClientProvider` (if provided, e.g., TanStack React Query)
5. `ToastProvider` (or custom `ToastProviderComponent`)
6. `AppProviders` (custom additional providers, innermost)

Props: `i18n`, `ThemeProviderComponent`, `ToastProviderComponent`, `QueryClientProvider`, `AppProviders`, `initialTheme`, `storageKeyPrefix`.

**`SudobilityAppRNWithFirebaseAuth`** (`src/app/SudobilityAppRNWithFirebaseAuth.tsx`)
Extends `SudobilityAppRN` by adding Firebase auth and API layers. Wraps children with:
1. All `SudobilityAppRN` providers (outer)
2. `AuthProvider` (required prop -- Firebase auth context)
3. `ApiProviderComponent` (optional -- auth-aware API context, innermost)

### Screens

**`LoginPage`** (`src/components/pages/LoginPage.tsx`) — the web `LoginPage`, prop for prop
- **The sign-in architecture mirrors the web's, and this is one third of it.** `LoginView`
  (components-rn) is the form — email, sign-up, password reset, Google, Apple — and brings no
  page. `LoginPage` (here) is that form on a full screen: app name, a heading that follows the
  mode, the subtle page background. `LoginModal` (components-rn) is the same form in a modal.
  A screen somebody *navigates to* to sign in uses `LoginPage`; sign-in that *interrupts a flow*
  uses `LoginModal`, leaving them where they were.
- Props: `appName`, `logo`, `onEmailSignIn`, `onEmailSignUp`, `onPasswordReset`,
  `onGoogleSignIn`, `onAppleSignIn`, `onSuccess`, `onAuthError`, `showGoogleSignIn` (default
  true), `showAppleSignIn` (default false), `showSignUp`, `text` (`LoginPageText` = the view's
  strings + `signInToAccount`/`createAccount`/`resetPassword`), `colorVariant`, `appleLogoTone`.
- **No class is written here that an app would have to scan this package for.** Apps' Tailwind
  configs scan components-rn, not building_blocks_rn, so every colour comes through a
  components-rn component (`PageContainer`'s `bg-muted`, `Heading`, `LoginView`'s
  `linkClassName`) with classes that also occur in components-rn's own source; layout is `style`.
- It needs no `ThemeProvider` from this package: it follows the app's NativeWind theme.
- `LoginScreen`, the hand-built form it replaced (no reset, its own theme), is deleted.

**`AppTextScreen`** (`src/components/pages/AppTextScreen.tsx`)
- Renders structured `TextPageContent` (title, sections with subsections, bullet lists, contact block)
- Supports `ScreenWrapper` prop for custom layout wrapping
- Recursive `TextSectionView` renders nested subsections at heading levels 2 and 3
- Suitable for privacy policy, terms of service, and similar static content pages

**`AppSubscriptionPage`** (`src/components/pages/AppSubscriptionPage.tsx`)
- Full subscription management page with current subscription status card
- Displays active/inactive badge, plan name, expiration date, auto-renew status
- Package cards with features, pricing, "Most Popular" badge, and purchase buttons
- Restore purchases button with loading states
- Props: `currentStatus`, `packages`, `labels`, `formatters`, `onPurchase`, `onRestore`, `onTrack`

**`SubscriptionScreen`** (`src/components/subscription/SubscriptionScreen.tsx`)
- Simpler plan selector (no current status display)
- Package cards with purchase/restore flow
- Same purchase/restore callback pattern as AppSubscriptionPage
- `SubscriptionPackage` type: `{ id, title, description?, price, currency, period, features?, isMostPopular?, isCurrent? }`

**`SettingsListScreen`** (`src/components/settings/SettingsListScreen.tsx`)
- Scrollable settings menu with icon + label + description + chevron rows
- Accepts `SettingsSectionConfig[]` sections with `onSectionPress(sectionId)` callback
- Analytics tracking via `onTrack` prop

**`AppearanceSettings`** (`src/components/settings/AppearanceSettings.tsx`)
- Segmented controls for theme (Light/Dark/System) and font size (Small/Medium/Large)
- Accepts optional translation function `t(key, fallback)` for i18n
- Optional info box explaining preference storage

**`LanguagePicker`** (`src/components/settings/LanguagePicker.tsx`)
- Modal-based language selector using FlatList
- Defaults to `DEFAULT_LANGUAGES` (16 languages with emoji flags)
- Shows flag + name with checkmark for current selection
- Page sheet modal presentation on iOS

### Layout

**`AppHeader`** (`src/components/header/AppHeader.tsx`)
- Row layout: left section (logo + app name) and right section (menu icon buttons)
- `renderLeft` / `renderRight` override slots
- Companion `createAppHeaderOptions()` helper generates React Navigation `headerTitle` and `headerRight` options

**`AppFooter`** (`src/components/footer/AppFooter.tsx`)
- Copyright line with company name/link, version string, and configurable rights text
- Footer links row with dot separators; links can use `url` (Linking.openURL), `routeName`, or `onPress`
- Analytics tracking for link clicks via `onTrack`

**`AppScreenLayout`** (`src/components/layout/AppScreenLayout.tsx`)
- SafeAreaView (top, left, right edges) with optional header/footer slots
- Scrollable (default) or fixed content mode
- Content padding options: none (0), sm (8), md (16), lg (24)
- Background variants: default (theme background) or white (theme card)

### Providers

**`ThemeProvider`** (`src/theme/ThemeContext.tsx`)
- Light/dark mode with automatic system detection via `useColorScheme()`
- Persists user preference to AsyncStorage (key: `@building_blocks/theme`, customizable with `storageKeyPrefix`)
- Delays rendering children until persisted theme is loaded (prevents flash)
- Provides: `theme` (preference), `resolvedTheme` (actual), `colors`, `isDark`, `setTheme`

**`ToastProvider`** (`src/components/toast/ToastProvider.tsx`)
- Animated notifications positioned at top of screen (respects safe area insets)
- Slide-down + fade-in animation using RN Animated API (native driver)
- Toast types: success, error, warning, info (each maps to theme color)
- Auto-dismiss with configurable duration (default 3000ms), tap to dismiss
- Global counter for unique toast IDs

**`ApiProvider`** (`src/api/ApiContext.tsx`) -- Firebase entry only
- Network client context with typed HTTP methods (get, post, put, delete, request)
- Default fetch-based client with JSON content type
- Holds auth state: `token`, `userId`, `isReady`, `isLoading`, `refreshToken`
- Custom network client override via `networkClient` prop

**`SafeSubscriptionContext`** (`src/components/subscription/SafeSubscriptionContext.tsx`)
- Safe context that returns a stub value (`isSubscribed: false`) when no provider wraps the tree
- Allows components to read subscription state without crashing when provider is absent
- Interface: `{ isSubscribed, subscriptionPlan, expirationDate, isLoading }`

## Key Hooks

| Hook | Location | Return Type | Description |
|------|----------|-------------|-------------|
| `useTheme()` | `src/theme/ThemeContext.tsx` | `ThemeContextValue` | Theme colors, preference, isDark, setTheme. Throws if no ThemeProvider. |
| `useThemeSafe()` | `src/theme/ThemeContext.tsx` | `ThemeContextValue \| null` | Same as useTheme but returns null if no provider (no throw). |
| `useToast()` | `src/components/toast/ToastProvider.tsx` | `{ addToast, removeToast }` | `addToast(message, type?, duration?)` to show notifications. Throws if no ToastProvider. |
| `useApi()` | `src/api/ApiContext.tsx` | `ApiContextValue` | Network client + auth state. Throws if no ApiProvider. Firebase entry only. |
| `useApiSafe()` | `src/api/ApiContext.tsx` | `ApiContextValue \| null` | Same as useApi but returns null if no provider. Firebase entry only. |
| `useSafeSubscription()` | `src/components/subscription/SafeSubscriptionContext.tsx` | `SubscriptionContextValue` | Subscription state. Returns stub (not subscribed) if no provider -- never throws. |
| `useResponsive()` | `src/hooks/useResponsive.ts` | `ResponsiveInfo` | `{ width, height, isSmall (<380), isMedium (380-768), isLarge (>768) }` |

## Development Commands

```bash
bun run build          # Build TypeScript to dist/ (uses tsconfig.build.json)
bun run dev            # Watch mode build (tsc --watch)
bun run clean          # Remove dist/
bun run typecheck      # TypeScript check (no emit, uses tsconfig.json)
bun run lint           # ESLint check (TS/TSX, max 0 warnings)
bun run lint:fix       # Auto-fix ESLint issues
bun run format         # Format all src files with Prettier
bun run format:check   # Check formatting without writing
bun run test           # Placeholder (no tests configured yet)
```

Build note: `prepublishOnly` runs `bun run build` automatically before `npm publish`.

### TypeScript Configuration

- **tsconfig.json** (base): `target: ES2020`, `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `strict: true`, `noEmit: true`. Path alias: `@/*` maps to `./src/*`.
- **tsconfig.build.json** (build): Extends base. Overrides: `noEmit: false`, `declaration: true`, `outDir: ./dist`, `rootDir: .`. Excludes test files.

### Code Style

- **ESLint**: Flat config (`eslint.config.js`). Uses `@typescript-eslint`, `react-hooks` (v7 with strict rules disabled: `set-state-in-effect`, `purity`, `static-components`, `refs`), `react-refresh` (permissive), and `prettier` plugin. Unused vars error with `_` prefix ignored.
- **Prettier**: Single quotes, 2-space indent, trailing comma es5, 80 char line width, JSX single quotes, arrow parens avoid.

## Theme System

### Color Palette

The palette (`src/theme/colors.ts`) mirrors Tailwind CSS color tokens:

- **Primary**: Blue scale (50-900), uses 600 for light mode, 400 for dark mode
- **Gray**: Neutral scale (50-900) for backgrounds, text, borders
- **Semantic**: success (#22c55e), error (#ef4444), warning (#f59e0b), info (#3b82f6)

### ThemeColors Interface (20 properties)

`primary`, `background`, `card`, `text`, `textSecondary`, `textMuted`, `border`, `notification`, `surface`, `surfaceSecondary`, `error`, `errorBg`, `success`, `successBg`, `successText`, `warning`, `info`, `invertedText`, `invertedBackground`

Light mode uses white/light-gray surfaces; dark mode uses gray-800/900 surfaces with inverted text colors.

### Spacing Scale

Defined in `src/theme/spacing.ts` (values in logical pixels):

| Key | Value |
|-----|-------|
| xs | 4 |
| sm | 8 |
| md | 12 |
| lg | 16 |
| xl | 20 |
| 2xl | 24 |
| 3xl | 32 |
| 4xl | 40 |
| 5xl | 48 |

### Typography Scale

Defined in `src/theme/typography.ts`:

- **Font sizes**: xs (12), sm (14), base (16), lg (18), xl (20), 2xl (24), 3xl (30), 4xl (36)
- **Font weights**: normal (400), medium (500), semibold (600), bold (700)
- **Font size multiplier**: `getFontSizeMultiplier(fontSize)` returns 0.875 (small), 1.0 (medium), 1.125 (large)

### createThemedStyles Utility

`createThemedStyles(factory)` in `src/utils/styles.ts` creates a custom hook that generates memoized `StyleSheet` objects from theme colors:

```tsx
const useStyles = createThemedStyles((colors) => ({
  container: { backgroundColor: colors.background },
  text: { color: colors.text },
}));

function MyComponent() {
  const styles = useStyles();
  return <View style={styles.container}><Text style={styles.text}>Hello</Text></View>;
}
```

This is the standard pattern used by every component in this package. The returned styles are memoized via `useMemo` and only recompute when `colors` changes (i.e., theme switch).

## Internationalization

### Setup

i18n is initialized via `initializeI18nRN(config)` in `src/i18n/index.ts`:

- Uses `i18next` + `react-i18next` (no HTTP backend -- bundled translations only)
- Device language auto-detection via `react-native-localize` (optional peer dependency; falls back to `'en'`)
- Safe to call multiple times -- only initializes once (module-level `initialized` flag)
- Chinese fallback chain: `zh -> zh -> en`, `zh-hant -> zh-hant -> zh -> en`

### Configuration

```typescript
interface I18nConfig {
  supportedLanguages?: string[];    // Default: ['en']
  namespaces?: string[];            // Default: ['common','home','settings','auth','privacy','terms']
  defaultNamespace?: string;        // Default: 'common'
  resources?: Record<string, Record<string, Record<string, string>>>;
  debug?: boolean;                  // Default: false
}
```

### Built-in Languages (16)

Defined in `src/constants/languages.ts` as `DEFAULT_LANGUAGES`:

English, Arabic, German, Spanish, French, Italian, Japanese, Korean, Portuguese, Russian, Swedish, Thai, Ukrainian, Vietnamese, Simplified Chinese, Traditional Chinese.

Each `LanguageConfig` has `{ code, name, flag }` where flag is a Unicode emoji flag.

### RTL Support

- `RTL_LANGUAGES` array currently contains `['ar']` (Arabic)
- `isRTL(languageCode)` helper function returns boolean

## Architecture / Patterns

### Provider Composition

The app wrappers follow a composable provider pattern. `SudobilityAppRN` nests providers from outermost (SafeAreaProvider) to innermost (AppProviders). Each provider slot is optional and replaceable via props. `SudobilityAppRNWithFirebaseAuth` extends this by inserting auth layers between the base providers and the app content.

### Safe vs Throwing Hooks

Every context follows a dual-hook convention:
- `useX()` -- throws if context is missing (for required providers)
- `useXSafe()` -- returns `null` if context is missing (for optional providers)

Exception: `useSafeSubscription()` uses a default context value (stub) rather than null, so it never throws and never returns null.

### Themed Styling

All components use `createThemedStyles(colorFactory)` instead of plain `StyleSheet.create()`. This ensures styles automatically respond to theme changes. The factory receives `ThemeColors` and returns a style object. The returned hook is called inside each component.

### Analytics Integration

Components accept an optional `onTrack: (params: AnalyticsTrackingParams) => void` prop for analytics. The `AnalyticsTrackingParams` type includes `eventType`, `componentName`, `label`, and optional `params`. Event types: `button_click`, `link_click`, `navigation`, `settings_change`, `subscription_action`, `page_view`.

### Translation Support

Settings components (e.g., `AppearanceSettings`) accept an optional `t(key, fallback)` function for i18n. If not provided, the English fallback string is used. This keeps the components decoupled from i18next while supporting translation when available.

### Type Parity with Web

Types in `src/types.ts` mirror `@sudobility/building_blocks` (web) where possible, adapted for RN conventions:
- `style` instead of `className`
- `onPress` instead of `href`/`onClick`
- Icon components accept `{ size?: number; color?: string }` instead of CSS class names

### Entry Point Separation

The root `index.ts` and `firebase.ts` re-export from `src/` submodules. This separation is enforced at the package.json `exports` field level, ensuring tree-shaking boundaries. Firebase-dependent code is never pulled in by the main entry point.

## Common Tasks

### Adding a new screen component

1. Create the component file in `src/components/` under the appropriate subfolder (e.g., `pages/`, `settings/`)
2. Use `createThemedStyles()` for all styling (follow existing component patterns)
3. Accept `style?: StyleProp<ViewStyle>` for custom styling and `onTrack?` for analytics
4. Export from the subfolder's `index.ts`
5. Re-export from the root `index.ts` (or `firebase.ts` if it depends on Firebase/auth)
6. Run `bun run typecheck` and `bun run lint:fix`

### Adding a new theme color

1. Add the property to the `ThemeColors` interface in `src/theme/colors.ts`
2. Provide values in both `lightColors` and `darkColors` objects
3. Use via `useTheme().colors.yourNewColor` or within `createThemedStyles(colors => ...)`

### Adding a new hook

1. Create the hook file in `src/hooks/` (e.g., `useMyHook.ts`)
2. Export from `src/hooks/index.ts`
3. Re-export from the root `index.ts` (or `firebase.ts`)
4. Follow the safe/throwing dual-hook convention if the hook depends on context

### Adding a new provider

1. Create the context + provider in a new subfolder under `src/` or `src/components/`
2. Provide both `useX()` (throwing) and `useXSafe()` (nullable or stub) hooks
3. If the provider should be part of the app wrapper, add it as an optional slot in `SudobilityAppRN` or `SudobilityAppRNWithFirebaseAuth`
4. Export from the appropriate root entry point

### Adding a new language

1. Add a `LanguageConfig` entry to `DEFAULT_LANGUAGES` in `src/constants/languages.ts`
2. If the language is RTL, add its code to `RTL_LANGUAGES`
3. Provide translation resources in the consuming app via `initializeI18nRN({ resources: ... })`

### Modifying the build

- Build config: `tsconfig.build.json` (extends `tsconfig.json`)
- Entry files are `index.ts` and `firebase.ts` at project root; they re-export from `src/`
- Output goes to `dist/` with both JS and `.d.ts` declaration files
- The `exports` field in `package.json` maps `.` and `./firebase` to their respective dist files

## Peer / Key Dependencies

### Required Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.0.0 \|\| ^19.0.0 | React core |
| `react-native` | >=0.72.0 | React Native framework |
| `react-native-safe-area-context` | >=4.0.0 | SafeAreaProvider/View |
| `@react-navigation/native` | >=7.0.0 | Navigation framework |
| `@react-navigation/native-stack` | >=7.0.0 | Stack navigator |
| `i18next` | ^23 \|\| ^24 \|\| ^25 | i18n core |
| `react-i18next` | ^14 \|\| ^15 \|\| ^16 | React bindings for i18next |
| `@react-native-async-storage/async-storage` | >=1.0.0 | Persisted theme preference |

### Optional Peer Dependencies

| Package | Purpose |
|---------|---------|
| `firebase` | Required for `@sudobility/building_blocks_rn/firebase` entry |
| `@tanstack/react-query` | QueryClientProvider slot in SudobilityAppRN |
| `react-native-purchases` | RevenueCat integration for subscription flows |
| `react-native-localize` | Device language detection for i18n |
| `react-native-gesture-handler` | Gesture support for navigation/modals |
| `@sudobility/types` | Shared Sudobility type definitions |

### Dev Dependencies (notable)

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.2 | TypeScript compiler |
| `eslint` | ^9.38.0 | Linting (flat config) |
| `prettier` | ^3.6.2 | Code formatting |
| `@typescript-eslint/*` | ^8.44.1 | TypeScript ESLint integration |
| `eslint-plugin-react-hooks` | ^7.0.0 | React Hooks lint rules |
| `@tanstack/react-query` | ^5.90.19 | Dev-time type checking |
| `@sudobility/types` | ^1.9.53 | Dev-time type checking |

## Git Workflow

- Do not use feature branches for code changes. Always stay on the current branch.

## Device layout

`useOrientation()` answers `portrait`, `portraitUpsideDown`, `landscapeLeft` or `landscapeRight`; `useSizeClasses()` answers iOS's `compact`/`regular` per axis on every platform; `useNotchPosition()` answers which edge the notch is at as the device is held now, or `null` on a device without one. The rules are pure functions in `src/hooks/device-layout.ts`, tested on their own.

- **`landscapeLeft` means the notch is on the left.** That is what a layout needs to know. UIKit's `UIInterfaceOrientationLandscapeLeft` turns out to mean the same side — **measured on an iPhone**, against its documentation's talk of home buttons, which reads the other way and had the first mapping backwards, padding the right when the island was on the left. `orientationFromInterface` is the one place the two meet; do not "fix" it from the docs.
- **iOS answers natively** (`ios/DeviceLayoutModule.m`, an `RCTEventEmitter`; `building_blocks_rn.podspec`, one spec for iOS and macOS, so a consumer has to `pod install` after taking this version). JavaScript can see the window's shape and the safe area, but iOS insets both sides of a landscape iPhone alike, so which side the notch is on cannot be read from them; the size classes cannot be read at all. The module's constants carry the first answer synchronously, so the first render is right rather than a guess.
- **Every other platform estimates**: Android's cutout insets the one side it is on, which is enough for the orientation; size classes are drawn at `REGULAR_WIDTH`/`REGULAR_HEIGHT`, near where iOS draws its own. A consumer that has not run `pod install` is treated as such a platform, not as broken.
- **Whether there is a notch is read off the insets**: an inset on a landscape side, or a top inset past the status bar's own height. A phone without one has no side to clear, and `useNotchPosition` says so with `null` rather than naming a side there is nothing on.
- **The config file is `react-native.config.cjs`, and the podspec is named after the package folder.** This package is `"type": "module"`, so a `react-native.config.js` is loaded as ESM and its `module.exports` is never seen — the CLI read `{}` and linked nothing on iOS. And autolinking ignores `podspecPath` in that config anyway: it takes `<folder>.podspec` if one exists and the first `*.podspec` by name otherwise, which with an iOS and a macOS spec side by side was the macOS one for iOS. So there is one `building_blocks_rn.podspec` with per-platform sources.

## Screen rendering — safe area & scroll insets

Honour the device safe area on **every** screen. Always use `useSafeAreaInsets()`
from `react-native-safe-area-context` (or a `SafeAreaView` with explicit `edges`)
and pad by the actual inset value. **Never hard-code a padding/margin in place of
an inset** — a magic number like `paddingBottom: 80` happens to clear today's
phone and is wrong on the next one.

Decide per axis, by whether that axis scrolls:

**Vertical:**
- **NOT vertically scrollable** (a fixed screen, a pinned footer/CTA, a camera
  overlay): the content area must stop at the **top and bottom** safe-area insets
  — pad top by `insets.top`, bottom by `insets.bottom`. It must not reach the
  physical top/bottom edge (status bar / notch / home indicator).
- **Vertically scrollable**: let the scroll view render **full-bleed** to the top
  and bottom edges, and give it top/bottom **scroll insets** equal to the safe
  area (`contentInset` + `scrollIndicatorInsets`, or
  `contentInsetAdjustmentBehavior="automatic"`). Content then starts/ends clear of
  the unsafe regions while still scrolling edge-to-edge behind them.

**Horizontal** (landscape, display cutout, rounded corners):
- **NOT horizontally scrollable**: pad left/right by `insets.left` / `insets.right`.
- **Horizontally scrollable**: render to the left/right edges and give it
  left/right scroll insets.

**Bottom CTAs under a tab bar — the trap that burns everyone:** inside a tab
navigator, the bottom safe-area inset (`insets.bottom`, and what a shared
`BottomActionBar` reads) **already includes the tab-bar height**. So a pinned
bottom bar padded by `insets.bottom` already lands above the tab bar. Therefore:
- DO pad the bottom bar by `insets.bottom` and nothing more.
- DON'T add the tab-bar height on top of the inset, and DON'T reserve it again on
  the screen root — that double-counts and floats the CTA too high.
- DON'T pass a `tabBarHeight` (or similar) that makes the bar swap the inset for a
  flat fixed gap — that ignores the inset and drops the CTA under the tab bar.

Canonical fixed-screen shape: a flex-column root → the content/scroll region →
a bottom action bar as the **last child** that pads by `insets.bottom` with no
manual tab-bar math. Copy a screen already doing this correctly (e.g. a Settings
screen with a Sign-Out button) rather than re-deriving the padding.
