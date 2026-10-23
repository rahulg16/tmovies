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

  it("has correct navigation links in the navbar", async () => {
    renderWithProviders({ ui: <App />, route: "/" });

    // Check that nav links have correct href attributes
    expect(screen.getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/movies");
    expect(screen.getByRole("link", { name: "Tv Series" })).toHaveAttribute("href", "/tv-series");
    expect(screen.getByRole("link", { name: "T Movies" })).toHaveAttribute("href", "/");
  });

  it("has correct navigation links on other pages", async () => {
    renderWithProviders({ ui: <App />, route: "/movies" });

    expect(screen.getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/movies");
    expect(screen.getByRole("link", { name: "Tv Series" })).toHaveAttribute("href", "/tv-series");
    expect(screen.getByRole("link", { name: "T Movies" })).toHaveAttribute("href", "/");
  });
});