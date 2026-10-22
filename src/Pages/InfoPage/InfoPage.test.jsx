import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import InfoPage from "./InfoPage";
import {
  createTestQueryClient,
  renderWithProviders,
} from "../../test-utils/renderWithProviders";
import {
  collectRequests,
  pathOf,
  server,
} from "../../test-utils/mswServer";
import { movieFixture, tvFixture } from "../../test-utils/fixtures";
import { TMDB_BASE_URL } from "../../test-utils/constants";

const FIND = { timeout: 5000 };

const MovieRoutes = () => (
  <Routes>
    <Route path="/movie/:id" element={<InfoPage type="movie" />} />
    <Route path="/tv/:id" element={<InfoPage type="tv" />} />
  </Routes>
);

const shelfOf = (title) => {
  const heading = screen.getByRole("heading", { name: title });
  return within(heading.closest("div"));
};

describe("the details of a film", () => {
  it("shows the film that was named in the url", async () => {
    const requests = collectRequests();

    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(
      await screen.findByRole("heading", { name: "Movie 550" }, FIND)
    ).toBeInTheDocument();

    expect(
      requests.some((url) => pathOf(url) === "/3/movie/550")
    ).toBe(true);
  });

  it("lists the genres of the film", async () => {
    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(await screen.findByText("Action", {}, FIND)).toBeInTheDocument();
    expect(screen.getByText("Crime")).toBeInTheDocument();
  });

  it("shows the synopsis of the film", async () => {
    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(
      await screen.findByText("A movie overview.", {}, FIND)
    ).toBeInTheDocument();
  });

  it("shows the first five cast members of the film", async () => {
    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(
      await screen.findByText("Cast Member 1", {}, FIND)
    ).toBeInTheDocument();

    for (let index = 2; index <= 5; index += 1) {
      expect(screen.getByText(`Cast Member ${index}`)).toBeInTheDocument();
    }

    expect(screen.queryByText("Cast Member 6")).not.toBeInTheDocument();
  });

  it("embeds the trailer of the film", async () => {
    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    const trailer = await screen.findByTitle("YouTube video player", {}, FIND);

    expect(trailer).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/trailer-key"
    );
    expect(
      screen.getByRole("heading", { name: "Official Trailer" })
    ).toBeInTheDocument();
  });

  it("shows no trailer section for a film without videos", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, () =>
        HttpResponse.json({
          id: 550,
          title: "Movie 550",
          original_title: "Movie 550",
          overview: "A movie overview.",
          genres: [],
        })
      )
    );

    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(
      await screen.findByRole("heading", { name: "Movie 550" }, FIND)
    ).toBeInTheDocument();
    expect(screen.queryByTitle("YouTube video player")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Official Trailer" })
    ).not.toBeInTheDocument();
  });

  it("lists the similar titles and links onward", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550/similar`, () =>
        HttpResponse.json({
          results: [
            movieFixture({ id: 31, title: "Similar Movie Title" }),
            movieFixture({ id: 32, title: "Another Similar Movie" }),
          ],
        })
      )
    );

    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(
      await screen.findByRole("heading", { name: "Similar Movies" }, FIND)
    ).toBeInTheDocument();

    const links = await shelfOf("Similar Movies").findAllByRole("link");

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/movie/31");
    expect(links[1]).toHaveAttribute("href", "/movie/32");
    expect(
      shelfOf("Similar Movies").getByText("Similar Movie Title")
    ).toBeInTheDocument();
    expect(
      shelfOf("Similar Movies").getByText("Another Similar Movie")
    ).toBeInTheDocument();
  });

  it("says it is loading before it shows the film", async () => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });

    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, async () => {
        await gate;
        return HttpResponse.json({
          id: 550,
          title: "Movie 550",
          original_title: "Movie 550",
          overview: "A movie overview.",
          genres: [],
        });
      })
    );

    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(screen.getByText("Loading details...")).toBeInTheDocument();

    release();

    expect(
      await screen.findByRole("heading", { name: "Movie 550" }, FIND)
    ).toBeInTheDocument();
    expect(screen.queryByText("Loading details...")).not.toBeInTheDocument();
  });

  it("shows TMDB's message when the film cannot be loaded", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, () =>
        HttpResponse.json(
          { status_message: "That film is unavailable." },
          { status: 500 }
        )
      )
    );

    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(
      await screen.findByText("That film is unavailable.", {}, FIND)
    ).toBeInTheDocument();
  });

  it("keeps the film on screen when the similar titles fail", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550/similar`, () =>
        HttpResponse.json(
          { status_message: "Similar titles are unavailable." },
          { status: 500 }
        )
      )
    );

    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(
      await screen.findByRole("heading", { name: "Movie 550" }, FIND)
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Similar titles are unavailable.", {}, FIND)
    ).toBeInTheDocument();
  });

  it("scrolls back to the top when another film is opened", async () => {
    renderWithProviders({ ui: <MovieRoutes />, route: "/movie/550" });

    expect(
      await screen.findByRole("heading", { name: "Movie 550" }, FIND)
    ).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledTimes(1);

    await userEvent.click(
      await shelfOf("Similar Movies").findByRole("link", {
        name: /Similar Movie Title/,
      })
    );

    expect(
      await screen.findByRole("heading", { name: "Movie 31" }, FIND)
    ).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });

  it("shows the film straight away when it is opened again", async () => {
    const queryClient = createTestQueryClient();
    const requests = collectRequests();

    const { unmount } = renderWithProviders({
      ui: <MovieRoutes />,
      route: "/movie/550",
      queryClient,
    });
    expect(
      await screen.findByRole("heading", { name: "Movie 550" }, FIND)
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Similar Movie Title", {}, FIND)
    ).toBeInTheDocument();
    unmount();

    const before = requests.length;

    renderWithProviders({
      ui: <MovieRoutes />,
      route: "/movie/550",
      queryClient,
    });

    expect(screen.getByRole("heading", { name: "Movie 550" })).toBeInTheDocument();
    expect(screen.getByText("Similar Movie Title")).toBeInTheDocument();
    expect(screen.queryByText("Loading details...")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(requests).toHaveLength(before);
  });

  it("shows the series' name, its tv links and the tv similar shelf", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/tv/1399/similar`, () =>
        HttpResponse.json({
          results: [
            tvFixture({ id: 41, name: "Similar Tv Series Title" }),
            tvFixture({ id: 42, name: "Another Similar Series" }),
          ],
        })
      )
    );

    renderWithProviders({ ui: <MovieRoutes />, route: "/tv/1399" });

    expect(
      await screen.findByRole("heading", { name: "Series 1399" }, FIND)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Similar Tv Series" })
    ).toBeInTheDocument();

    const links = await shelfOf("Similar Tv Series").findAllByRole("link");

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/tv/41");
    expect(links[1]).toHaveAttribute("href", "/tv/42");
    expect(
      shelfOf("Similar Tv Series").getByText("Similar Tv Series Title")
    ).toBeInTheDocument();
    expect(
      shelfOf("Similar Tv Series").getByText("Another Similar Series")
    ).toBeInTheDocument();
  });
});
