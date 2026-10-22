const endpoints = {
  trending: (window = "day") => `trending/all/${window}`,
  popularMovies: () => "movie/popular",
  upcomingMovies: () => "movie/upcoming",
  topRatedMovies: () => "movie/top_rated",
  popularTv: () => "tv/popular",
  topRatedTv: () => "tv/top_rated",
  movieDetails: (id) => `movie/${id}`,
  tvDetails: (id) => `tv/${id}`,
  similarMovies: (id) => `movie/${id}/similar`,
  similarTv: (id) => `tv/${id}/similar`,
  searchMovies: () => "search/movie",
  searchTv: () => "search/tv",
};

export default endpoints;
