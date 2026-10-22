import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  const isServer = typeof window === "undefined";

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        // On the server, never retry — a failing upstream should surface
        // the error state immediately instead of stalling the response.
        retry: isServer ? 0 : 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

// Backwards-compatible default instance for the client entry.
export const queryClient = createQueryClient();

export default createQueryClient;
