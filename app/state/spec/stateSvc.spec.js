describe("stateSvc", () => {
  let location;
  let stateSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(($location, _stateSvc_) => {
      stateSvc = _stateSvc_;
      location = $location;
    })
  );

  describe("getConfig", () => {
    it("should return a configuration object with a `chapters` attribute", () => {
      expect(stateSvc.getConfig().chapters[0]).toBeDefined();
    });
  });

  describe("getChapter", () => {
    it("should return the number of the current chapter (value: 1)", () => {
      expect(stateSvc.getChapter()).toBe(1);
    });

    it("should return the number of the current chapter (value: 2)", () => {
      spyOn(location, "path").and.returnValue("/chapter/2");
      expect(stateSvc.getChapter()).toBe(2);
    });
  });

  describe("getChapterIndex", () => {
    it("should return the number of the current chapter (value: 0)", () => {
      expect(stateSvc.getChapterIndex()).toBe(0);
    });

    it("should return the number of the current chapter (value: 1)", () => {
      spyOn(location, "path").and.returnValue("/chapter/2");
      expect(stateSvc.getChapterIndex()).toBe(1);
    });
  });

  describe("getChapterConfigs", () => {
    it("should return all chapter configs in an array", () => {
      stateSvc.addNewChapter();
      expect(stateSvc.getChapterConfigs().length).toBe(2);
    });
  });

  describe("getChapterCount", () => {
    it("should return the number of chapters (value: 2)", () => {
      expect(stateSvc.getChapterCount()).toBe(1);
    });
  });

  describe("getChapterConfig", () => {
    it("should return the config of the first chapter", () => {
      expect(stateSvc.getChapterConfig()).toBeDefined();
    });
  });

  describe("getChapterAbout", () => {
    it("should return a valid `about` object for the current chapter", () => {
      const testConfig = { chapters: [{ about: { title: "pass" } }] };
      stateSvc.setConfig(testConfig);
      expect(stateSvc.getChapterAbout().title).toBe("pass");
    });
    it("should return a valid `about` object when no chapters exist", () => {
      const testConfig = { about: { title: "pass" } };
      stateSvc.setConfig(testConfig);
      expect(stateSvc.getChapterAbout().title).toBe("pass");
    });
  });

  describe("reorderLayer", () => {
    it("should move the specified layer from the `from` index in the layer array to the `to` index", () => {
      const testConfig = {
        chapters: [
          {
            layers: [
              {
                uuid: "LAYER_1"
              },
              {
                uuid: "LAYER_2"
              }
            ]
          }
        ]
      };
      stateSvc.setConfig(testConfig);
      stateSvc.reorderLayer(0, 1);
      expect(stateSvc.getChapterConfig().layers[1].uuid).toBe("LAYER_1");
    });
  });

  describe("setConfig", () => {
    it("should overwrite the existing config", () => {
      const testConfig = { test: "pass" };
      stateSvc.setConfig(testConfig);
      expect(stateSvc.getConfig()).toBe(testConfig);
    });
  });

  describe("updateCurrentChapterConfig", () => {
    it("should update stateSvc.currentChapter with the current chapter config", () => {
      const testConfig = { chapters: [{}, { test: "pass" }, {}] };
      stateSvc.setConfig(testConfig);
      expect(stateSvc.currentChapter).toBeNull();
      spyOn(location, "path").and.returnValue("/chapter/2");
      stateSvc.updateCurrentChapterConfig();
      expect(stateSvc.currentChapter.test).toBe("pass");
    });
  });
});
