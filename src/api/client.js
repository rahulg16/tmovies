import apiConfig from "./APIConfig";

export const REQUEST_TIMEOUT = 15000;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const buildUrl = (path, params = {}) => {
  const normalizedPath = path.replace(/^\//, "");
  const base = apiConfig.baseUrl;
  let url;

  if (base.startsWith("http")) {
    url = new URL(normalizedPath, base);
  } else {
    const origin =
      typeof window !== "undefined" && window.location
        ? window.location.origin
        : "http://localhost";
    url = new URL(base.replace(/\/?$/, "/") + normalizedPath, origin);
  }

  Object.entries({ api_key: apiConfig.apiKey, language: "en-US", ...params }).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  );

  return url.toString();
};

export const apiGet = async (path, { params, signal } = {}) => {
  const url = buildUrl(path, params);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      let message = response.statusText || `Request failed with status ${response.status}`;

      try {
        const body = await response.json();
        message = body?.status_message || message;
      } catch (parseError) {
        // Response body was not JSON, keep the status based message.
      }

      throw new ApiError(message, response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") {
      throw new ApiError("The request was cancelled or timed out.", 0);
    }
    throw new ApiError(error.message || "Network error while talking to TMDB.", 0);
  } finally {
    clearTimeout(timeoutId);
  }
};

export default apiGet;
