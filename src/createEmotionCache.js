import createCache from "@emotion/cache";

export default function createEmotionCache(options = {}) {
  return createCache({ key: "css", ...options });
}
