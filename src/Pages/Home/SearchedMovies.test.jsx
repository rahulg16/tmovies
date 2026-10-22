import React from "react";
import { screen } from "@testing-library/react";

import SearchedMovies from "./SearchedMovies";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import { movieFixture } from "../../test-utils/fixtures";
import Placeholder from "../../Assets/placeholder.png";

const renderResults = (props) =>
  renderWithProviders({ ui: <SearchedMovies type="movie" {...props} /> });

describe("the search results", () => {
  it("shows the loading state instead of results that are already present", () => {
    const results = [movieFixture({ id: 101, title: "Batman Begins" })];

    renderResults({ moviesArr: results, isLoading: true });

    expect(screen.queryByText("Batman Begins")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("shows a readable message when the search failed", () => {
    renderResults({
      isError: true,
      error: new Error("The search is unavailable."),
    });

    expect(screen.getByText("The search is unavailable.")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("shows its own message when the failure carries none", () => {
    renderResults({
      isError: true,
      error: new Error(""),
    });

    expect(screen.getByText("Could not load the results.")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("still shows a result that has no id", () => {
    renderResults({ moviesArr: [{ title: "Result Without Id" }] });

    expect(screen.getByText("Result Without Id")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows one card per result", () => {
    const results = [
      movieFixture({ id: 101, title: "Batman Begins" }),
      movieFixture({ id: 102, title: "Batman Returns" }),
    ];

    renderResults({ moviesArr: results });

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("Batman Begins")).toBeInTheDocument();
    expect(screen.getByText("Batman Returns")).toBeInTheDocument();
  });

  it("uses the placeholder poster for a result without one", () => {
    const results = [movieFixture({ id: 103, title: "No Poster", poster_path: null })];

    renderResults({ moviesArr: results });

    const poster = screen.getByAltText("No Poster poster-img");
    expect(poster).toHaveAttribute("src", Placeholder);
  });

  it("says that the results are being updated while they refresh", () => {
    const results = [movieFixture({ id: 104, title: "Refreshing Result" })];

    renderResults({ moviesArr: results, isFetching: true });

    expect(screen.getByText("Updating results...")).toBeInTheDocument();
    expect(screen.getByText("Refreshing Result")).toBeInTheDocument();
  });
});
