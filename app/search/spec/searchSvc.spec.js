describe("pinSvc", function() {
  var rootScope,
    httpBackend,
    searchSvc,
    stateSvc,
    pin,
    categoryRes,
    serverFeatures,
    validProperties,
    pinConfigs;

  beforeEach(module("composer"));
  beforeEach(
    inject(function($rootScope, $httpBackend, _searchSvc_) {
      searchSvc = _searchSvc_;
      httpBackend = $httpBackend;
      rootScope = $rootScope;
      var categoryRes = {
        meta: {
          limit: 1000,
          next: null,
          offset: 0,
          previous: null,
          total_count: 8
        },
        objects: [
          {
            count: 55,
            description: "",
            description_en: "",
            fa_class: "fa-times",
            gn_description: "Biography",
            gn_description_en: "Biography",
            id: 1,
            identifier: "biography",
            is_choice: true,
            resource_uri: "/api/categories/1/"
          },
          {
            count: 77,
            description: "",
            description_en: "",
            fa_class: "fa-times",
            gn_description: "Crisis",
            gn_description_en: "Crisis",
            id: 13,
            identifier: "crisis",
            is_choice: true,
            resource_uri: "/api/categories/13/"
          },
          {
            count: 214,
            description: "",
            description_en: "",
            fa_class: "fa-times",
            gn_description: "Culture & Ideas",
            gn_description_en: "Culture & Ideas",
            id: 3,
            identifier: "cultureIdeas",
            is_choice: true,
            resource_uri: "/api/categories/3/"
          },
          {
            count: 633,
            description: "",
            description_en: "",
            fa_class: "fa-times",
            gn_description: "Geopolitics",
            gn_description_en: "Geopolitics",
            id: 6,
            identifier: "geopolitics",
            is_choice: true,
            resource_uri: "/api/categories/6/"
          },
          {
            count: 148,
            description: "",
            description_en: "",
            fa_class: "fa-times",
            gn_description: "Health",
            gn_description_en: "Health",
            id: 2,
            identifier: "health",
            is_choice: true,
            resource_uri: "/api/categories/2/"
          },
          {
            count: 271,
            description: "",
            description_en: "",
            fa_class: "fa-times",
            gn_description: "Human Settlement",
            gn_description_en: "Human Settlement",
            id: 11,
            identifier: "humanSettlement",
            is_choice: true,
            resource_uri: "/api/categories/11/"
          },
          {
            count: 282,
            description: "",
            description_en: "",
            fa_class: "fa-times",
            gn_description: "Nature & Environment",
            gn_description_en: "Nature & Environment",
            id: 9,
            identifier: "natureEnvironment",
            is_choice: true,
            resource_uri: "/api/categories/9/"
          },
          {
            count: 191,
            description: "",
            description_en: "",
            fa_class: "fa-times",
            gn_description: "Science & Industry",
            gn_description_en: "Science & Industry",
            id: 19,
            identifier: "scienceIndustry",
            is_choice: true,
            resource_uri: "/api/categories/19/"
          }
        ],
        requested_time: 1503346928.318694
      };

      httpBackend.when("GET", "/maps/12/annotations").respond(categoryRes);
    })
  );

  describe("getCategories", function() {});
});
