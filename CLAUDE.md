# building_blocks_rn (@sudobility/building_blocks_rn)

> **Git policy — never auto-commit or auto-push.** Leave your work in the
> working tree. Run `git commit`, `git push`, `gh pr create` or
> `scripts/push_all.sh` **only when the user explicitly asks in that turn.** Do
> not use feature branches; stay on the current branch.

Higher-level shared UI building blocks for Sudobility React Native apps — the RN
counterpart to `@sudobility/building_blocks` (web). Pre-built screens (login,
settings, subscriptions, legal text), the theme system, i18n, toast, the app
shell and layout primitives, consumed by downstream apps. BUSL-1.1, ESM
(`"type": "module"`), Bun only (never npm). TS strict, bundler resolution,
`@/*` → `./src/*`. Build output is `dist/` (JS + `.d.ts`), committed for
consumers.

Lower-level primitives (`Button`, `Select`, `LoginView`/`LoginModal`, the
sliders) are `@sudobility/components-rn`; build on those and never author a
Tailwind class here (see the NativeWind note). Types and closed lists are
`@sudobility/types`; the palette is `@sudobility/design`.

## Two entry points

Split so apps that do not use Firebase never pull it in, enforced at the
`package.json` `exports` level.

- `@sudobility/building_blocks_rn` (`index.ts`) — everything with zero Firebase
  dependency: components, pages, `SudobilityAppRN`, theme, i18n, toast,
  subscription UI, constants, hooks.
- `@sudobility/building_blocks_rn/firebase` (`firebase.ts`) —
  `SudobilityAppRNWithFirebaseAuth`, `ApiProvider`/`useApi`/`useApiSafe`.

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
  `useXSafe()` returns `null`. Exception: `useSafeSubscription()` returns a stub
  (`isSubscribed: false`), never throws.
- **Themed styling is `createThemedStyles(colors => …)`** (`src/utils/styles.ts`),
  never bare `StyleSheet.create` — it memoizes per theme and recomputes on a
  theme switch. Every component uses it. Theme colours come from `useTheme()`.
- **Components take optional `onTrack` for analytics** and an optional
  `t(key, fallback)` for i18n, so they stay decoupled from i18next.
- **Types mirror the web** adapted to RN: `style` not `className`, `onPress` not
  `href`, icon props `{ size?, color? }` not CSS classes.
- **Provider order in `SudobilityAppRN`** (outer→inner): `SafeAreaProvider`,
  `I18nextProvider`, `ThemeProvider`, `QueryClientProvider`, `ToastProvider`,
  `AppProviders`. Each slot is optional/replaceable.
  `SudobilityAppRNWithFirebaseAuth` inserts `AuthProvider` + optional
  `ApiProvider` between the base providers and the content.

## Gotchas

- **The RN CLI config is `react-native.config.cjs`, not `.js`.** This package is
  `"type": "module"`, so a `.js` config loads as ESM, its `module.exports` is
  never seen, and iOS links nothing. **One `building_blocks_rn.podspec`** with
  per-platform sources: autolinking ignores `podspecPath` and takes
  `<folder>.podspec`, so a separate macOS spec beside it was picked for iOS.
  Taking a new version means a consumer must `pod install`.
- **Author no Tailwind/NativeWind class here.** Apps scan `components-rn`, not
  this package, so a class written here produces no utility in the consumer.
  Every colour comes through a `components-rn` component whose classes also
  occur in that package's source; do layout with `style`.
- **Sign-in is three parts, mirroring the web.** `LoginView` (components-rn) is
  the form; `LoginPage` (here) is that form on a full screen somebody
  *navigates to*; `LoginModal` (components-rn) is the same form interrupting a
  flow. `LoginPage` follows the app's NativeWind theme and needs no
  `ThemeProvider` from this package.
- **i18n is bundled, never fetched** (`initializeI18nRN`, idempotent). Device
  language via `react-native-localize` (optional, falls back to `en`). Chinese
  fallback: `zh→zh→en`, `zh-hant→zh-hant→zh→en`. `DEFAULT_LANGUAGES` is 16
  languages; `RTL_LANGUAGES` is `['ar']`.
- **`ThemeProvider` delays children until the persisted theme loads** (AsyncStorage,
  key `@building_blocks/theme`, `storageKeyPrefix` configurable) to avoid a
  flash. Provides `theme`, `resolvedTheme`, `colors`, `isDark`, `setTheme`.

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
- `src/app/` — `SudobilityAppRN` and the Firebase-aware wrapper.
- `src/api/` — `ApiProvider` + `NetworkClient` + `useApi` (firebase entry only).
- `src/components/` — `header`, `footer`, `layout`, `pages` (`LoginPage`,
  `AppTextScreen`, `AppSubscriptionPage`), `settings` (`AppearanceSettings`,
  `LanguagePicker`, `SettingsListScreen`), `subscription`, `toast`,
  `bottom-action-bar`, `empty-state`, `error` (`ErrorBoundary`).
- `src/theme/` — `ThemeContext`, `colors` (Tailwind-mirrored palette,
  `ThemeColors`), `spacing`, `typography`.
- `src/hooks/` — `useResponsive`, device-layout hooks.
- `src/i18n/`, `src/constants/languages.ts`, `src/utils/styles.ts`,
  `src/types.ts`.
- `src/native/`, `src/review/` — JS bridges to the native modules above.
- `src/__tests__/` — vitest suites and their RN mocks.

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
