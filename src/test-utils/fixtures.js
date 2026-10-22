/**
 * TMDB shaped fixture factories.
 *
 * Movie fixtures deliberately carry no `name` / `original_name` and TV
 * fixtures carry no `title`, so the app's own name fallbacks
 * (`content.name || content.original_name || content.title`) are exercised
 * the way they are in production.
 */

export const movieFixture = ({
  id = 1,
  title = "Movie Title",
  overview = "A movie overview.",
  poster_path = `/poster-${id}.jpg`,
  backdrop_path = `/backdrop-${id}.jpg`,
  genres = [],
  media_type = "movie",
  ...rest
} = {}) => ({
  id,
  title,
  original_title: title,
  overview,
  poster_path,
  backdrop_path,
  genres,
  media_type,
  ...rest,
});

export const tvFixture = ({
  id = 2,
  name = "Tv Series Name",
  overview = "A tv series overview.",
  poster_path = `/poster-${id}.jpg`,
  backdrop_path = `/backdrop-${id}.jpg`,
  genres = [],
  media_type = "tv",
  ...rest
} = {}) => ({
  id,
  name,
  original_name: name,
  overview,
  poster_path,
  backdrop_path,
  genres,
  media_type,
  ...rest,
});

export const creditsFixture = (count = 6) => ({
  cast: Array.from({ length: count }, (_, index) => ({
    id: 1000 + index,
    name: `Cast Member ${index + 1}`,
    original_name: `Cast Member ${index + 1}`,
    character: `Character ${index + 1}`,
    profile_path: `/profile-${index + 1}.jpg`,
  })),
  crew: [],
});

export const videosFixture = (key = "trailer-key") => ({
  results: [
    {
      id: "video-1",
      key,
      name: "Official Trailer",
      site: "YouTube",
      type: "Trailer",
      official: true,
    },
  ],
});

export const genreFixture = () => [
  { id: 28, name: "Action" },
  { id: 80, name: "Crime" },
];

/**
 * The trending shelf mixes movies and TV, so the hero has to label both.
 * The first entry is the movie the banner scenarios point at, the second is
 * the TV one.
 */
export const trendingResults = (count = 10) => {
  const featured = [
    movieFixture({
      id: 550,
      title: "The Dark Knight",
      overview: "A detective in Gotham fights crime.",
    }),
    tvFixture({
      id: 1399,
      name: "Game of Thrones",
      overview: "Noble families vie for power.",
    }),
  ];

  const rest = Array.from(
    { length: Math.max(count - featured.length, 0) },
    (_, index) =>
      index % 2 === 0
        ? movieFixture({
            id: 200 + index,
            title: `Trending Movie ${index + 1}`,
            overview: `Trending movie number ${index + 1}.`,
          })
        : tvFixture({
            id: 300 + index,
            name: `Trending Series ${index + 1}`,
            overview: `Trending series number ${index + 1}.`,
          })
  );

  return [...featured, ...rest].slice(0, count);
};

/**
 * Search results are derived from the searched term, so a test can prove that
 * the results on screen belong to the term that was requested.
 */
export const searchResults = (type, term) =>
  type === "tv"
    ? [
        tvFixture({ id: 201, name: `${term} Chronicles` }),
        tvFixture({ id: 202, name: `${term} Rising` }),
      ]
    : [
        movieFixture({ id: 101, title: `${term} Begins` }),
        movieFixture({ id: 102, title: `${term} Returns` }),
      ];

export const titleOf = (item) => item.title || item.name;
