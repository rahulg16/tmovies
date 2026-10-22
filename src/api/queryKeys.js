const normaliseTerm = (term) => term?.trim().toLowerCase();

export const queryKeys = {
  trending: {
    day: () => ["trending", "day"],
    week: () => ["trending", "week"],
  },
  movies: {
    popular: () => ["movies", "popular"],
    upcoming: () => ["movies", "upcoming"],
    topRated: () => ["movies", "topRated"],
    details: (id) => ["movie", id],
    similar: (id) => ["movie", id, "similar"],
    search: (term) => ["movies", "search", normaliseTerm(term)],
  },
  tv: {
    popular: () => ["tv", "popular"],
    topRated: () => ["tv", "topRated"],
    details: (id) => ["tv", id],
    similar: (id) => ["tv", id, "similar"],
    search: (term) => ["tv", "search", normaliseTerm(term)],
  },
};

export default queryKeys;
