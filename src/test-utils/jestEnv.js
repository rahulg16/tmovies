/**
 * A Jest environment that keeps jsdom but adds the Node globals jsdom 16.7
 * does not ship: `fetch`, `Request`, `Response`, `TextEncoder`,
 * `ReadableStream` and friends.
 *
 * MSW v2 needs all of them. `jest-fixed-jsdom` would solve this too, but it
 * requires `jest-environment-jsdom >= 28` and this project is pinned to
 * `27.5.1`, so the environment is extended locally instead.
 *
 * Wired in through the npm script:
 *   react-scripts test --env=./src/test-utils/jestEnv.js
 */
const JSDOMEnvironment = require("jest-environment-jsdom");

const NODE_GLOBALS = [
  "fetch",
  "Headers",
  "Request",
  "Response",
  "FormData",
  "Blob",
  "TextEncoder",
  "TextDecoder",
  "ReadableStream",
  "TransformStream",
  "WritableStream",
  "structuredClone",
  "BroadcastChannel",
  "AbortController",
  "AbortSignal",
];

class FixedJsdomEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();

    const sandbox = this.global;

    NODE_GLOBALS.forEach((name) => {
      if (globalThis[name] !== undefined) {
        sandbox[name] = globalThis[name];
      }
    });
  }
}

module.exports = FixedJsdomEnvironment;
