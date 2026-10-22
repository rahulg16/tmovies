import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * A QueryClient for tests.
 *
 * `retry: false` keeps error scenarios from stalling for seconds.
 * `gcTime` is deliberately not zero: a cached entry has to outlive the
 * component that fetched it, otherwise "revisiting a screen shows the content
 * immediately" can never be true. A fresh client per test is what keeps the
 * cache from leaking between tests.
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });

/**
 * Renders the current route so a test can prove that no navigation happened.
 */
const LocationProbe = () => {
  const location = useLocation();
  return <span>{location.pathname}</span>;
};

export const renderWithProviders = ({
  ui,
  route = "/",
  queryClient = createTestQueryClient(),
  withLocationProbe = false,
} = {}) => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {children}
        {withLocationProbe ? <LocationProbe /> : null}
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { ...render(ui, { wrapper }), queryClient };
};

export default renderWithProviders;
