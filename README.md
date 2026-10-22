# tmovies

A React app for browsing movies and TV series, powered by the [TMDB API](https://www.themoviedb.org/documentation/api) and **@tanstack/react-query**.

## Features

- Trending banner, popular / top rated / upcoming lists, all fetched in parallel and cached by React Query.
- Movie and TV search with a debounced input, so typing does not spam the API.
- Detail pages with cast, trailers and similar titles, driven by route params (`/movie/:id`, `/tv/:id`).
- Loading skeletons and error states for every data-driven section.

## Documentation

| Document | What it covers |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Codebase map, architecture, and conventions — the fastest way to orient yourself in this repo. |
| [`plans/UNIT_TEST_PLAN.md`](plans/UNIT_TEST_PLAN.md) | The behaviour-first unit test strategy: scope, harness, and every planned scenario. |
| [`plans/CI_PLAN.md`](plans/CI_PLAN.md) | The GitHub Actions test + build workflow and the coverage gate. |
| [`plans/REACT_QUERY_OPTIMIZATION_PLAN.md`](plans/REACT_QUERY_OPTIMIZATION_PLAN.md) | Proposed React Query cache and prefetch optimisations. |

## Getting started

```bash
npm install
```

### 1. Add your TMDB API key

Create a key at [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api), then:

```bash
cp .env.example .env
```

```env
REACT_APP_TMDB_API_KEY=YOUR_TMDB_API_KEY_HERE
```

`.env` is gitignored — never commit your key. In development the app fails fast with a clear error when the key is missing.

### 2. Run the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Runs the app in development mode. |
| `npm test` | Launches the test runner in watch mode. |
| `npm run test:ci` | Runs the test suite once, non-interactive. Used by CI. |
| `npm run test:coverage` | Runs the suite with coverage and enforces the thresholds in `package.json`. |
| `npm run build` | Builds the production bundle into `build/`. |
| `npm run deploy` | Builds and publishes `build/` to GitHub Pages (`gh-pages`). |
| `npm run eject` | One-way operation, removes the build config. |

## Continuous integration

Every push and pull request runs [`.github/workflows/test.yml`](.github/workflows/test.yml):

| Job | What it does |
|---|---|
| **Test** | `npm ci` → `npm run test:ci` → `npm run test:coverage`, then uploads `coverage/` as an artifact. |
| **Build** | `npm ci` → `npm run build`, which also runs ESLint and fails on lint errors. |

**CI needs no secret.** The test suite is hermetic: `src/test-utils/env.js` supplies its own
TMDB key and MSW intercepts every request, so no real credential is exposed — not even to
pull requests from forks. The build job only needs *a* key present, so it falls back to a
placeholder; set a repository **variable** named `REACT_APP_TMDB_API_KEY` to override it.

Coverage thresholds live in the `jest` block of `package.json` (statements 80, branches 70,
functions 75, lines 80) and are enforced by Jest itself, so `npm run test:coverage` fails
locally exactly as it fails in CI.

## Deployment

The key is injected **at build time**, so the deployed bundle already contains it.

| Method | How the key is injected | New key needed? |
|---|---|---|
| `npm run build` + `npm run deploy` (local) | Built from your local `.env` | No |
| GitHub Actions → GitHub Pages | Repository secret `REACT_APP_TMDB_API_KEY` exposed to the build step | No |
| Forks | Each fork can use its own secret | Only for separate quotas |

### GitHub Actions → GitHub Pages

Two workflows live in `.github/workflows/`:

| Workflow | Trigger | What it does |
|---|---|---|
| `test.yml` | Every push and pull request | Runs the test suite, the coverage gate and a production build. Needs no credential. |
| `deploy.yml` | A green `test.yml` run on `master` (or a manual `Run workflow`) | Builds with the real key, uploads the bundle as a Pages artifact and deploys it. |

Only a push to `master` deploys, and only when the CI run for that commit finished green.
A red suite leaves the currently published site untouched.

One-time repository setup:

1. **Settings → Secrets and variables → Actions → New repository secret** → name
   `REACT_APP_TMDB_API_KEY`, value your TMDB key.
2. **Settings → Pages → Build and deployment → Source → "GitHub Actions"**. The `gh-pages`
   branch is no longer used for publishing.

The first publication is a manual run: **Actions → Deploy to GitHub Pages → Run workflow**.
`workflow_run` only fires once `deploy.yml` exists on the default branch.

The build step reads the secret like this:

```yaml
- name: Build production bundle
  run: npm run build
  env:
    REACT_APP_TMDB_API_KEY: ${{ secrets.REACT_APP_TMDB_API_KEY }}
```

### Security notes

- A static CRA build ships the key in the bundled JS, so it can be extracted by anyone. This is unavoidable without a backend.
- Restrict the key in TMDB by HTTP referrer (`rahulg16.github.io/*` and `localhost:*` for development). This is the most effective mitigation.
- If the key was ever committed to git history, regenerate it in TMDB.

## Project structure

```
src/
├── api/
│   ├── APIConfig.js   # env based config (base urls, image helpers)
│   ├── client.js      # fetch wrapper: base url, timeout, error normalisation
│   ├── endpoints.js   # TMDB path builders
│   ├── queryKeys.js   # centralised query key factory
│   └── tmdb.js        # one function per endpoint, returns data
├── hooks/
│   ├── useDebouncedValue.js
│   ├── useDetails.js      # useMovieDetails, useTvDetails, useSimilar*
│   ├── useMovieLists.js   # usePopularMovies, useUpcomingMovies, useTopRatedMovies
│   ├── useSearch.js       # useSearchMovies, useSearchTv
│   ├── useTrending.js     # useTrendingDay
│   └── useTvLists.js      # usePopularTv, useTopRatedTv
├── queryClient.js   # shared QueryClient with default cache options
├── Components/
└── Pages/
```

Every hook forwards the options it receives to `useQuery`, so a consumer can override `staleTime`, `gcTime`, `enabled`, `select`, ... per call site:

```jsx
const { data } = usePopularMovies({
  staleTime: 60 * 1000,
  select: (data) => data.results.slice(0, 10),
});
```
