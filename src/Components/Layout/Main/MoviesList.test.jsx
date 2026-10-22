import React from "react";
import { screen } from "@testing-library/react";

import MoviesList from "./MoviesList";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";
import { movieFixture } from "../../../test-utils/fixtures";

const renderShelf = (props) =>
  renderWithProviders({ ui: <MoviesList title="Popular Movies" {...props} /> });

describe("a shelf of titles", () => {
  it("keeps its heading when there are no items", () => {
    renderShelf({ contentArr: [], contentType: "movie" });

    expect(
      screen.getByRole("heading", { name: "Popular Movies" })
    ).toBeInTheDocument();
  });

  it("links every item to its own screen", () => {
    renderShelf({
      contentArr: [
        movieFixture({ id: 21, title: "First Movie" }),
        movieFixture({ id: 22, title: "Second Movie" }),
      ],
      contentType: "movie",
    });

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/movie/21");
    expect(links[1]).toHaveAttribute("href", "/movie/22");
  });

  it("shows the name of every item", () => {
    renderShelf({
      contentArr: [
        movieFixture({ id: 23, title: "Named Movie" }),
        movieFixture({ id: 24, title: "Other Named Movie" }),
      ],
      contentType: "movie",
    });

    expect(screen.getByText("Named Movie")).toBeInTheDocument();
    expect(screen.getByText("Other Named Movie")).toBeInTheDocument();
  });

  it("shows the heading but hides the items while the shelf is loading", () => {
    renderShelf({
      contentArr: [movieFixture({ id: 25, title: "Hidden Movie" })],
      contentType: "movie",
      isLoading: true,
    });

    expect(
      screen.getByRole("heading", { name: "Popular Movies" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Hidden Movie")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("shows the message instead of the items when the shelf failed to load", () => {
    renderShelf({
      contentArr: [movieFixture({ id: 26, title: "Unreachable Movie" })],
      contentType: "movie",
      isError: true,
      error: new Error("The list is unavailable."),
    });

    expect(screen.getByText("The list is unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("Unreachable Movie")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("shows its own message when the failure carries none", () => {
    renderShelf({
      contentArr: [],
      contentType: "movie",
      isError: true,
      error: new Error(""),
    });

    expect(screen.getByText("Could not load this list.")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("still shows an item that has no id", () => {
    renderShelf({
      contentArr: [{ title: "Untitled Item", poster_path: "/poster-x.jpg" }],
      contentType: "movie",
    });

    expect(screen.getByText("Untitled Item")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("names a tv item by its name and a movie by its title", () => {
    renderShelf({
      contentArr: [
        {
          id: 31,
          name: "The Series Name",
          original_name: "The Series Original Name",
          poster_path: "/poster-31.jpg",
        },
        {
          id: 32,
          title: "The Movie Title",
          original_title: "The Movie Original Title",
          poster_path: "/poster-32.jpg",
        },
      ],
      contentType: "movie",
    });

    expect(screen.getByText("The Series Name")).toBeInTheDocument();
    expect(
      screen.queryByText("The Series Original Name")
    ).not.toBeInTheDocument();
    expect(screen.getByText("The Movie Title")).toBeInTheDocument();
    expect(
      screen.queryByText("The Movie Original Title")
    ).not.toBeInTheDocument();
  });
});
