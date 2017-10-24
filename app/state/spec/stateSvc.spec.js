describe("stateSvc", function() {
  var rootScope, location, stateSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(function($rootScope, $location, _stateSvc_) {
      stateSvc = _stateSvc_;
      rootScope = $rootScope;
      location = $location;
    })
  );

  describe("getConfig", function() {
    it("should return a configuration object with a `chapters` attribute", function() {
      expect(stateSvc.getConfig().chapters[0].about.title).toBe("New Chapter");
    });
  });

  describe("saveLayer", function() {
    it("should add the layer config provided to the current chapter config's layer array", function() {
      spyOn(location, "path").and.returnValue("/chapter/1");
      var layerConfig = {
        name: "testLayer",
        settings: {
          asVector: true,
          allowZoom: true,
          allowPan: true
        },
        server: {
          name: "mapstory",
          path: "/geoserver/",
          absolutePath: "", //'https://mapstory.org/geoserver/',
          host: "", //'https://mapstory.org/',
          canStyleWMS: false,
          timeEndpoint: function(name) {
            return "/maps/time_info.json?layer=" + name;
          }
        }
      };
      var testConfig = {
        chapters: [{ layers: [] }]
      };

      stateSvc.setConfig(testConfig);
      stateSvc.saveLayer(layerConfig);
      expect(stateSvc.getChapterConfig().layers.length).toBe(1);
      expect(stateSvc.getChapterConfig().layers[0].name).toBe("testLayer");
    });
  });

  describe("getChapter", function() {
    it("should return the number of the current chapter (value: 1)", function() {
      expect(stateSvc.getChapter()).toBe(1);
    });

    it("should return the number of the current chapter (value: 2)", function() {
      spyOn(location, "path").and.returnValue("/chapter/2");
      expect(stateSvc.getChapter()).toBe(2);
    });
  });

  describe("getChapterIndex", function() {
    it("should return the number of the current chapter (value: 0)", function() {
      expect(stateSvc.getChapterIndex()).toBe(0);
    });

    it("should return the number of the current chapter (value: 1)", function() {
      spyOn(location, "path").and.returnValue("/chapter/2");
      expect(stateSvc.getChapterIndex()).toBe(1);
    });
  });

  describe("getChapterConfigs", function() {
    it("should return all chapter configs in an array", function() {
      stateSvc.addNewChapter();
      expect(stateSvc.getChapterConfigs().length).toBe(2);
    });
  });

  describe("getChapterCount", function() {
    it("should return the number of chapters (value: 2)", function() {
      expect(stateSvc.getChapterCount()).toBe(1);
    });
  });

  describe("getChapterConfig", function() {
    it("should return the config of the first chapter", function() {
      expect(stateSvc.getChapterConfig().about.title).toBeDefined();
    });
    it("should return the config of the second chapter", function() {
      spyOn(location, "path").and.returnValue("/chapter/2");
      expect(stateSvc.getChapterConfig().about.title).toBe("");
    });
  });

  describe("getChapterAbout", function() {
    it("should return a valid `about` object for the current chapter", function() {
      var testConfig = { chapters: [{ about: { title: "pass" } }] };
      stateSvc.setConfig(testConfig);
      expect(stateSvc.getChapterAbout().title).toBe("pass");
    });
    it("should return a valid `about` object when no chapters exist", function() {
      var testConfig = { about: { title: "pass" } };
      stateSvc.setConfig(testConfig);
      expect(stateSvc.getChapterAbout().title).toBe("pass");
    });
  });

  describe("setConfig", function() {
    it("should overwrite the existing config", function() {
      var testConfig = { test: "pass" };
      stateSvc.setConfig(testConfig);
      expect(stateSvc.getConfig()).toBe(testConfig);
    });
  });

  describe("updateCurrentChapterConfig", function() {
    it("should update stateSvc.currentChapter with the current chapter config", function() {
      var testConfig = { chapters: [{}, { test: "pass" }, {}] };
      stateSvc.setConfig(testConfig);
      expect(stateSvc.currentChapter).toBeNull();
      spyOn(location, "path").and.returnValue("/chapter/2");
      stateSvc.updateCurrentChapterConfig();
      expect(stateSvc.currentChapter.test).toBe("pass");
    });
  });
});
