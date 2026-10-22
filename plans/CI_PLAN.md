# CI Plan — `tmovies`

Continuous integration for the `tmovies` React app: a test job, a build job, and a coverage
gate that fails the build when quality regresses.

- **Scope:** GitHub Actions workflow + coverage thresholds. The GitHub Pages deploy workflow
  is explicitly **out of scope** (see [§8](#8-out-of-scope)).
- **Depends on:** [`UNIT_TEST_PLAN.md`](./UNIT_TEST_PLAN.md) being implemented, particularly
  Phase 0 (the test harness).

---

## Table of contents

1. [Goals](#1-goals)
2. [Preconditions](#2-preconditions)
3. [Workflow file](#3-workflow-file)
4. [Job 1 — test](#4-job-1--test)
5. [Job 2 — build](#5-job-2--build)
6. [Secrets and environment](#6-secrets-and-environment)
7. [Coverage gate](#7-coverage-gate)
8. [Out of scope](#8-out-of-scope)
9. [Local / CI parity checklist](#9-local--ci-parity-checklist)
10. [Definition of done](#10-definition-of-done)

---

## 1. Goals

- Every push and pull request runs the full test suite automatically.
- A broken build or a failing test blocks the merge.
- Coverage is measured and enforced, so it cannot silently rot.
- The build job catches problems the test job cannot — for example a test file leaking into
  the production bundle, or a build-only failure.
- **No credential is required to run CI.** The test suite is hermetic.

---

## 2. Preconditions

| # | Precondition | Why |
|---|---|---|
| P1 | [`UNIT_TEST_PLAN.md`](./UNIT_TEST_PLAN.md) Phase 0 is implemented | The workflow calls `npm run test:ci` and `npm run test:coverage` |
| P2 | `package-lock.json` is regenerated with `msw@2.15.0` | `npm ci` fails if the lockfile and `package.json` disagree |
| P3 | The `test:ci` and `test:coverage` scripts exist in `package.json` | The workflow calls them |
| P4 | The `jest` block in `package.json` carries the coverage thresholds | The gate is enforced by Jest itself, so it also applies locally |

---

## 3. Workflow file

New file: `.github/workflows/test.yml`. No `.github/` directory exists in the repo today.

```yaml
name: Tests

on:
  push:
    branches: ["**"]
  pull_request:
    branches: ["**"]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run test suite
        run: npm run test:ci

      - name: Collect coverage
        run: npm run test:coverage

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build production bundle
        run: npm run build
        env:
          REACT_APP_TMDB_API_KEY: ${{ vars.REACT_APP_TMDB_API_KEY || 'ci-placeholder-key' }}
```

### 3.1 Notes on the workflow

| Choice | Reason |
|---|---|
| `node-version: 20` | `msw@2.15.0` requires Node ≥ 18; Node 20 is the current LTS baseline and is newer than the local Node 26 without being a moving target |
| `cache: npm` | `actions/setup-node` caches `~/.npm`, keyed on `package-lock.json`, so `npm ci` is fast |
| `npm ci` not `npm install` | Installs exactly the lockfile; fails loudly on a lockfile mismatch |
| `branches: ["**"]` | The repo has a single `master` branch today, but the plan should not need editing when branches are added |
| `cancel-in-progress: true` | A new push supersedes an in-flight run for the same ref, saving runner minutes |
| `if: always()` on the artifact upload | The coverage report is still uploaded when the suite fails, which is when it is most useful |
| `vars.… || 'ci-placeholder-key'` | The build needs *a* key present but not a real one — see [§6](#6-secrets-and-environment) |

---

## 4. Job 1 — test

| Step | Command | What it proves |
|---|---|---|
| Install | `npm ci` | The lockfile is complete and installable from a clean checkout with no `.env` |
| Test | `npm run test:ci` | Every scenario in the unit test plan passes |
| Coverage | `npm run test:coverage` | The same suite, with instrumentation and the threshold gate applied |

`test:ci` sets `CI=true`, which makes `react-scripts test` run once and exit instead of
watching, and makes Jest fail the process on an unhandled rejection.

Both steps run the same suite; `test:coverage` exists so the coverage report and the gate are
produced in one command that matches what CI enforces.

---

## 5. Job 2 — build

`npm run build` runs `react-scripts build`, which compiles the production bundle into
`build/`. It catches problems the test job cannot:

- a test file or helper accidentally imported into the app graph and shipped to production;
- a build-only failure (an import that resolves in Jest but not in webpack, a missing asset);
- a lint error that `react-scripts build` treats as an error.

The job is separate from `test` so that a build failure is reported as a build failure rather
than as a test failure.

The build also runs ESLint: `react-scripts build` fails the build on a lint error, using the
inline `eslintConfig` in `package.json` (`react-app`, `react-app/jest`).

---

## 6. Secrets and environment

**The test job needs no secrets.**

`src/test-utils/env.js` (from the unit test plan's Phase 0) forces
`REACT_APP_TMDB_API_KEY = "test-api-key"` before `src/api/APIConfig.js` is imported, so:

- the gitignored `.env` never affects CI — it is not present on a runner at all;
- no TMDB credential is exposed to a pull request, including from forks;
- MSW intercepts every request, so no real network call is made and the suite is hermetic.

**The build job needs a key present, but not a real one.**

`src/api/APIConfig.js:6` throws only when the key is missing **and**
`process.env.NODE_ENV !== "production"`. `react-scripts build` sets `NODE_ENV=production`, so
a build without a key completes — it only logs `console.error` — and the resulting bundle would
carry `api_key=undefined`.

Supplying a placeholder keeps the built bundle well-formed and keeps the workflow free of
secrets. If a real key is preferred later, store it as an Actions **variable** (not a secret)
named `REACT_APP_TMDB_API_KEY`, or as a repository secret, and delete the `||` fallback.

> A CI-built bundle is not what gets deployed. Deployment builds from a developer's local
> `.env` or from a separate deploy workflow (out of scope — see [§8](#8-out-of-scope)).

---

## 7. Coverage gate

CRA supports a `jest` key in `package.json` with a fixed set of overridable options.
`coverageThreshold` and `collectCoverageFrom` are both on that list
(`react-scripts/scripts/utils/createJestConfig.js`).

```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx}",
      "!src/index.js",
      "!src/test-utils/**"
    ],
    "coverageThreshold": {
      "global": {
        "statements": 80,
        "branches": 70,
        "functions": 75,
        "lines": 80
      }
    }
  }
}
```

| Excluded | Why |
|---|---|
| `src/index.js` | The ReactDOM entry point. It calls `createRoot` and mounts the app; it is not reachable from a test and would drag every uncovered line into the report. |
| `src/test-utils/**` | Test infrastructure, not application code. |

Thresholds are enforced by Jest, so `npm run test:coverage` fails locally exactly as it fails
in CI. The numbers are a floor, not a goal — ratchet them upward as the suite grows.

---

## 8. Out of scope

| Item | Note |
|---|---|
| GitHub Pages deploy workflow | The `README.md` describes a GitHub Actions → GitHub Pages deployment, but no workflow file exists. It would need the `REACT_APP_TMDB_API_KEY` secret and the `gh-pages` branch. A separate task. |
| Branch protection rules | GitHub-side configuration; set "Require status checks" for `Test` and `Build` once the workflow is live. |
| Third-party coverage service (Codecov, Coveralls) | The workflow already uploads `coverage/` as an artifact, which is enough to start. |
| E2E tests | The current plan is unit- and screen-level only. |

---

## 9. Local / CI parity checklist

Before the first run, confirm locally:

```bash
# 1. Clean-checkout simulation: no .env present
mv .env .env.bak
npm ci
npm run test:ci
npm run test:coverage
mv .env.bak .env

# 2. The build job
npm run build

# 3. The workflow itself
npx yaml-lint .github/workflows/test.yml
```

| Check | Result |
|---|---|
| The suite passes with **no `.env` file present** | The harness supplies the key itself |
| No test performs a real network request | `onUnhandledRequest: "error"` would fail the run |
| No test depends on the machine's timezone, locale or clock | Only fake timers and explicit waits are used |
| `npm run build` succeeds and `build/` does not contain test files | The build job's job |
| `npm run test:coverage` exits non-zero when a threshold is lowered and not met | The gate works |

---

## 10. Definition of done

- `.github/workflows/test.yml` exists and runs green on a push.
- Both jobs (`Test`, `Build`) appear on the pull request checks list.
- The coverage report is downloadable as an artifact.
- A deliberate coverage regression fails the `Test` job.
- The README's script table lists `test:ci` and `test:coverage`.
