import React from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HydrationBoundary } from "@tanstack/react-query";

import App from "./App";
import AppProviders from "./AppProviders";
import { createQueryClient } from "./createQueryClient";
import createEmotionCache from "./createEmotionCache";

const queryClient = createQueryClient();
const emotionCache = createEmotionCache();

hydrateRoot(
  document.getElementById("root"),
  <AppProviders queryClient={queryClient} emotionCache={emotionCache}>
    <HydrationBoundary state={window.__REACT_QUERY_STATE__}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HydrationBoundary>
  </AppProviders>
);
