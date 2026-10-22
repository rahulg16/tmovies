import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import Home from "./Home";
import {
  createTestQueryClient,
  renderWithProviders,
} from "../../test-utils/renderWithProviders";
import {
  collectRequests,
  listRequests,
  server,
} from "../../test-utils/mswServer";
import { LIST_PATHS, TMDB_BASE_URL } from "../../test-utils/constants";

const FIND = { timeout: 5000 };

/**
 * The five shelves of the home screen, with the link each one is expected to
 * hold. The titles are the shelf headings, the hrefs come from the handlers
 * in `src/test-utils/handlers.js`.
 */
const SHELVES = [
  { title: "Popular Movies", href: "/movie/11" },
  { title: "Top Rated Movies", href: "/movie/13" },
  { title: "Upcoming Movies In Theatres", href: "/movie/12" },
  { title: "Popular TV Series", href: "/tv/21" },
  { title: "Top TV Series", href: "/tv/22" },
];

const shelfOf = (title) => {
  const heading = screen.getByRole("heading", { name: title });
  return within(heading.closest("div"));
};

describe("the home screen", () => {
  it("shows the five shelves, each with its heading", async () => {
    renderWithProviders({ ui: <Home /> });

    for (const shelf of SHELVES) {
      expect(
        await screen.findByRole("heading", { name: shelf.title }, FIND)
      ).toBeInTheDocument();
    }
  });

  it("wires each shelf to its own media type", async () => {
    renderWithProviders({ ui: <Home /> });

    for (const shelf of SHELVES) {
      const links = await shelfOf(shelf.title).findAllByRole("link");

      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", shelf.href);
    }
  });

  it("shows the trending hero and the shelves together", async () => {
    renderWithProviders({ ui: <Home /> });

    expect(
      await screen.findByRole("heading", { name: "The Dark Knight" }, FIND)
    ).toBeInTheDocument();

    for (const item of [
      "Popular Movie",
      "Top Rated Movie",
      "Upcoming Movie",
      "Popular Tv Series",
      "Top Tv Series",
    ]) {
      expect(await screen.findByText(item, {}, FIND)).toBeInTheDocument();
    }
  });

  it("keeps the other shelves working when one of them fails", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/popular`, () =>
        HttpResponse.json(
          { status_message: "Popular movies are unavailable." },
          { status: 500 }
        )
      )
    );

    renderWithProviders({ ui: <Home /> });

    expect(
      await screen.findByText("Popular movies are unavailable.", {}, FIND)
    ).toBeInTheDocument();

    expect(
      shelfOf("Popular Movies").queryAllByRole("link")
    ).toHaveLength(0);

    for (const item of [
      "Top Rated Movie",
      "Upcoming Movie",
      "Popular Tv Series",
      "Top Tv Series",
    ]) {
      expect(await screen.findByText(item, {}, FIND)).toBeInTheDocument();
    }
  });

  it("starts all five lists at once instead of one after another", async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });

    server.use(
      ...LIST_PATHS.map((path) =>
        http.get(`${TMDB_BASE_URL}${path}`, async () => {
          await gate;
          return HttpResponse.json({ results: [] });
        })
      )
    );

    const requests = collectRequests();
    const { queryClient } = renderWithProviders({ ui: <Home /> });

    await waitFor(
      () => {
        expect(listRequests(requests)).toHaveLength(5);
      },
      { timeout: FIND.timeout }
    );

    release();

    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });
  });

  it("shows the cached content straight away when home is opened again", async () => {
    const shelfItems = [
      "Popular Movie",
      "Top Rated Movie",
      "Upcoming Movie",
      "Popular Tv Series",
      "Top Tv Series",
    ];
    const queryClient = createTestQueryClient();
    const requests = collectRequests();

    const { unmount } = renderWithProviders({ ui: <Home />, queryClient });

    for (const item of shelfItems) {
      expect(await screen.findByText(item, {}, FIND)).toBeInTheDocument();
    }

    unmount();

    const before = requests.length;

    renderWithProviders({ ui: <Home />, queryClient });

    for (const item of shelfItems) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(requests).toHaveLength(before);
  });
});
