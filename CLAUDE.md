# building_blocks_rn (@sudobility/building_blocks_rn)

> **Git policy — never auto-commit or auto-push.** Leave your work in the
> working tree. Run `git commit`, `git push`, `gh pr create` or
> `scripts/push_all.sh` **only when the user explicitly asks in that turn.** Do
> not use feature branches; stay on the current branch.

Higher-level shared UI building blocks for Sudobility React Native apps — the RN
counterpart to `@sudobility/building_blocks` (web). Pre-built screens (login,
settings, legal/text), the theme system, i18n, toast, the app
shell and layout primitives, consumed by downstream apps. Subscription screens
now live in `@sudobility/subscription_pages_rn` — none ship here. BUSL-1.1, ESM
(`"type": "module"`), Bun only (never npm). TS strict, bundler resolution,
`@/*` → `./src/*`. Build output is `dist/` (JS + `.d.ts`) — git-ignored, built
by `prepublishOnly`, and the only code consumers get (`files` ships no `src`).

Lower-level primitives (`Button`, `Select`, `LoginView`/`LoginModal`, the
sliders) are `@sudobility/components-rn`; build on those and never author a
Tailwind class here (see the NativeWind note). Types and closed lists are
`@sudobility/types`; the palette is `@sudobility/design`.

## Mirror of `@sudobility/building_blocks` (web)

This package is the web package's mirror: the same exports (under the same
name, or the RN name below), the same props, the same sections in the same
order with the same wording and states, the same data model. **Change the web
component and this one together.** RN idioms are not divergences (`style` for
`className`, `onPress` for `onClick`/`href`, a modal for a dropdown, a
segmented control for a select, `Linking` for an anchor, safe-area handling).

| Web | Here |
|-----|------|
| `LoginPage` | `LoginPage` |
| `AppTextPage` + `TextPageContent`, `TextSection*`, `TextPageContact(Info)`, `GdprNotice` | `AppTextScreen` + the same types (`PageWrapper` → `ScreenWrapper`) |
| `AppearanceSettings`, `AppearanceSettingsTranslations`, `Theme`, `FontSize` | same names, same translation keys |
| `GlobalSettingsPage` | **not built** — `SettingsListScreen` is only its navigation list |
| `EmptyState` | `EmptyState` (button optional here) |
| `RequireSignIn`, `createRequireSignIn` | same (+ `signedOut` to draw the app's own signed-out screen) |
| `AppFooter`, `getCopyrightYear`, `SystemStatusIndicatorProps` | same |
| `AppTopBar` | `AppHeader` |
| `AppTopBarWithFirebaseAuth` | `AppHeaderWithFirebaseAuth` |
| `AuthActionView`, `createAuthAction`, `AuthMenuItem`, `AuthActionProps` | same |
| `LanguageSelector` | `LanguageSelector` (`LanguagePicker` = its full variant, earlier name) |
| `AppShell`, `AppPageLayout`, `AppPageProps` | `AppShell`, `AppScreenLayout`, `PageConfig` (alias `AppPageProps`) |
| `PageConfigContext`, `PageConfigProvider`, `usePageConfig`, `useSetPageConfig` | same |
| `SudobilityApp` | `SudobilityAppRN` |
| `SudobilityAppWithFirebaseAuth` (+ internal `AuthQueryCacheReset`) | `SudobilityAppRNWithFirebaseAuth`, `AuthQueryCacheReset` |
| `ApiProvider`, `ApiContext`, `useApi`, `useApiSafe` | same value; the provider is handed its token (see below) |
| `DEFAULT_LANGUAGES`, `RTL_LANGUAGES`, `isRTL`, `LanguageConfig` | same, entry for entry |
| `initializeI18n`, `getI18n`, `i18n`, `I18nConfig` | same (`initializeI18nRN` is the earlier name); bundled `resources` for `loadPath` |
| analytics / layout types (`AnalyticsTrackingParams`, `MaxWidth`, …) | same |

**Web-only by nature, deliberately absent:** `AppBreadcrumbs` and the
breadcrumbs context (a URL trail and share-this-URL; a stack's back button is
the trail), `AppSitemapPage` (SEO), `AppFooterForHomePage` and
`SocialLinksConfig` (the landing-page footer), `AppTopBarWithWallet` (needs the
web-only `@sudobility/web3-components` dropdown), `LinkComponentProps` /
`DefaultLinkComponent` (anchors and routers), `cn` (no classes are authored
here), and in the app wrapper `HelmetProvider`, `RouterWrapper` and the
route-based `PageTracker`.

**Not mirrored yet** (each needs a dependency or design decision — do not
half-build): `GlobalSettingsPage` and `MasterDetailPage` (on components-rn's
`MasterDetailLayout`); a self-managing `ApiProvider` and a default one in the
Firebase wrapper (needs `@sudobility/auth_lib`); the wrapper's default
`QueryClient`, `NetworkProvider` and `InfoBanner` (need `@tanstack/react-query`
and `@sudobility/di_rn` as hard peers); `LoginPage`'s dev-time misconfiguration
warnings (a `console.warn` is a LogBox toast here).

`src/__tests__/webParity.test.ts` checks the language list against the web
source when `../building_blocks` is checked out beside this repo.

## Two entry points

Split so apps that do not use Firebase never pull it in, enforced at the
`package.json` `exports` level.

- `@sudobility/building_blocks_rn` (`index.ts`) — everything with zero Firebase
  dependency: components, pages, `SudobilityAppRN`, theme, i18n, toast,
  constants, hooks.
- `@sudobility/building_blocks_rn/firebase` (`firebase.ts`) —
  `SudobilityAppRNWithFirebaseAuth`, `AuthQueryCacheReset`,
  `ApiProvider`/`useApi`/`useApiSafe`. (The name is the web's; nothing in it
  imports Firebase — the app hands `ApiProvider` its token and user id.)

## Commands

- `bun run build` — `tsc -p tsconfig.build.json` then
  `scripts/fix-esm-imports.mjs` (rewrites emitted imports to real ESM paths);
  `bun run dev` watches. `prepublishOnly` builds.
- `bun run typecheck` · `bun run lint` (max 0 warnings) · `bun run lint:fix` ·
  `bun run format`
- `bun run test:unit` — vitest under jsdom. There is no React Native in it:
  `vitest.config.ts` aliases `react-native`, `async-storage`,
  `safe-area-context` and `react-i18next` to hand-written mocks under
  `src/__tests__/mocks/`.

## Conventions

- **Dual hooks per context.** `useX()` throws when its provider is missing;
  `useXSafe()` returns `null` (e.g. `useTheme`/`useThemeSafe`,
  `useApi`/`useApiSafe`).
- **Themed styling is `createThemedStyles(colors => …)`** (`src/utils/styles.ts`),
  never bare `StyleSheet.create` — it memoizes per theme and recomputes on a
  theme switch. Every component uses it. Inside a component read colours with
  `useThemeColors()`, **never `useTheme()`**: `useTheme()` throws without a
  `ThemeProvider`, and apps with a theme of their own do not mount one (see
  "Following the host's theme").
- **Components take optional `onTrack` for analytics** and an optional
  `t(key, fallback)` for i18n, so they stay decoupled from i18next.
- **Types mirror the web** adapted to RN: `style` not `className`, `onPress` not
  `href`, icon props `{ size?, color? }` not CSS classes.
- **Provider order in `SudobilityAppRN`** (outer→inner): `ErrorBoundary`,
  `SafeAreaProvider`, `I18nextProvider`, `ThemeProvider`, `QueryClientProvider`,
  `ToastProvider`, `AppProviders`, `Suspense` (when `LoadingFallback` is
  given). Each slot is optional/replaceable.
  `SudobilityAppRNWithFirebaseAuth` adds, inside those: `AuthProviderWrapper` >
  `ApiProvider` > `AppProviders` > content — **`AppProviders` is inside auth
  and API, as on the web**, so it can read both (`entity_pages_rn`'s entity
  provider depends on that). Given a `queryClient` it also mounts
  `AuthQueryCacheReset`. The web prop names are the primary ones;
  `AuthProvider`, `ApiProviderComponent`, `ThemeProviderComponent`,
  `ToastProviderComponent` are kept as deprecated aliases.

## Gotchas

- **The RN CLI config is `react-native.config.cjs`, not `.js`.** This package is
  `"type": "module"`, so a `.js` config loads as ESM, its `module.exports` is
  never seen, and iOS links nothing. **One `building_blocks_rn.podspec`** with
  per-platform sources: autolinking ignores `podspecPath` and takes
  `<folder>.podspec`, so a separate macOS spec beside it was picked for iOS.
  Taking a new version means a consumer must `pod install`.
- **Author no Tailwind/NativeWind class here**, and never put `className` on a
  core component (`View`, `Text`, `Pressable`, …). Apps load this package from
  compiled `dist`, which calls `react/jsx-runtime` directly — NativeWind only
  styles JSX the *app's* Babel compiles — so such a `className` is silently
  ignored and the screen renders unstyled. A class may only be passed as a prop
  to a `components-rn` component (that package is compiled from source), and
  only a class that already occurs in components-rn's source, since apps'
  Tailwind scans that package and not this one. `LoginPage` is the one place
  that does it. Everything else is `style`. `webParity.test.ts` enforces both
  halves. Do not switch this package to `"react-native": "src/…"` to get
  `className`: it has native code and nine consumers.
- **Sign-in is three parts, mirroring the web.** `LoginView` (components-rn) is
  the form; `LoginPage` (here) is that form on a full screen somebody
  *navigates to*; `LoginModal` (components-rn) is the same form interrupting a
  flow. `LoginPage` follows the app's NativeWind theme and needs no
  `ThemeProvider` from this package.
- **i18n is bundled, never fetched** (`initializeI18n` / `initializeI18nRN`,
  idempotent). Device language via `react-native-localize` (optional, falls
  back to `en`). Chinese fallback: `zh→zh→en`, `zh-hant→zh-hant→zh→en`.
  `DEFAULT_LANGUAGES` is the web's 15 languages; `RTL_LANGUAGES` is empty, as
  on the web.
- **`ThemeProvider` delays children until the persisted theme loads** (AsyncStorage,
  key `@building_blocks/theme`, `storageKeyPrefix` configurable) to avoid a
  flash — unless it is given `colorScheme`. Provides `theme`, `resolvedTheme`,
  `colors`, `isDark`, `setTheme`.
- **Following the host's theme.** The web blocks have no theme state: they
  carry design-token classes and follow the host document. Here:
  (1) `<ThemeProvider colorScheme={isDark ? 'dark' : 'light'}>` — an app with
  its own theme setting passes what it resolved, which wins over the stored
  preference and the device; (2) with **no** `ThemeProvider`, a block draws in
  the device scheme (`useColorScheme()`, which NativeWind's `colorScheme.set()`
  drives on iOS/Android) instead of throwing; (3) the palette is
  `getThemeColors(scheme)` — the theme the host passed to
  `@sudobility/design`'s `configureTheme()`, not a fixed one. `lightColors` /
  `darkColors` are the default theme's.
- **`AppTextScreen` draws HTML as inline text** (`src/utils/inline-html.tsx`):
  list items and `isHtml` content are HTML on the web
  (`dangerouslySetInnerHTML`); here `<strong>/<em>/<u>/<a href>/<br>` are drawn,
  other tags dropped, entities decoded. `contact.info` / `contact.gdprNotice`
  also still accept this package's earlier plain strings (deprecated).

## Native modules (`src/native/` JS over `ios/`, `macos/`, `windows/`)

- **`DeviceLayout`** — `useOrientation()`/`useSizeClasses()`/`useNotchPosition()`.
  Rules are pure in `src/hooks/device-layout.ts`, tested on their own. iOS
  answers natively (`ios/DeviceLayoutModule.m`, `RCTEventEmitter`, constants
  synchronous so the first render is right); every other platform estimates from
  insets. **`landscapeLeft` means the notch is on the left** — measured on an
  iPhone, which is the opposite of what UIKit's docs read like;
  `orientationFromInterface` is the one place the two meet, do not "fix" it from
  the docs. Notch presence is read off the insets; no notch → `useNotchPosition`
  is `null`.
- **`WebAuth`** (`macos/`, `windows/WebAuthModule`) — loopback OAuth
  (`http://127.0.0.1:<port>/callback`) for the desktop Google "Desktop app"
  client, used by the Windows/macOS sign-in.
- **`InAppReview`** (`src/review/`, `macos/InAppReviewModule`,
  `react-native-in-app-review`).

## Structure

- `index.ts` / `firebase.ts` — the two entry points, re-export from `src/`.
- `src/app/` — `SudobilityAppRN`, the Firebase-aware wrapper and
  `AuthQueryCacheReset`.
- `src/api/` — `ApiProvider` + `NetworkClient` + `useApi` (firebase entry only).
- `src/components/` — `header` (`AppHeader`, `AppHeaderWithFirebaseAuth`,
  `AuthAction`), `footer`, `layout` (`AppShell`, `AppScreenLayout`,
  `PageConfig`), `pages` (`LoginPage`, `AppTextScreen`), `settings`
  (`AppearanceSettings`, `LanguageSelector`/`LanguagePicker`,
  `SettingsListScreen`), `auth` (`RequireSignIn`), `toast`,
  `bottom-action-bar`, `empty-state`, `error` (`ErrorBoundary`).
- `src/theme/` — `ThemeContext`, `colors` (Tailwind-mirrored palette,
  `ThemeColors`), `spacing`, `typography`.
- `src/hooks/` — `useResponsive`, device-layout hooks.
- `src/i18n/`, `src/constants/languages.ts`, `src/utils/styles.ts`,
  `src/utils/inline-html.tsx`, `src/types.ts`.
- `src/native/`, `src/review/` — JS bridges to the native modules above.
- `src/__tests__/` — vitest suites and their RN mocks. The `react-native`
  mock maps `onPress` to a click, `testID` to `data-testid` and the
  accessibility label/role to ARIA, so `test-utils`' `firePress`,
  `getByTestId` and `getByLabel` work.

## Screen rendering — safe area & scroll insets

Honour the device safe area on **every** screen via `useSafeAreaInsets()` (or a
`SafeAreaView` with explicit `edges`) and pad by the **actual inset** — never a
magic number like `paddingBottom: 80`.

Decide per axis, by whether that axis scrolls:
- **Not scrollable** (fixed screen, pinned CTA, overlay): pad the content to stop
  at the insets — top/bottom (`insets.top`/`insets.bottom`) and left/right
  (`insets.left`/`insets.right`). It must not reach the physical edge.
- **Scrollable**: render full-bleed to the edges and give the scroll view
  **scroll insets** equal to the safe area (`contentInset` +
  `scrollIndicatorInsets`, or `contentInsetAdjustmentBehavior="automatic"`).

**Bottom CTAs under a tab bar — the trap:** inside a tab navigator
`insets.bottom` (and what `BottomActionBar` reads) **already includes the tab-bar
height**. So pad the bottom bar by `insets.bottom` and nothing more — do not add
the tab-bar height, reserve it again on the root, or swap the inset for a flat
fixed gap. Canonical fixed-screen shape: flex-column root → content/scroll
region → a bottom action bar as the **last child** padding by `insets.bottom`.
Copy a screen already doing this rather than re-deriving the padding.
