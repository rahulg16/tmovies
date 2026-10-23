import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { dehydrate } from "@tanstack/react-query";
import createEmotionServer from "@emotion/server/create-instance";

import App from "../src/App";
import AppProviders from "../src/AppProviders";
import { createQueryClient } from "../src/createQueryClient";
import createEmotionCache from "../src/createEmotionCache";
import { buildStyleTags, createEmotionStream } from "./emotionStream";

function renderApp(url, queryClient, emotionCache) {
  return (
    <AppProviders queryClient={queryClient} emotionCache={emotionCache}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </AppProviders>
  );
}

/**
 * Streams the app. `onReady` is called once, with the shell styles, the
 * dehydrated cache and a stream that can be piped into the response.
 */
export function renderStream(url, options = {}) {
  const queryClient = createQueryClient();
  const emotionCache = createEmotionCache({ nonce: options.nonce });
  const sentIds = new Set();

  // This also sets `emotionCache.compat`, which stops Emotion from writing
  // <style> tags inside the React tree. We write them ourselves below.
  createEmotionServer(emotionCache);

  let started = false;
  let reactStream;

  const start = () => {
    if (started) return;
    started = true;

    const ids = Object.keys(emotionCache.inserted);
    const styles = buildStyleTags(emotionCache, ids);
    ids.forEach((id) => sentIds.add(id));

    const stream = createEmotionStream(emotionCache, {
      sentIds,
      nonce: options.nonce,
    });

    options.onReady({
      styles,
      stream,
      getState: () =>
        JSON.stringify(dehydrate(queryClient), (key, value) =>
          value === undefined ? null : value
        ).replace(/</g, "\\u003c"),
      abort: () => reactStream.abort(),
    });
    reactStream.pipe(stream);
  };

  reactStream = renderToPipeableStream(
    renderApp(url, queryClient, emotionCache),
    {
      onShellReady() {
        if (!options.waitForAllReady) start();
      },
      onAllReady() {
        if (options.waitForAllReady) start();
      },
      onShellError(error) {
        options.onShellError?.(error);
      },
      onError(error) {
        console.error("SSR render error:", error);
        options.onError?.(error);
      },
    }
  );

  return { abort: () => reactStream.abort() };
}
