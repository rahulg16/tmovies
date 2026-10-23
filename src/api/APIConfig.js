import Placeholder from "../Assets/placeholder.png";

const isTest = typeof process !== "undefined" && process.env && process.env.NODE_ENV === "test";
const isServer = !isTest && typeof window === "undefined" && typeof process !== "undefined";

const TMDB_API_KEY = isServer || isTest
  ? (typeof process !== "undefined" && (process.env.TMDB_API_KEY || process.env.REACT_APP_TMDB_API_KEY))
  : undefined;

const MISSING_KEY_MESSAGE =
  "[tmovies] Missing REACT_APP_TMDB_API_KEY. Copy `.env.example` to `.env` and add your TMDB API key.";

if ((isServer || isTest) && !TMDB_API_KEY && (typeof process === "undefined" || process.env.NODE_ENV !== "production")) {
  throw new Error(MISSING_KEY_MESSAGE);
}

if ((isServer || isTest) && !TMDB_API_KEY) {
  // eslint-disable-next-line no-console
  console.error(MISSING_KEY_MESSAGE);
}

const buildImageUrl = (size, path) => {
  if (!path) return "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `https://image.tmdb.org/t/p/${size}${normalized}`;
};

const apiConfig = {
  baseUrl: isServer || isTest ? "https://api.themoviedb.org/3/" : "/api/tmdb/",
  apiKey: TMDB_API_KEY,
  originalImage: (imgPath) => buildImageUrl("original", imgPath),
  w500: (imgPath) => buildImageUrl("w500", imgPath),
  posterImage: (imgPath) => buildImageUrl("w500", imgPath) || Placeholder,
  backdropImage: (imgPath) => buildImageUrl("original", imgPath),
};

export default apiConfig;
