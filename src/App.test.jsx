import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { renderWithProviders } from "./test-utils/renderWithProviders";

const FIND = { timeout: 5000 };

describe("the app", () => {
  it("opens the home screen at '/'", async () => {
    renderWithProviders({ ui: <App />, route: "/" });

    expect(
      await screen.findByRole("heading", { name: "Popular Movies" }, FIND)
    ).toBeInTheDocument();
  });

  it("opens the movie search screen at '/movies'", async () => {
    renderWithProviders({ ui: <App />, route: "/movies" });

    expect(await screen.findByLabelText("Search movies", {}, FIND)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Movies" })).toBeInTheDocument();
  });

  it("opens the tv search screen at '/tv-series'", async () => {
    renderWithProviders({ ui: <App />, route: "/tv-series" });

    expect(
      await screen.findByLabelText("Search tv series", {}, FIND)
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TV Series" })).toBeInTheDocument();
  });

  it("opens a film's details at '/movie/:id'", async () => {
    renderWithProviders({ ui: <App />, route: "/movie/550" });

    expect(
      await screen.findByRole("heading", { name: "Movie 550" }, FIND)
    ).toBeInTheDocument();
  });

  it("opens a series' details at '/tv/:id'", async () => {
    renderWithProviders({ ui: <App />, route: "/tv/1399" });

    expect(
      await screen.findByRole("heading", { name: "Series 1399" }, FIND)
    ).toBeInTheDocument();
  });

  it("goes to the movie search screen when 'Movies' is clicked", async () => {
    renderWithProviders({ ui: <App />, route: "/" });

    await userEvent.click(screen.getByRole("link", { name: "Movies" }));

    expect(
      await screen.findByLabelText("Search movies", {}, FIND)
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Movies" })).toBeInTheDocument();
  });

  it("goes to the tv search screen when 'Tv Series' is clicked", async () => {
    renderWithProviders({ ui: <App />, route: "/" });

    await userEvent.click(screen.getByRole("link", { name: "Tv Series" }));

    expect(
      await screen.findByLabelText("Search tv series", {}, FIND)
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TV Series" })).toBeInTheDocument();
  });

  it("goes back home when the logo is clicked", async () => {
    renderWithProviders({ ui: <App />, route: "/movies" });

    await userEvent.click(screen.getByRole("link", { name: "T Movies" }));

    expect(
      await screen.findByRole("heading", { name: "Popular Movies" }, FIND)
    ).toBeInTheDocument();
  });
});
