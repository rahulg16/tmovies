import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import VideoEmbed, { VIDEO_LOAD_TIMEOUT } from "./VideoEmbed";

const SRC = "https://www.youtube.com/embed/abc123?rel=0&playsinline=1";

describe("an embedded video", () => {
  it("says so instead of showing a player when there is no video", () => {
    render(<VideoEmbed src="" />);

    expect(screen.queryByTitle("Video player")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This video could not be loaded."
    );
  });

  it("takes the loading placeholder away once the video has loaded", () => {
    render(<VideoEmbed src={SRC} title="Official Trailer" />);

    const iframe = screen.getByTitle("Official Trailer");

    expect(screen.getByRole("status")).toHaveTextContent("Loading video…");
    expect(screen.getByTestId("video-embed-skeleton")).toBeInTheDocument();

    fireEvent.load(iframe);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByTestId("video-embed-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTitle("Official Trailer")).toBeInTheDocument();
  });

  it("offers the video on YouTube when the player takes too long", () => {
    jest.useFakeTimers();

    try {
      render(<VideoEmbed src={SRC} title="Official Trailer" />);

      expect(screen.getByTestId("video-embed-skeleton")).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(VIDEO_LOAD_TIMEOUT + 1);
      });

      // The placeholder must not keep blocking the player.
      expect(screen.queryByTestId("video-embed-skeleton")).not.toBeInTheDocument();

      const link = screen.getByRole("link", { name: "Open on YouTube" });
      expect(link).toHaveAttribute(
        "href",
        "https://www.youtube.com/watch?v=abc123"
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it("says so when the video cannot be played", () => {
    render(<VideoEmbed src={SRC} title="Official Trailer" />);

    fireEvent.error(screen.getByTitle("Official Trailer"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This video could not be loaded."
    );
    expect(screen.queryByTestId("video-embed-skeleton")).not.toBeInTheDocument();
  });
});
