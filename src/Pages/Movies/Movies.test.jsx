import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import Movies from "./Movies";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import {
  collectRequests,
  searchRequests,
  server,
} from "../../test-utils/mswServer";
import { TMDB_BASE_URL } from "../../test-utils/constants";

const FIND = { timeout: 5000 };

const resultLinks = () =>
  screen
    .queryAllByRole("link")
    .filter((link) =>
      (link.getAttribute("href") || "").startsWith("/movie/")
    );

describe("the movie search screen", () => {
  it("opens already showing the results for 'batman'", async () => {
    const requests = collectRequests();

    renderWithProviders({ ui: <Movies />, route: "/movies" });

    expect(
      await screen.findByText("batman Begins", {}, FIND)
    ).toBeInTheDocument();
    expect(screen.getByText("batman Returns")).toBeInTheDocument();

    const performed = searchRequests(requests, "movie");
    expect(performed).toHaveLength(1);
    expect(performed[0]).toContain("query=batman");
  });

  it("searches for the term that was typed", async () => {
    const requests = collectRequests();

    renderWithProviders({ ui: <Movies />, route: "/movies" });
    await screen.findByText("batman Begins", {}, FIND);

    const input = screen.getByLabelText("Search movies");
    await userEvent.clear(input);
    await userEvent.type(input, "superman");

    expect(
      await screen.findByText("superman Begins", {}, FIND)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        searchRequests(requests, "movie").some((url) =>
          url.includes("query=superman")
        )
      ).toBe(true);
    });
  });

  it("fires a single request for the term that was finally typed", async () => {
    const requests = collectRequests();

    renderWithProviders({ ui: <Movies />, route: "/movies" });
    await screen.findByText("batman Begins", {}, FIND);

    const before = searchRequests(requests, "movie").length;

    const input = screen.getByLabelText("Search movies");
    await userEvent.clear(input);
    await userEvent.type(input, "superman");

    expect(
      await screen.findByText("superman Begins", {}, FIND)
    ).toBeInTheDocument();

    const performed = searchRequests(requests, "movie");
    expect(performed).toHaveLength(before + 1);
    expect(performed[before]).toContain("query=superman");
  });

  it("links every result to its own detail screen", async () => {
    renderWithProviders({ ui: <Movies />, route: "/movies" });
    await screen.findByText("batman Begins", {}, FIND);

    const links = resultLinks();
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/movie/101");
    expect(links[1]).toHaveAttribute("href", "/movie/102");
  });

  it("shows the title of every result", async () => {
    renderWithProviders({ ui: <Movies />, route: "/movies" });

    expect(
      await screen.findByText("batman Begins", {}, FIND)
    ).toBeInTheDocument();
    expect(screen.getByText("batman Returns")).toBeInTheDocument();
  });

  it("shows neither result cards nor an error message when the search has no results", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/search/movie`, () =>
        HttpResponse.json({ results: [] })
      )
    );

    const requests = collectRequests();
    const { queryClient } = renderWithProviders({
      ui: <Movies />,
      route: "/movies",
    });

    await waitFor(() => {
      expect(searchRequests(requests, "movie").length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(resultLinks()).toHaveLength(0);
    expect(screen.queryAllByRole("paragraph")).toHaveLength(0);
  });

  it("does not reload the page when the search button is pressed", async () => {
    const requests = collectRequests();

    renderWithProviders({
      ui: <Movies />,
      route: "/movies",
      withLocationProbe: true,
    });
    await screen.findByText("batman Begins", {}, FIND);

    const before = requests.length;
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByText("/movies")).toBeInTheDocument();
    expect(screen.getByText("batman Begins")).toBeInTheDocument();
    expect(requests).toHaveLength(before);
  });

  it("starts out with 'batman' in the search box", () => {
    renderWithProviders({ ui: <Movies />, route: "/movies" });

    expect(screen.getByLabelText("Search movies")).toHaveValue("batman");
  });
});
