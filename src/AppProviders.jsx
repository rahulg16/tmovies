import React from "react";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";

import theme from "./theme";
import createEmotionCache from "./createEmotionCache";

// Shared provider tree used by both the client and server entries, so the
// hydrated tree matches the server-rendered one.
export function AppProviders({ children, queryClient, emotionCache }) {
  const cache = emotionCache || createEmotionCache();

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default AppProviders;
