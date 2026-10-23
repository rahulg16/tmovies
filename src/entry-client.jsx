import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HydrationBoundary } from "@tanstack/react-query";

import App from "./App";
import AppProviders from "./AppProviders";
import { createQueryClient } from "./createQueryClient";
import createEmotionCache from "./createEmotionCache";

const queryClient = createQueryClient();
const emotionCache = createEmotionCache();
const rootElement = document.getElementById("root");

const app = (
  <AppProviders queryClient={queryClient} emotionCache={emotionCache}>
    <HydrationBoundary state={window.__REACT_QUERY_STATE__}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HydrationBoundary>
  </AppProviders>
);

// The server renders into #root. In development, a plain page load is not
// server-rendered, so there is nothing to hydrate.
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
