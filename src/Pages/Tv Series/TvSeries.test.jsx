import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import TvSeries from "./TvSeries";
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
    .filter((link) => (link.getAttribute("href") || "").startsWith("/tv/"));

describe("the tv series search screen", () => {
  it("opens already showing the results for 'Dexter'", async () => {
    const requests = collectRequests();

    renderWithProviders({ ui: <TvSeries />, route: "/tv-series" });

    expect(
      await screen.findByText("Dexter Chronicles", {}, FIND)
    ).toBeInTheDocument();
    expect(screen.getByText("Dexter Rising")).toBeInTheDocument();

    const performed = searchRequests(requests, "tv");
    expect(performed).toHaveLength(1);
    expect(performed[0]).toContain("query=Dexter");
  });

  it("searches for the term that was typed", async () => {
    const requests = collectRequests();

    renderWithProviders({ ui: <TvSeries />, route: "/tv-series" });
    await screen.findByText("Dexter Chronicles", {}, FIND);

    const input = screen.getByLabelText("Search tv series");
    await userEvent.clear(input);
    await userEvent.type(input, "Sopranos");

    expect(
      await screen.findByText("Sopranos Chronicles", {}, FIND)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        searchRequests(requests, "tv").some((url) =>
          url.includes("query=Sopranos")
        )
      ).toBe(true);
    });
  });

  it("fires a single request for the term that was finally typed", async () => {
    const requests = collectRequests();

    renderWithProviders({ ui: <TvSeries />, route: "/tv-series" });
    await screen.findByText("Dexter Chronicles", {}, FIND);

    const before = searchRequests(requests, "tv").length;

    const input = screen.getByLabelText("Search tv series");
    await userEvent.clear(input);
    await userEvent.type(input, "Sopranos");

    expect(
      await screen.findByText("Sopranos Chronicles", {}, FIND)
    ).toBeInTheDocument();

    const performed = searchRequests(requests, "tv");
    expect(performed).toHaveLength(before + 1);
    expect(performed[before]).toContain("query=Sopranos");
  });

  it("links every result to its own tv detail screen", async () => {
    renderWithProviders({ ui: <TvSeries />, route: "/tv-series" });
    await screen.findByText("Dexter Chronicles", {}, FIND);

    const links = resultLinks();
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/tv/201");
    expect(links[1]).toHaveAttribute("href", "/tv/202");
  });

  it("shows the title of every result", async () => {
    renderWithProviders({ ui: <TvSeries />, route: "/tv-series" });

    expect(
      await screen.findByText("Dexter Chronicles", {}, FIND)
    ).toBeInTheDocument();
    expect(screen.getByText("Dexter Rising")).toBeInTheDocument();
  });

  it("shows neither result cards nor an error message when the search has no results", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/search/tv`, () =>
        HttpResponse.json({ results: [] })
      )
    );

    const requests = collectRequests();
    const { queryClient } = renderWithProviders({
      ui: <TvSeries />,
      route: "/tv-series",
    });

    await waitFor(() => {
      expect(searchRequests(requests, "tv").length).toBeGreaterThan(0);
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
      ui: <TvSeries />,
      route: "/tv-series",
      withLocationProbe: true,
    });
    await screen.findByText("Dexter Chronicles", {}, FIND);

    const before = requests.length;
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByText("/tv-series")).toBeInTheDocument();
    expect(screen.getByText("Dexter Chronicles")).toBeInTheDocument();
    expect(requests).toHaveLength(before);
  });

  it("starts out with 'Dexter' in the search box", () => {
    renderWithProviders({ ui: <TvSeries />, route: "/tv-series" });

    expect(screen.getByLabelText("Search tv series")).toHaveValue("Dexter");
  });

  it("searches tv series rather than movies", async () => {
    const requests = collectRequests();

    renderWithProviders({ ui: <TvSeries />, route: "/tv-series" });

    await screen.findByText("Dexter Chronicles", {}, FIND);

    expect(searchRequests(requests, "tv")).toHaveLength(1);
    expect(searchRequests(requests, "movie")).toHaveLength(0);
  });
});
