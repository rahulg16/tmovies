import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import ButtonModal from "./ButtonModal";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";
import {
  collectRequests,
  server,
  settle,
} from "../../../test-utils/mswServer";
import { TMDB_BASE_URL } from "../../../test-utils/constants";
import { movieFixture } from "../../../test-utils/fixtures";

const FIND = { timeout: 5000 };

const renderButton = () =>
  renderWithProviders({
    ui: <ButtonModal BtnName="Watch Trailer" data_id={550} data_type="movie" />,
  });

describe("the trailer button", () => {
  it("makes no request before the button is pressed", async () => {
    const requests = collectRequests();

    renderButton();
    await settle();

    expect(
      screen.getByRole("button", { name: "Watch Trailer" })
    ).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it("shows the trailer video once the button is pressed", async () => {
    renderButton();

    await userEvent.click(
      screen.getByRole("button", { name: "Watch Trailer" })
    );

    const trailer = await screen.findByTitle("Official Trailer", {}, FIND);
    expect(trailer).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/trailer-key?rel=0&playsinline=1"
    );
  });

  it("plays the official trailer rather than the first video", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, () =>
        HttpResponse.json(
          movieFixture({
            id: 550,
            title: "Movie 550",
            videos: {
              results: [
                {
                  id: "video-1",
                  key: "teaser-key",
                  name: "Teaser",
                  site: "YouTube",
                  type: "Teaser",
                },
                {
                  id: "video-2",
                  key: "official-key",
                  name: "Official Trailer",
                  site: "YouTube",
                  type: "Trailer",
                  official: true,
                },
              ],
            },
          })
        )
      )
    );

    renderButton();
    await userEvent.click(
      screen.getByRole("button", { name: "Watch Trailer" })
    );

    const trailer = await screen.findByTitle("Official Trailer", {}, FIND);
    expect(trailer).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/official-key?rel=0&playsinline=1"
    );
  });

  it("says so when the film has no trailer", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, () =>
        HttpResponse.json(movieFixture({ id: 550, title: "Movie 550" }))
      )
    );

    renderButton();
    await userEvent.click(
      screen.getByRole("button", { name: "Watch Trailer" })
    );

    expect(
      await screen.findByText("No trailer available.", {}, FIND)
    ).toBeInTheDocument();
  });

  it("says so when the film's videos cannot be played here", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, () =>
        HttpResponse.json(
          movieFixture({
            id: 550,
            title: "Movie 550",
            videos: {
              results: [
                {
                  id: "video-1",
                  key: "vimeo-key",
                  name: "Trailer",
                  site: "Vimeo",
                  type: "Trailer",
                  official: true,
                },
              ],
            },
          })
        )
      )
    );

    renderButton();
    await userEvent.click(
      screen.getByRole("button", { name: "Watch Trailer" })
    );

    expect(
      await screen.findByText("No trailer available.", {}, FIND)
    ).toBeInTheDocument();
    expect(screen.queryByTitle("Trailer")).not.toBeInTheDocument();
  });

  it("shows a message when the trailer cannot be loaded", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, () =>
        HttpResponse.json(
          { status_message: "The film is unavailable." },
          { status: 500 }
        )
      )
    );

    renderButton();
    await userEvent.click(
      screen.getByRole("button", { name: "Watch Trailer" })
    );

    expect(
      await screen.findByText("Could not load the trailer.", {}, FIND)
    ).toBeInTheDocument();
  });

  it("can be dismissed with the escape key", async () => {
    renderButton();
    await userEvent.click(
      screen.getByRole("button", { name: "Watch Trailer" })
    );
    await screen.findByTitle("Official Trailer", {}, FIND);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const focused = await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body);
      return document.activeElement;
    });

    fireEvent.keyDown(focused, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTitle("Official Trailer")).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
