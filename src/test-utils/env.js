/**
 * The TMDB key is read at module load by `src/api/APIConfig.js`, which throws
 * when the key is missing and `NODE_ENV !== "production"`. Jest runs with
 * `NODE_ENV=test`, so the key has to exist before anything imports the API
 * layer.
 *
 * It is forced — not read from the environment — so the suite never depends
 * on a developer's local `.env` and never puts a real credential in a
 * request URL.
 */
process.env.REACT_APP_TMDB_API_KEY = "test-api-key";
