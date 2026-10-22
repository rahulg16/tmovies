import React from "react";
import { screen } from "@testing-library/react";

import MovieInfo from "./MovieInfo";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";
import {
  creditsFixture,
  genreFixture,
  movieFixture,
} from "../../../test-utils/fixtures";

const renderInfo = (movie) => renderWithProviders({ ui: <MovieInfo movie={movie} /> });

describe("the details of a film", () => {
  it("shows nothing when there is no film", () => {
    const { container } = renderInfo(null);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the title of the film", () => {
    renderInfo(movieFixture({ id: 1, title: "The Named Film" }));

    expect(
      screen.getByRole("heading", { name: "The Named Film" })
    ).toBeInTheDocument();
  });

  it("shows the genres of the film", () => {
    renderInfo(
      movieFixture({ id: 2, title: "The Genred Film", genres: genreFixture() })
    );

    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Crime")).toBeInTheDocument();
  });

  it("shows the synopsis of the film", () => {
    renderInfo(
      movieFixture({
        id: 3,
        title: "The Described Film",
        overview: "A film with a synopsis worth reading.",
      })
    );

    expect(
      screen.getByText("A film with a synopsis worth reading.")
    ).toBeInTheDocument();
  });

  it("cuts a long synopsis to 530 characters and adds an ellipsis", () => {
    const overview = "A".repeat(600);
    const shortened = `${overview.slice(0, 530)}...`;

    renderInfo(
      movieFixture({ id: 4, title: "The Long Film", overview })
    );

    expect(screen.getByText(shortened)).toBeInTheDocument();
    expect(screen.queryByText(overview)).not.toBeInTheDocument();
  });

  it("shows the first five cast members and leaves out the sixth", () => {
    renderInfo({
      ...movieFixture({ id: 5, title: "The Cast Film" }),
      credits: creditsFixture(6),
    });

    ["Cast Member 1", "Cast Member 2", "Cast Member 3", "Cast Member 4", "Cast Member 5"].forEach(
      (name) => expect(screen.getByText(name)).toBeInTheDocument()
    );
    expect(screen.queryByText("Cast Member 6")).not.toBeInTheDocument();
  });

  it("shows no cast section for a film without credits", () => {
    renderInfo(movieFixture({ id: 6, title: "The Uncast Film" }));

    expect(
      screen.queryByRole("heading", { name: "Casts" })
    ).not.toBeInTheDocument();
  });

  it("shows the poster of the film", () => {
    renderInfo(
      movieFixture({
        id: 7,
        title: "The Poster Film",
        poster_path: "/poster-7.jpg",
      })
    );

    expect(screen.getByAltText("The Poster Film")).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w500/poster-7.jpg"
    );
  });

  it("shows no genres for a film that has none", () => {
    const { genres, ...withoutGenres } = movieFixture({
      id: 8,
      title: "The Unclassified Film",
      genres: genreFixture(),
    });

    renderInfo(withoutGenres);

    expect(
      screen.getByRole("heading", { name: "The Unclassified Film" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Action")).not.toBeInTheDocument();
    expect(screen.queryByText("Crime")).not.toBeInTheDocument();
  });

  it("shows no synopsis for a film that has none", () => {
    const overview = "A synopsis that should not be shown.";
    const { overview: removedOverview, ...withoutOverview } = movieFixture({
      id: 9,
      title: "The Undescribed Film",
      overview,
    });

    renderInfo(withoutOverview);

    expect(
      screen.getByRole("heading", { name: "The Undescribed Film" })
    ).toBeInTheDocument();
    expect(screen.queryByText(overview)).not.toBeInTheDocument();
  });

  it("still shows a cast member that has no id", () => {
    renderInfo({
      ...movieFixture({ id: 10, title: "The Unlisted Cast Film" }),
      credits: {
        cast: [
          {
            original_name: "Unidentified Performer",
            profile_path: "/profile-unidentified.jpg",
          },
        ],
      },
    });

    expect(
      screen.getByRole("heading", { name: "Casts" })
    ).toBeInTheDocument();
    expect(screen.getByText("Unidentified Performer")).toBeInTheDocument();
  });
});
