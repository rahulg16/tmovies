import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

/**
 * Suspense + error boundary for one independently streamed region.
 *
 * React Query's reset is wired into `ErrorBoundary` so the retry button clears
 * the failed query and lets `useSuspenseQuery` try again.
 */
function AsyncSection({ children, fallback, errorFallback, resetKeys }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          resetKeys={resetKeys}
          fallbackRender={({ error, resetErrorBoundary }) =>
            errorFallback({ error, retry: resetErrorBoundary })
          }
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default AsyncSection;
