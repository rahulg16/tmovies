import { http, HttpResponse } from "msw";

import apiGet, { REQUEST_TIMEOUT } from "./client";
import { TMDB_BASE_URL } from "../test-utils/constants";
import { collectRequests, server } from "../test-utils/mswServer";

describe("the TMDB client", () => {
  it("passes TMDB's own error message on to the caller", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, () =>
        HttpResponse.json(
          { status_message: "The film is missing." },
          { status: 404 }
        )
      )
    );

    await expect(apiGet("movie/550")).rejects.toMatchObject({
      message: "The film is missing.",
      status: 404,
    });
  });

  it("reports a request that never answers as a cancellation", async () => {
    jest.useFakeTimers();

    try {
      server.use(
        http.get(`${TMDB_BASE_URL}/movie/never`, () => new Promise(() => {}))
      );

      const pending = apiGet("movie/never");
      const assertion = expect(pending).rejects.toMatchObject({
        message: "The request was cancelled or timed out.",
        status: 0,
      });

      jest.advanceTimersByTime(REQUEST_TIMEOUT + 1);

      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });

  it("reports a caller cancelled request as a cancellation", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/slow`, () => new Promise(() => {}))
    );

    const controller = new AbortController();
    const pending = apiGet("movie/slow", { signal: controller.signal });
    const assertion = expect(pending).rejects.toMatchObject({
      message: "The request was cancelled or timed out.",
      status: 0,
    });

    controller.abort();

    await assertion;
  });

  it("reports a request whose signal is already cancelled as a cancellation", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      apiGet("movie/550", { signal: controller.signal })
    ).rejects.toMatchObject({
      message: "The request was cancelled or timed out.",
      status: 0,
    });
  });

  it("reports a network failure with no HTTP status", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/offline`, () => HttpResponse.error())
    );

    const error = await apiGet("movie/offline").catch((caught) => caught);

    expect(error.status).toBe(0);
    expect(typeof error.message).toBe("string");
    expect(error.message.length).toBeGreaterThan(0);
  });

  it("keeps the status-based message when the error body is not JSON", async () => {
    server.use(
      http.get(`${TMDB_BASE_URL}/movie/550`, () =>
        HttpResponse.text("upstream exploded", {
          status: 503,
          statusText: "Service Unavailable",
        })
      )
    );

    await expect(apiGet("movie/550")).rejects.toMatchObject({
      message: "Service Unavailable",
      status: 503,
    });
  });

  it("leaves empty parameters out of the request", async () => {
    const requests = collectRequests();

    await apiGet("movie/550", {
      params: { query: "", skip: null, page: 2 },
    });

    const url = new URL(requests[0]);

    expect(url.searchParams.has("query")).toBe(false);
    expect(url.searchParams.has("skip")).toBe(false);
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("always identifies the api key and the language", async () => {
    const requests = collectRequests();

    await apiGet("movie/550");

    const url = new URL(requests[0]);

    expect(url.searchParams.get("api_key")).toBe("test-api-key");
    expect(url.searchParams.get("language")).toBe("en-US");
  });
});
