/**
 * Helpers for the video results TMDB attaches to a film's details.
 *
 * TMDB returns every video it knows about for a title: official trailers,
 * teasers, clips, featurettes and interviews, on YouTube but also on other
 * sites. These helpers pick the ones a player can actually show, so no
 * component has to know the shape of the payload.
 *
 * Every function here is pure and tolerant of missing or malformed data.
 */

const YOUTUBE_SITE = "YouTube";

const RANK = {
  OFFICIAL_TRAILER: 0,
  TRAILER: 1,
  TEASER: 2,
  CLIP: 3,
  OTHER: 4,
};

const normalise = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

/**
 * A video is playable when TMDB says it lives on YouTube and it has a key,
 * because the key is what identifies the video on that site.
 */
export const isYouTubeVideo = (video) => {
  if (!video || typeof video !== "object") return false;
  if (video.site !== YOUTUBE_SITE) return false;
  return typeof video.key === "string" && video.key.trim().length > 0;
};

/**
 * The YouTube videos of a result set, in the order TMDB returned them.
 */
export const selectYouTubeVideos = (results) => {
  if (!Array.isArray(results)) return [];
  return results.filter(isYouTubeVideo);
};

/**
 * How interesting a video is: an official trailer first, then any trailer,
 * then a teaser, then a clip, then anything else.
 */
const rankOf = (video) => {
  const type = normalise(video.type);

  if (type === "trailer") {
    return video.official === true ? RANK.OFFICIAL_TRAILER : RANK.TRAILER;
  }
  if (type === "teaser") return RANK.TEASER;
  if (type === "clip") return RANK.CLIP;
  return RANK.OTHER;
};

/**
 * The one video to play when a title has a single trailer.
 *
 * An official trailer wins, then a trailer, then a teaser, and only then any
 * other YouTube video. `null` when there is nothing playable.
 */
export const selectPrimaryTrailer = (results) => {
  const videos = selectYouTubeVideos(results);
  if (videos.length === 0) return null;

  const officialTrailer = videos.find(
    (video) => rankOf(video) === RANK.OFFICIAL_TRAILER
  );
  if (officialTrailer) return officialTrailer;

  const trailer = videos.find((video) => rankOf(video) === RANK.TRAILER);
  if (trailer) return trailer;

  const teaser = videos.find((video) => rankOf(video) === RANK.TEASER);
  if (teaser) return teaser;

  return videos[0];
};

/**
 * The videos to show for a title.
 *
 * YouTube only, trailers before teasers, clips and the rest, one entry per
 * video key, capped at `limit`.
 */
export const selectTrailerList = (results, limit = 3) => {
  const videos = selectYouTubeVideos(results);

  const seen = new Set();
  const unique = [];
  videos.forEach((video) => {
    if (seen.has(video.key)) return;
    seen.add(video.key);
    unique.push(video);
  });

  const max = Number.isFinite(limit) && limit > 0 ? limit : 0;

  return unique
    .map((video, index) => ({ video, index }))
    .sort((a, b) => rankOf(a.video) - rankOf(b.video) || a.index - b.index)
    .map((entry) => entry.video)
    .slice(0, max);
};

/**
 * The address of the player that shows a YouTube video.
 *
 * Autoplay is off unless it is asked for, because a trailer that starts by
 * itself is a surprise for anyone who did not press play.
 */
export const youtubeEmbedUrl = (key, { autoplay = false } = {}) => {
  if (typeof key !== "string") return "";
  const trimmed = key.trim();
  if (!trimmed) return "";

  const query = autoplay ? "&autoplay=1&mute=1" : "";
  return `https://www.youtube.com/embed/${trimmed}?rel=0&playsinline=1${query}`;
};

/**
 * The key of a YouTube video, read out of any of its addresses.
 */
export const youtubeKeyFromSrc = (src) => {
  if (typeof src !== "string") return "";
  const match = src.match(/(?:embed\/|watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  return match ? match[1] : "";
};

/**
 * The address of the video on YouTube itself, for people who would rather
 * watch it there than in an embedded player.
 */
export const youtubeWatchUrl = (key) => {
  if (typeof key !== "string") return "";
  const trimmed = key.trim();
  if (!trimmed) return "";
  return `https://www.youtube.com/watch?v=${trimmed}`;
};
