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

    const trailer = await screen.findByTitle("YouTube video player", {}, FIND);
    expect(trailer).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/trailer-key"
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
    await screen.findByTitle("YouTube video player", {}, FIND);
    expect(screen.getByRole("presentation")).toBeInTheDocument();

    const focused = await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body);
      return document.activeElement;
    });

    fireEvent.keyDown(focused, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTitle("YouTube video player")).not.toBeInTheDocument();
      expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
    });
  });
});
