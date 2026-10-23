import React from "react";
import { render, screen } from "@testing-library/react";
import createCache from "@emotion/cache";

import AppProviders from "./AppProviders";
import { createQueryClient } from "./createQueryClient";

describe("the shared provider tree", () => {
  it("renders its children with a fresh cache", () => {
    render(
      <AppProviders queryClient={createQueryClient()}>
        <span>Provider child</span>
      </AppProviders>
    );

    expect(screen.getByText("Provider child")).toBeInTheDocument();
  });

  it("uses the cache passed by the server", () => {
    const emotionCache = createCache({ key: "css" });

    render(
      <AppProviders queryClient={createQueryClient()} emotionCache={emotionCache}>
        <span>Server child</span>
      </AppProviders>
    );

    expect(screen.getByText("Server child")).toBeInTheDocument();
  });

});
