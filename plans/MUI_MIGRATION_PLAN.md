# Material UI Migration Plan for tmovies

This document outlines the plan to migrate the entire `tmovies` presentational layer from
hand-written CSS to **Material UI v5**, replacing 19 CSS files with a theme-driven `sx`-based
system.

## Table of Contents

- [Decisions](#decisions)
- [Current State](#current-state)
- [Dependencies](#dependencies)
- [Theme](#theme)
- [Architecture Changes](#architecture-changes)
- [Migration Plan](#migration-plan)
- [Bug Fix Register](#bug-fix-register)
- [Icon Inventory](#icon-inventory)
- [Testing & Verification](#testing--verification)
- [Risks & Mitigations](#risks--mitigations)
- [Change Manifest](#change-manifest)
- [Implementation Checklist](#implementation-checklist)

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Layout fidelity | **Hybrid** — port faithfully, rebuild the genuinely broken responsive hacks | The absolute-positioning/`vh`/`vw` math produces real bugs on small screens. Fixing those is in scope; redesigning the whole layout is not. |
| Styling mechanism | **`sx` prop only** | No `styled()`, no `makeStyles`. Colocated with markup, fully MUI-idiomatic, no extra dependencies. |
| Theme | **Dark, faithful tokens** | The app is dark by hardcoded CSS. The theme mirrors today's values so the CSS can be deleted without changing the look. |
| MUI version | **Stay in v5, bump 5.8.1 → 5.18.0** | Same major, no API breakage for our usage, ~3 years of patches and minor features. v6/v7 are a separate change. |
| NavBar | **Fixed AppBar** | Behaviour change from today's `position: absolute`. Stays visible on scroll. Sanctioned explicitly. |
| Extras in scope | Bug fixes · `@mui/icons-material` · delete all CSS | All three reduce the surface the migration has to carry forward. |
| Unit tests | **Out of scope** | The suite is WIP. Not a gate for this migration. |

### Verified constraints on MUI v5

Checked directly against the published `5.18.0` tarball:

- **`<YouTube>` does not exist in any MUI v5.** It ships in v6+. → A local `VideoEmbed`
  component is required for responsive trailer embeds.
- **`hideScrollbar` is not a public v5 API.** It only appears inside `Tabs` internals. →
  Scrollbar hiding is a shared `sx` const.
- `Skeleton` supports `animation: 'pulse' | 'wave' | false` and `variant`. → Replaces the
  three duplicated shimmer CSS blocks and both duplicated `@keyframes`.
- `sx` passes any unknown CSS property through to emotion, so `aspectRatio`, `scrollbarWidth`
  and `position: "fixed"` all work without MUI support.

---

## Current State

### MUI footprint today

Exactly one file uses MUI — `src/Components/UI/ButtonModal/ButtonModal.js` — with three
deep-path imports (`@mui/material/Box`, `/Button`, `/Modal`) and two static `sx` objects.

There is **no** `ThemeProvider`, **no** `createTheme`, **no** `CssBaseline`, **no**
`GlobalStyles`, **no** `useTheme`, and **no** `styled()`. The dark aesthetic is entirely
CSS-driven with no token layer.

### The CSS surface

19 CSS files (~800 lines), 16 of them non-empty. Highlights:

- **Zero CSS custom properties.** Every colour, radius and font stack is hardcoded inline,
  in 19 files, with heavy duplication: the shimmer gradient is repeated verbatim 5 times, the
  `skeleton-shimmer` keyframe is defined twice and consumed across 3 files, and the
  `Verdana` stack is repeated in 6 rules.
- **8 media queries** across 3 files. `TrailerSection.css` alone has 4, and they are
  non-monotonic (`45vh` at 602px → `40vh` at 520px → `90vh` at 461px).
- **8 media queries with a single breakpoint in `Banner.css` and `MovieInfo.css`**; the other
  14 components have none.
- **Mixed class-naming conventions**: legacy lowercase (`.banner-layout`, `.movieinfo`,
  `.btn`) alongside BEM-ish (`.info-page__status--error`, `.searched-movies__container`).

### Layout debt

The layout leans on absolute positioning and viewport math rather than flow:

| Component | Problem |
|---|---|
| `InfoPage.jsx` | Backdrop is `position: absolute` inside a relative wrapper; `.info-page__banner` is `height: 75vh` |
| `MovieInfo.css:6-7` | `.movieinfo` is `position: absolute; top: 20%; height: 75vh` — only correct because `InfoPage` reserves no flow space |
| `TrailerSection.css:5` | `position: relative; top: 95vh; margin-bottom: 600px` — pushes trailers below the absolutely-positioned detail block |
| `Banner.css` | Hero is a horizontal scroller of `min-width: 100vw` slides; backdrop uses `z-index: -20` |
| `App.css:1` | `.App { height: 95vh }` clips 5vh off the bottom of the page |

### Theme-related bugs already present

- `primary.main` will be `#FF0000`, and MUI's `augmentColor` auto-computes `contrastText`.
  For `#FF0000`, contrast against **black** (5.25:1) beats **white** (4.0:1), so MUI picks
  black. Every red button's label would silently flip from white to black unless
  `contrastText` is pinned explicitly.
- `rgba(0, 0, 0, 0.943)` (today's `body` background) composites over the default white
  canvas to `#0E0E0E`. A **solid** value is required so that `Paper`, `Divider` and
  elevation composites resolve correctly.

---

## Dependencies

```bash
npm install @mui/material@^5.18.0 @mui/icons-material@^5.18.0
npm install @emotion/react@^11 @emotion/styled@^11
```

| Package | From | To | Notes |
|---|---|---|---|
| `@mui/material` | 5.8.1 | ^5.18.0 | Same major. No breaking API changes for this codebase's usage. |
| `@mui/icons-material` | — | ^5.18.0 | New. Must match the `@mui/material` major. |
| `@emotion/react` | ^11.9.0 | ^11 | Peer dependency, unchanged. |
| `@emotion/styled` | ^11.8.1 | ^11 | Peer dependency, unchanged. |

**Icons are imported by deep path** (`@mui/icons-material/Search`), not through the barrel, so
CRA's webpack tree-shakes the rest of the package.

No new runtime dependency is introduced by the migration itself — `sx` runs on the emotion
peer dependencies that MUI already requires.

---

## Theme

New file: **`src/theme/theme.js`**

```js
import { createTheme } from "@mui/material/styles";

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', " +
  "'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

export const FONT_STACK_ALT = "Verdana, Geneva, Tahoma, sans-serif";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0E0E0E", // flattened rgba(0, 0, 0, 0.943) over the white canvas
      paper: "#000000", // ButtonModal's current bgcolor: "black"
    },
    primary: {
      main: "#FF0000", // today's `background-color: red`
      contrastText: "#FFFFFF", // PINNED - MUI would auto-compute black
    },
    error: { main: "#FF8080" }, // today's #ff8080
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0", // today's .searched-movies__hint
    },
    divider: "rgba(255,255,255,0.12)",
  },
  typography: {
    fontFamily: FONT_STACK,
    h1: { fontSize: "2rem", fontWeight: 700 },
    h2: { fontSize: "1.5rem", fontWeight: 700 },
    h3: { fontSize: "1.375rem", fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#0E0E0E" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: "none", fontWeight: 700 } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
    },
    MuiSkeleton: {
      defaultProps: { animation: "wave" },
    },
  },
});

export default theme;
```

### Token rationale

| Token | Value | Replaces |
|---|---|---|
| `background.default` | `#0E0E0E` | `body { background-color: rgba(0,0,0,0.943) }` in `App.css` |
| `background.paper` | `#000000` | `bgcolor: "black"` in `ButtonModal.js` |
| `primary.main` | `#FF0000` | `background-color: red` in `Button.css` / `Header.css` / `ButtonModal.js` |
| `primary.contrastText` | `#FFFFFF` | `color: white` on those red buttons |
| `error.main` | `#FF8080` | `#ff8080` in `MoviesList.css` / `SearchedMovies.css` / `InfoPage.css` |
| `text.secondary` | `#B0B0B0` | `#b0b0b0` in `SearchedMovies.css` |
| `typography.fontFamily` | system stack | `body` rule in `index.css` |
| `typography.button.textTransform` | `none` | MUI defaults to `uppercase`; today's labels are mixed case |

`FONT_STACK_ALT` (Verdana) is used by today's `.category-title`, `.content-name`,
`.content-error`, `.searched-movies__error`, `.searched-movies__hint` and
`.info-page__status`. It is exposed as a named export and applied at those call sites via
`sx`, preserving the current look without adding a second global font.

### Theme placement

`ThemeProvider` and `CssBaseline` go in **`src/index.js`**, next to `QueryClientProvider` and
`HashRouter`. `src/App.js` deliberately contains no providers so it stays renderable in
isolation — that property must be preserved.

### `src/theme/hideScrollbar.js`

```js
export const hideScrollbarSx = {
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
};
```

Replaces three copies of the `-ms-overflow-style` / `scrollbar-width` / `::-webkit-scrollbar`
triple in `Banner.css` and `MoviesList.css`.

---

## Architecture Changes

The four-layer data architecture is **unchanged**. `src/api/**`, `src/hooks/**` and
`src/queryClient.js` are not touched.

Only the presentational layer changes:

```
Page (Box/Typography/Stack)
  -> Component (MUI primitives + sx)
  -> shared primitives (PosterSkeleton, VideoEmbed, ErrorState, GenreChip)
  -> theme (src/theme)
```

### Shared primitives (new)

| File | Purpose | Replaces |
|---|---|---|
| `src/theme/theme.js` | `createTheme` with the dark token set | 19 files of hardcoded values |
| `src/theme/index.js` | re-exports `theme` | — |
| `src/theme/hideScrollbar.js` | `hideScrollbarSx` | 3 CSS scrollbar-hiding triples |
| `src/Components/UI/Skeleton/PosterSkeleton.jsx` | one `<Skeleton>` block | 3 duplicated shimmer CSS blocks, 2 duplicated keyframes |
| `src/Components/UI/VideoEmbed/VideoEmbed.jsx` | responsive 16:9 iframe | the fixed 650×350 iframe; also covers `TrailerSection` |
| `src/Components/UI/ErrorState/ErrorState.jsx` | shared error panel | 5 near-identical error branches |
| `src/Components/UI/Badge/GenreChip.jsx` | renamed from `Badge.jsx` | — |

**`GenreChip` rename.** MUI also exports a `Badge`. Keeping a local `Badge` and an MUI `Badge`
in the same codebase is a naming trap. The rename is low-risk: the only import site is
`src/Components/Layout/Main/MovieInfo.jsx`.

### `sx` conventions

- Static values are inline `sx` objects.
- Theme-dependent values use the callback form: `sx={(theme) => ({ ... })}`.
- Repeated composite patterns (poster card, shelf row, skeleton, error panel) become
  components, not repeated `sx` blobs.
- No `styled()`, no `makeStyles`, no `className` props on MUI components.

---

## Migration Plan

Work in phases. Delete each CSS file as its component is migrated — not in one sweep at the
end.

### Phase 0 — Foundation

1. Install the dependencies from the **Dependencies** section.
2. Create `src/theme/theme.js`, `src/theme/index.js`, `src/theme/hideScrollbar.js`.
3. Wrap `src/index.js` in `<ThemeProvider theme={theme}>` + `<CssBaseline />`.
4. Delete `src/index.css` and `src/App.css`, and their imports.

### Phase 1 — Shared primitives and leaf components

| Component | Migration | Notes |
|---|---|---|
| `UI/Skeleton/PosterSkeleton.jsx` | new | `<Skeleton variant="rect" />` + `<Skeleton variant="text" />` |
| `UI/VideoEmbed/VideoEmbed.jsx` | new | `aspectRatio: "16 / 9"` wrapper around the iframe |
| `UI/ErrorState/ErrorState.jsx` | new | message + optional retry action |
| `UI/Badge/Badge.jsx` → `GenreChip.jsx` | `<Chip>` | drop the `transform: scale(0.80)` hack; size the chip explicitly with `px: 4.25 / py: 0.5 / fontSize: 0.875rem` so it lands at the same visual size |
| `UI/SimpleButton/Button.js` | `<Button variant="contained">` | keeps `BtnName` prop; preserves `borderRadius: 25px`, `minWidth: 142`, `px: 3.75 / py: 1.5`, `fontWeight: 700`, hover → white bg / red text / `scale(1.1)`, active → `scale(0.98)`. **Import alias required:** `import MuiButton from "@mui/material/Button"` so the local `Button` is not shadowed. |
| `UI/Card/Card.js` | `<Card>` + `<CardActionArea component={Link}>` | keeps 220px width, 15px radius, `scale(1.1)` hover, 18px bold centred title |
| `UI/Card/SimpleCard.js` | `<Box component="img">` | keeps the `scale(1.1)` hover |
| `UI/Cast/Cast.jsx` | `<Stack>` of `<Box component="img">` | 80×120, 8px radius. `Avatar` is square-by-default, not 80×120. |
| `UI/ButtonModal/ButtonModal.js` | `<Dialog>` | replaces `Modal` + absolutely-positioned `Box`; 650×350 iframe → `<VideoEmbed>`; real `<DialogTitle>` with a matching `aria-labelledby`; drop `aria-describedby` (no description exists); remove the invalid `selected` prop; replace `boxShadow: 24` with a real shadow |

### Phase 2 — Layout components

| Component | Migration | Notes |
|---|---|---|
| `Layout/NavBar/NavBar.js` | `<AppBar position="fixed">` + `<Toolbar>` | fixes the invalid `<Link><li></Link>` nesting via `ListItem component={Link}`; `link:hover { border-bottom: 4px solid white }` → `sx={{ "&:hover": { borderBottom: "4px solid #fff" } }}`; `navbar-contents { width: 90vw }` → `<Container maxWidth="xl">`; bg `rgba(0,0,0,0.594)` preserved |
| `Layout/Main/Banner.js` | `<Box>` hero carousel | keeps the horizontal scroller; the `z-index: -20` backdrop + `.shade` overlay become one `backgroundImage` + gradient layer inside a `position: relative` slide; skeleton branch → `<Skeleton>`; error branch → `<ErrorState>`; fixes the invalid `<Link><button></Link>` nesting → `<Button component={Link} to={...}>`; `selectTrending` slice-to-8 stays (data, not UI) |
| `Layout/Main/MoviesList.jsx` | `<Box>` + `<Stack direction="row">` | `category-title` 22px Verdana → `<Typography>` with explicit `fontFamily` / `fontSize`; `content-poster` `max-width: 13vw / min-width: 120px` preserved; `scale(1.1)` hover preserved; loading branch → 6 × `<PosterSkeleton>` |
| `Layout/Main/MovieInfo.jsx` | **rebuilt** | today it is `position: absolute; top: 20%; height: 75vh`. New structure: the hero becomes a `position: relative` container with an absolutely-positioned backdrop layer and an in-flow, `z-index: 1` content layer. Genres → `<Stack direction="row" flexWrap="wrap" gap={1.5}>` of `<GenreChip>`. 530-char synopsis truncation kept as-is. |
| `Pages/InfoPage/InfoPage.jsx` | hero restructured | backdrop `<img>` + `.dark-shade` become one gradient layer; loading → `<Skeleton>`; error → `<Typography color="error">` (exactly today's `#ff8080`) |
| `Pages/InfoPage/TrailerSection.jsx` | **rebuilt** | today: `top: 95vh` + `margin-bottom: 600px` + 4 non-monotonic media queries. With `InfoPage` in normal flow, all of it is deleted. Each trailer → `<Typography>` title + `<VideoEmbed>`. |
| `Pages/Home/Header.jsx` | `<TextField>` + `<Button>` | keeps `aria-label` and `placeholder` via `inputProps`; fixes the invalid `border-radius: 15%`; the `top: 30%` overlay becomes a flex-centred container inside a `position: relative` wrapper around the background image |
| `Pages/Home/SearchedMovies.jsx` | CSS grid via `sx` | `gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))"` — avoids the v5 legacy `Grid` API entirely; error → `<ErrorState>`; "Updating results…" → `<Typography color="text.secondary">`; loading → 10 × `<PosterSkeleton>` |

**On MUI Grid.** The v5 `Grid` is the legacy `item`/`xs` API. The two grid-shaped surfaces
here (search results, cast row) are both expressible as a plain CSS grid in `sx`, which keeps
the codebase clear of a version-specific API. If a future screen needs a true MUI `Grid`,
prefer CSS grid unless the responsive breakpoint model actually requires it.

### Phase 3 — Pages

| File | Change |
|---|---|
| `src/App.js` | `<div className="App">` → `<Box sx={{ minHeight: "100vh", overflowX: "hidden" }}>`. Fixes today's `height: 95vh`. |
| `src/Pages/Home/Home.jsx` | wrapper `<div>` → `<Box>`. Data layer untouched. |
| `src/Pages/Movies/Movies.jsx` | wrapper `<div>` → `<Box>`. |
| `src/Pages/Tv Series/TvSeries.jsx` | wrapper `<div>` → `<Box>`. |

### Phase 4 — Cleanup

Delete all remaining CSS files and their imports:

```
src/index.css                           src/Components/Layout/Main/Banner.css
src/App.css                             src/Components/Layout/Main/MovieInfo.css
src/Components/UI/Badge/Badge.css       src/Components/Layout/Main/MoviesList.css
src/Components/UI/ButtonModal/ButtonModal.css
src/Components/UI/Card/Card.css         src/Components/Layout/NavBar/NavBar.css
src/Components/UI/Card/SimpleCard.css   src/Components/UI/Cast/Cast.css
src/Components/UI/SimpleButton/Button.css
src/Pages/Home/Header.css               src/Pages/Home/Home.css          (empty)
src/Pages/Home/SearchedMovies.css       src/Pages/InfoPage/InfoPage.css
src/Pages/InfoPage/TrailerSection.css   src/Pages/Movies/Movies.css      (empty)
                                        src/Pages/Tv Series/TvSeries.css (empty)
```

Final state: **zero CSS files** in `src/`. All styling lives in the theme and in `sx`.

---

## Bug Fix Register

All of these are fixed as part of the migration.

| # | Bug | Location | Fix |
|---|---|---|---|
| 1 | `<Link>` wraps an `<li>` outside a list | `NavBar.js:15-24` | `ListItem component={Link}` |
| 2 | `<Link>` wraps a `<button>` | `Banner.js:67-69` | `<Button component={Link} to={...}>` |
| 3 | `poster_path !== null` — `undefined` poster yields `src=""` | `Card.js:13` | truthy check + placeholder fallback |
| 4 | `SimpleCard` has **no** poster fallback at all | `SimpleCard.js` | placeholder fallback |
| 5 | `selected` prop on a plain MUI `Button` (ToggleButton-only; leaks to the DOM) | `ButtonModal.js:50` | remove |
| 6 | `boxShadow: 24` is not a valid MUI shadow | `ButtonModal.js:17` | real shadow string / theme key |
| 7 | `aria-labelledby` / `aria-describedby` point at non-existent ids | `ButtonModal.js:59-60` | real `DialogTitle` id; drop `aria-describedby` |
| 8 | `@keyframes skeleton-shimmer` defined twice, consumed across 3 files | `Banner.css:110`, `MoviesList.css:87` | single `<Skeleton>` |
| 9 | `body` styled twice | `index.css:1`, `App.css:7` | `CssBaseline` only |
| 10 | `border-radius: 15%` is invalid (single percentage) | `Header.css:37` | real radius |
| 11 | `.App { height: 95vh }` clips the page | `App.css:1` | `minHeight: 100vh` |
| 12 | `TrailerSection` `top: 95vh` + `margin-bottom: 600px` + 4 broken media queries | `TrailerSection.css` | normal flow |
| 13 | `MovieInfo` absolute at `top: 20%` | `MovieInfo.css:6-7` | in-flow hero |
| 14 | `.card--skeleton` used with no matching rule | `Card.css` / `SearchedMovies.jsx:12` | `<PosterSkeleton>` |
| 15 | `.trailer-btn` class with only a commented-out rule | `ButtonModal.css:1-3` | deleted with the CSS |
| 16 | `.navbar-sections > li` dead rule | `NavBar.css:30` | deleted with the CSS |
| 17 | No `:focus` styles anywhere in the app | all CSS | MUI focus-visible rings — free a11y win |
| 18 | `primary.contrastText` would auto-compute to black | new theme | pinned to `#FFFFFF` |

---

## Icon Inventory

New dependency `@mui/icons-material`, imported by deep path.

| Icon | Usage |
|---|---|
| `LocalMovies` | NavBar logo |
| `Home` | NavBar link |
| `Movie` | NavBar link |
| `LiveTv` | NavBar link |
| `Search` | Search field adornment (`InputAdornment`) |
| `PlayArrow` | "Watch Now" button |
| `OndemandVideo` | "Watch Trailer" button |
| `Refresh` | "Try again" button |
| `ErrorOutline` | Error states |
| `Close` | Dialog close button |

---

## Testing & Verification

The unit-test suite is **WIP and is not a gate** for this migration. Verification relies on
the production build and a manual QA pass.

### Build gate

```bash
npm run build
```

`react-scripts build` runs ESLint and **fails on lint errors**. It is also the only check
that catches broken imports from the deleted CSS files.

### Manual QA checklist

Run `npm start` and walk the checklist.

| Screen | Check |
|---|---|
| Home | hero carousel scrolls horizontally; 8 slides; backdrop + shade visible; slide text legible |
| Home | "Watch Now" navigates to the detail page; "Watch Trailer" opens the modal |
| Home | 5 shelves render posters, titles and hover scale; skeletons show while loading |
| Home | one shelf failing shows only its own error; the other 4 still render |
| Home | nav links route to Home / Movies / Tv Series |
| Search (Movies) | seeded "batman"; 400ms debounce; results grid; "Updating results…" hint during refetch |
| Search (TV) | seeded "Dexter" |
| Detail | backdrop, title, genre chips, truncated synopsis, 5 cast members, similar shelf |
| Detail | trailer iframe plays; modal opens and closes; "No trailer available." when absent |
| Trailer modal | "Loading trailer…" → iframe; error state renders the message |
| Responsive | 375 / 768 / 1440 — nav, hero, shelves, results grid, detail page |
| Keyboard | tab order, visible focus rings, `Esc` closes the modal |

### Known-unrelated failure

`npm test` currently fails for a reason **unrelated** to this migration: `msw@2.15` pulls
ESM-only `rettime`, `until-async` and `@open-draft/deferred-promise`, which Jest 27's legacy
resolver cannot load. A working fix is a custom `transformIgnorePatterns` in `package.json`:

```
"jest": {
  "transformIgnorePatterns": [
    "node_modules/(?!(rettime|until-async|@open-draft/deferred-promise|headers-polyfill)/)"
  ]
}
```

combined with `react-scripts test --env=./src/test-utils/jestEnv.js`. This is out of scope
here (the suite is WIP) but is recorded so it is not rediscovered from scratch.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Fixed AppBar overlaps content on scroll | Medium | The bar is transparent and overlays the same region it overlays today at scroll-top (hero on Home, backdrop on InfoPage, header image on search). Verify explicitly at 375px. |
| `primary.contrastText` auto-computed to black | Low | Pinned explicitly to `#FFFFFF` in the theme, with a comment explaining why. |
| `background.default` alpha flattening | Low | `#0E0E0E` is the exact composited value of `rgba(0,0,0,0.943)` over white. Verify visually against the current build. |
| `<Skeleton>` wave ≠ the hand-rolled shimmer gradient | Low | Intentional consolidation — the keyframes were duplicated and consumed cross-file. If a pixel-exact match is required, set `sx={{ bgcolor, backgroundImage }}` on the skeleton. |
| `GenreChip` rename touches a component | Low | Single import site (`MovieInfo.jsx`). |
| Deleting 19 CSS files in one pass | Medium | Delete per-component as each migration lands, never in one sweep. `npm run build` after each phase. |
| MUI v5 `Grid` legacy API confusion | Low | Use CSS grid via `sx` for the two grid-shaped surfaces. |
| `@mui/icons-material` bundle size | Low | Deep-path imports only; CRA tree-shakes the barrel. Verify the production bundle size after Phase 1. |

---

## Change Manifest

**New (7)**

```
src/theme/theme.js
src/theme/index.js
src/theme/hideScrollbar.js
src/Components/UI/Skeleton/PosterSkeleton.jsx
src/Components/UI/VideoEmbed/VideoEmbed.jsx
src/Components/UI/ErrorState/ErrorState.jsx
src/Components/UI/Badge/GenreChip.jsx
```

**Renamed (1)** — `src/Components/UI/Badge/Badge.jsx` → `src/Components/UI/Badge/GenreChip.jsx`

**Modified (18)**

```
src/index.js
src/App.js
src/Components/Layout/NavBar/NavBar.js
src/Components/Layout/Main/Banner.js
src/Components/Layout/Main/MovieInfo.jsx
src/Components/Layout/Main/MoviesList.jsx
src/Components/UI/ButtonModal/ButtonModal.js
src/Components/UI/Card/Card.js
src/Components/UI/Card/SimpleCard.js
src/Components/UI/Cast/Cast.jsx
src/Components/UI/SimpleButton/Button.js
src/Pages/Home/Header.jsx
src/Pages/Home/Home.jsx
src/Pages/Home/SearchedMovies.jsx
src/Pages/InfoPage/InfoPage.jsx
src/Pages/InfoPage/TrailerSection.jsx
src/Pages/Movies/Movies.jsx
src/Pages/Tv Series/TvSeries.jsx
```

**Deleted (19 CSS)** — listed in Phase 4.

**Untouched** — `src/api/**` · `src/hooks/**` · `src/queryClient.js` ·
`src/test-utils/**` · `src/setupTests.js` · `src/Assets/**`

---

## Implementation Checklist

### Phase 0 — Foundation

- [ ] `npm install @mui/material@^5.18.0 @mui/icons-material@^5.18.0`
- [ ] `npm install @emotion/react@^11 @emotion/styled@^11`
- [ ] Create `src/theme/theme.js`
- [ ] Create `src/theme/index.js`
- [ ] Create `src/theme/hideScrollbar.js`
- [ ] Wrap `src/index.js` in `ThemeProvider` + `CssBaseline`
- [ ] Delete `src/index.css`, `src/App.css` and their imports
- [ ] `npm run build`

### Phase 1 — Primitives

- [ ] `src/Components/UI/Skeleton/PosterSkeleton.jsx`
- [ ] `src/Components/UI/VideoEmbed/VideoEmbed.jsx`
- [ ] `src/Components/UI/ErrorState/ErrorState.jsx`
- [ ] `Badge.jsx` → `GenreChip.jsx` on `<Chip>`
- [ ] `SimpleButton/Button.js` → MUI `Button` (aliased import)
- [ ] `Card/Card.js` → MUI `Card` + `CardActionArea`
- [ ] `Card/SimpleCard.js` → MUI `Box component="img"`
- [ ] `Cast/Cast.jsx` → MUI `Stack`
- [ ] `ButtonModal/ButtonModal.js` → MUI `Dialog` + `VideoEmbed`
- [ ] Delete the 5 CSS files above
- [ ] `npm run build`

### Phase 2 — Layout

- [ ] `NavBar.js` → fixed `AppBar`
- [ ] `Banner.js` → MUI hero carousel
- [ ] `MoviesList.jsx` → MUI shelf
- [ ] `MovieInfo.jsx` → rebuilt detail block
- [ ] `InfoPage.jsx` → rebuilt hero
- [ ] `TrailerSection.jsx` → normal-flow trailers
- [ ] `Header.jsx` → MUI `TextField` + `Button`
- [ ] `SearchedMovies.jsx` → CSS grid via `sx`
- [ ] Delete the 6 CSS files above
- [ ] `npm run build`

### Phase 3 — Pages

- [ ] `App.js` → `<Box>` wrapper, `minHeight: 100vh`
- [ ] `Home.jsx`, `Movies.jsx`, `TvSeries.jsx` → `<Box>` wrappers
- [ ] Delete `Home.css`, `Movies.css`, `TvSeries.css`

### Phase 4 — Verification

- [ ] `npm run build` passes clean
- [ ] `grep -rn "\.css\"" src/` returns nothing
- [ ] `grep -rn "className=" src/` returns no styling class names
- [ ] Manual QA checklist complete
- [ ] Update `AGENTS.md` — file map, conventions, and the "no CSS files" fact

---

## Further Reading

| Document | What it covers |
|---|---|
| [`UNIT_TEST_PLAN.md`](UNIT_TEST_PLAN.md) | The behaviour-first test strategy (WIP; not a gate for this migration) |
| [`CI_PLAN.md`](CI_PLAN.md) | The GitHub Actions workflow and coverage gate |
| [`REACT_QUERY_OPTIMIZATION_PLAN.md`](REACT_QUERY_OPTIMIZATION_PLAN.md) | Cache and prefetch optimisations |
| [`README.md`](../README.md) | Setup, deployment and security notes for the TMDB key |
