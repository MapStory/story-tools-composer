function searchConfig() {
  return {
    HOST: "https://mapstory.org/",
    CATEGORIES_ENDPOINT: "/api/categories/",
    KEYWORDS_ENDPOINT: "/api/keywords/",
    REGIONS_ENDPOINT: "/api/regions/",
    HAYSTACK_SEARCH: "True".toLowerCase() === "true",
    HAYSTACK_FACET_COUNTS: "False".toLowerCase() === "true",
    CLIENT_RESULTS_LIMIT: 30,
    AUTOCOMPLETE_URL_RESOURCEBASE: "/autocomplete/ResourceBaseAutocomplete/",
    AUTOCOMPLETE_URL_REGION: "/autocomplete/RegionAutocomplete/",
    AUTOCOMPLETE_URL_KEYWORD: "/autocomplete/TagAutocomplete/",
    SEARCH_URL: "/api/base/search/",
    SITE_NAME: "MapStory",
    USER: "admin"
  };
}

module.exports = searchConfig;
