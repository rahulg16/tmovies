import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";

import Banner from "./Banner";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";
import { collectRequests, server } from "../../../test-utils/mswServer";
import { TMDB_BASE_URL } from "../../../test-utils/constants";
import { trendingResults } from "../../../test-utils/fixtures";

const FIND = { timeout: 5000 };

describe("the trending hero", () => {
  it("shows the trending title and its synopsis", async () => {
    renderWithProviders({ ui: <Banner /> });

    expect(
      await screen.findByRole("heading", { name: "The Dark Knight" }, FIND)
    ).toBeInTheDocument();
    expect(
      screen.getByText("A detective in Gotham fights crime.")
    ).toBeInTheDocument();
  });

  it("shows only the first eight of the ten trending items", async () => {
    // The default handler serves ten trending items.
    renderWithProviders({ ui: <Banner /> });

    const watchNow = await screen.findAllByRole(
      "button",
      { name: "Watch Now" },
      FIND
    );

    expect(watchNow).toHaveLength(8);
  });

  it("sends a movie item to /movie/:id and a tv item to /tv/:id", async () => {
    renderWithProviders({ ui: <Banner /> });

    const links = await screen.findAllByRole(
      "link",
      { name: "Watch Now" },
      FIND
    );

    expect(links[0]).toHaveAttribute("href", "/movie/550");
    expect(links[1]).toHaveAttribute("href", "/tv/1399");
  });

  it("offers a trailer for each of the eight trending items", async () => {
    renderWithProviders({ ui: <Banner /> });

    const trailers = await screen.findAllByRole(
      "button",
      { name: "Watch Trailer" },
      FIND
    );

    expect(trailers).toHaveLength(8);
  });

  it("shows no trending title while the request is still in flight", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/trending/all/day`, () => delay("infinite"))
    );

    const requests = collectRequests();
    renderWithProviders({ ui: <Banner /> });

    await waitFor(() => {
      expect(requests.length).toBeGreaterThan(0);
    });

    expect(
      screen.queryByRole("heading", { name: "The Dark Knight" })
    ).not.toBeInTheDocument();
  });

  it("shows the message and a retry when trending fails", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/trending/all/day`, () =>
        HttpResponse.json(
          { status_message: "Trending is unavailable." },
          { status: 500 }
        )
      )
    );

    renderWithProviders({ ui: <Banner /> });

    expect(
      await screen.findByText("Trending is unavailable.", {}, FIND)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" })
    ).toBeInTheDocument();
  });

  it("re-requests the trending titles when 'Try again' is pressed", async () => {
    let attempt = 0;

    server.use(
      http.get(`${TMDB_BASE_URL}/trending/all/day`, () => {
        attempt += 1;

        if (attempt === 1) {
          return HttpResponse.json(
            { status_message: "Trending is unavailable." },
            { status: 500 }
          );
        }

        return HttpResponse.json({ results: trendingResults(10) });
      })
    );

    const requests = collectRequests();
    renderWithProviders({ ui: <Banner /> });

    await screen.findByText("Trending is unavailable.", {}, FIND);
    const before = requests.length;

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "The Dark Knight" }, FIND)
    ).toBeInTheDocument();
    expect(requests.length).toBe(before + 1);
  });

  it("labels a tv item with its name and a movie with its title", async () => {
    renderWithProviders({ ui: <Banner /> });

    expect(
      await screen.findByRole("heading", { name: "The Dark Knight" }, FIND)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Game of Thrones" })
    ).toBeInTheDocument();
  });

  it("shows no trending items when the response has none", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/trending/all/day`, () =>
        HttpResponse.json({})
      )
    );

    const requests = collectRequests();
    const { queryClient } = renderWithProviders({ ui: <Banner /> });

    await waitFor(
      () => {
        expect(requests.length).toBeGreaterThan(0);
      },
      { timeout: FIND.timeout }
    );
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(
      screen.queryByRole("link", { name: "Watch Now" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Watch Trailer" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
