import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { dehydrate } from "@tanstack/react-query";
import createEmotionServer from "@emotion/server/create-instance";

import App from "../src/App";
import AppProviders from "../src/AppProviders";
import { createQueryClient } from "../src/createQueryClient";
import createEmotionCache from "../src/createEmotionCache";
import { trendingDayQuery } from "../src/hooks/useTrending";
import {
  popularMoviesQuery,
  topRatedMoviesQuery,
  upcomingMoviesQuery,
} from "../src/hooks/useMovieLists";
import { popularTvQuery, topRatedTvQuery } from "../src/hooks/useTvLists";
import {
  movieDetailsQuery,
  similarMoviesQuery,
  tvDetailsQuery,
  similarTvQuery,
} from "../src/hooks/useDetails";
import { searchMoviesQuery, searchTvQuery } from "../src/hooks/useSearch";

async function prefetch(url, queryClient) {
  const parsed = new URL(url, "http://localhost");
  const pathname = parsed.pathname;
  const searchParams = parsed.searchParams;

  try {
    if (pathname === "/") {
      await Promise.all([
        queryClient.prefetchQuery(trendingDayQuery()),
        queryClient.prefetchQuery(popularMoviesQuery()),
        queryClient.prefetchQuery(topRatedMoviesQuery()),
        queryClient.prefetchQuery(upcomingMoviesQuery()),
        queryClient.prefetchQuery(popularTvQuery()),
        queryClient.prefetchQuery(topRatedTvQuery()),
      ]);
    } else if (pathname.startsWith("/movie/")) {
      const id = pathname.split("/")[2];
      if (id) {
        await Promise.all([
          queryClient.prefetchQuery(movieDetailsQuery(id)),
          queryClient.prefetchQuery(similarMoviesQuery(id)),
        ]);
      }
    } else if (pathname.startsWith("/tv/")) {
      const id = pathname.split("/")[2];
      if (id) {
        await Promise.all([
          queryClient.prefetchQuery(tvDetailsQuery(id)),
          queryClient.prefetchQuery(similarTvQuery(id)),
        ]);
      }
    } else if (pathname === "/movies") {
      await queryClient.prefetchQuery(
        searchMoviesQuery(searchParams.get("q") || "batman")
      );
    } else if (pathname === "/tv-series") {
      await queryClient.prefetchQuery(
        searchTvQuery(searchParams.get("q") || "Dexter")
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("SSR prefetch failed:", error);
  }
}

export async function render(url) {
  const queryClient = createQueryClient();
  await prefetch(url, queryClient);

  const emotionCache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(emotionCache);

  const html = renderToString(
    <AppProviders queryClient={queryClient} emotionCache={emotionCache}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </AppProviders>
  );

  const chunks = extractCriticalToChunks(html);
  const styles = constructStyleTagsFromChunks(chunks);
  const state = JSON.stringify(dehydrate(queryClient)).replace(/</g, "\\u003c");

  return { html, styles, state };
}

export default render;
