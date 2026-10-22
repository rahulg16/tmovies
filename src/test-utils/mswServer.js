import { setupServer } from "msw/node";

import { handlers } from "./handlers";
import { LIST_PATHS } from "./constants";

export { TMDB_BASE_URL } from "./constants";

export const server = setupServer(...handlers);

/**
 * Records the URL of every request MSW sees.
 *
 * Requests are asserted through MSW's own event stream rather than through
 * spies on application code, so the assertions stay about what the app asked
 * the network for.
 */
export const collectRequests = () => {
  const urls = [];

  server.events.on("request:start", ({ request }) => {
    urls.push(request.url);
  });

  return urls;
};

export const searchRequests = (urls, type) =>
  urls.filter((url) => url.includes(`/search/${type}`));

/**
 * The list requests among a recorded set, in the order they were issued.
 */
export const listRequests = (urls) =>
  urls.filter((url) => LIST_PATHS.some((path) => url.includes(path)));

/**
 * The path a recorded request went to, without the query string.
 */
export const pathOf = (url) => new URL(url).pathname;

/**
 * Waits a moment, so that a request the app was going to make anyway has
 * actually been issued before a test claims that it was not made.
 */
export const settle = () =>
  new Promise((resolve) => setTimeout(resolve, 100));
