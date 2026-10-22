const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const MISSING_KEY_MESSAGE =
  "[tmovies] Missing REACT_APP_TMDB_API_KEY. Copy `.env.example` to `.env` and add your TMDB API key.";

if (!TMDB_API_KEY && process.env.NODE_ENV !== "production") {
  throw new Error(MISSING_KEY_MESSAGE);
}

if (!TMDB_API_KEY) {
  // eslint-disable-next-line no-console
  console.error(MISSING_KEY_MESSAGE);
}

const buildImageUrl = (size, path) => {
  if (!path) return "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `https://image.tmdb.org/t/p/${size}${normalized}`;
};

const apiConfig = {
  baseUrl: "https://api.themoviedb.org/3/",
  apiKey: TMDB_API_KEY,
  originalImage: (imgPath) => buildImageUrl("original", imgPath),
  w500: (imgPath) => buildImageUrl("w500", imgPath),
};

export default apiConfig;
