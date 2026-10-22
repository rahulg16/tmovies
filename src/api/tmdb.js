import apiGet from "./client";
import endpoints from "./endpoints";

export const fetchTrending = ({ window = "day", signal } = {}) =>
  apiGet(endpoints.trending(window), { params: { page: 1 }, signal });

export const fetchPopularMovies = ({ signal } = {}) =>
  apiGet(endpoints.popularMovies(), { params: { page: 1 }, signal });

export const fetchUpcomingMovies = ({ signal } = {}) =>
  apiGet(endpoints.upcomingMovies(), { params: { page: 1 }, signal });

export const fetchTopRatedMovies = ({ signal } = {}) =>
  apiGet(endpoints.topRatedMovies(), { params: { page: 1 }, signal });

export const fetchPopularTv = ({ signal } = {}) =>
  apiGet(endpoints.popularTv(), { params: { page: 1 }, signal });

export const fetchTopRatedTv = ({ signal } = {}) =>
  apiGet(endpoints.topRatedTv(), { params: { page: 1 }, signal });

export const fetchMovieDetails = (id, { signal } = {}) =>
  apiGet(endpoints.movieDetails(id), {
    params: { append_to_response: "videos,credits" },
    signal,
  });

export const fetchTvDetails = (id, { signal } = {}) =>
  apiGet(endpoints.tvDetails(id), {
    params: { append_to_response: "videos,credits" },
    signal,
  });

export const fetchSimilarMovies = (id, { signal } = {}) =>
  apiGet(endpoints.similarMovies(id), { params: { page: 1 }, signal });

export const fetchSimilarTv = (id, { signal } = {}) =>
  apiGet(endpoints.similarTv(id), { params: { page: 1 }, signal });

export const fetchSearchMovies = (query, { signal } = {}) =>
  apiGet(endpoints.searchMovies(), {
    params: { query, page: 1, include_adult: false },
    signal,
  });

export const fetchSearchTv = (query, { signal } = {}) =>
  apiGet(endpoints.searchTv(), {
    params: { query, page: 1, include_adult: false },
    signal,
  });
