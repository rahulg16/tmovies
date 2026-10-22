import { http, HttpResponse } from "msw";

import {
  creditsFixture,
  genreFixture,
  movieFixture,
  searchResults,
  trendingResults,
  tvFixture,
  videosFixture,
} from "./fixtures";
import { TMDB_BASE_URL } from "./constants";

const list = (results) => HttpResponse.json({ results });

const details = (id, fixture) => ({
  ...fixture,
  genres: genreFixture(),
  videos: videosFixture(),
  credits: creditsFixture(),
});

/**
 * One handler per TMDB path used by `src/api/endpoints.js`.
 *
 * The static paths are registered before the `/:id` ones: MSW takes the first
 * matching handler, and `/movie/:id` would otherwise swallow
 * `/movie/popular`.
 */
export const handlers = [
  http.get(`${TMDB_BASE_URL}/trending/all/day`, () => list(trendingResults(10))),

  http.get(`${TMDB_BASE_URL}/movie/popular`, () =>
    list([movieFixture({ id: 11, title: "Popular Movie" })])
  ),
  http.get(`${TMDB_BASE_URL}/movie/upcoming`, () =>
    list([movieFixture({ id: 12, title: "Upcoming Movie" })])
  ),
  http.get(`${TMDB_BASE_URL}/movie/top_rated`, () =>
    list([movieFixture({ id: 13, title: "Top Rated Movie" })])
  ),
  http.get(`${TMDB_BASE_URL}/tv/popular`, () =>
    list([tvFixture({ id: 21, name: "Popular Tv Series" })])
  ),
  http.get(`${TMDB_BASE_URL}/tv/top_rated`, () =>
    list([tvFixture({ id: 22, name: "Top Tv Series" })])
  ),

  http.get(`${TMDB_BASE_URL}/movie/:id`, ({ params }) =>
    HttpResponse.json(
      details(
        params.id,
        movieFixture({ id: Number(params.id), title: `Movie ${params.id}` })
      )
    )
  ),
  http.get(`${TMDB_BASE_URL}/tv/:id`, ({ params }) =>
    HttpResponse.json(
      details(
        params.id,
        tvFixture({ id: Number(params.id), name: `Series ${params.id}` })
      )
    )
  ),

  http.get(`${TMDB_BASE_URL}/movie/:id/similar`, () =>
    list([movieFixture({ id: 31, title: "Similar Movie Title" })])
  ),
  http.get(`${TMDB_BASE_URL}/tv/:id/similar`, () =>
    list([tvFixture({ id: 41, name: "Similar Tv Series Title" })])
  ),

  http.get(`${TMDB_BASE_URL}/search/movie`, ({ request }) => {
    const term = new URL(request.url).searchParams.get("query") || "";
    return list(searchResults("movie", term));
  }),
  http.get(`${TMDB_BASE_URL}/search/tv`, ({ request }) => {
    const term = new URL(request.url).searchParams.get("query") || "";
    return list(searchResults("tv", term));
  }),
];
