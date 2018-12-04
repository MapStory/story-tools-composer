describe("navigationSvc", () => {
  let config;
  let navigationSvc;
  let location;
  let stateSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(($location, _navigationSvc_, _stateSvc_, _appConfig_) => {
      config = _appConfig_;
      navigationSvc = _navigationSvc_;
      stateSvc = _stateSvc_;
      location = $location;
    })
  );
  beforeEach(() => {
    window.PubSub.clearAllSubscriptions();
    stateSvc.setConfig({ chapters: [] });
  });

  describe("nextChapter", () => {
    beforeEach(
      inject(($controller, $compile) => {
        spyOn(navigationSvc.location, "path");
      })
    );

    it("should update the location path to the next chapter if it exists", () => {
      stateSvc.setConfig({ chapters: [{}, {}] });
      navigationSvc.nextChapter();
      expect(navigationSvc.location.path).toHaveBeenCalledWith(
        config.routes.chapter + 2
      );
    });

    it("broadcast a chapter change when next chapter is selected", done => {
      window.PubSub.subscribe("changingChapter", (msg, data) => {
        expect(data.currentChapterIndex).toBe(0);
        expect(data.nextChapterIndex).toBe(1);
        window.PubSub.clearAllSubscriptions();
        done();
      });
      stateSvc.setConfig({ chapters: [{}, {}] });
      navigationSvc.nextChapter();
    });

    it("should update the location path to the first chapter if there is no next chapter ", () => {
      stateSvc.setConfig({ chapters: [{}] });
      navigationSvc.nextChapter();
      expect(navigationSvc.location.path).toHaveBeenCalledWith("");
    });
  });

  describe("previous chapter", () => {
    beforeEach(inject($compile => {}));

    it("should update the location path to the previous chapter if it exists", () => {
      stateSvc.setConfig({ chapters: [{}, {}, {}] });
      spyOn(navigationSvc.location, "path").and.returnValue("/chapter/3");
      navigationSvc.previousChapter();
      expect(navigationSvc.location.path).toHaveBeenCalledWith(
        config.routes.chapter + 2
      );
    });

    it("broadcast a chapter change when previous chapter is selected", done => {
      stateSvc.setConfig({ chapters: [{}, {}, {}] });
      spyOn(navigationSvc.location, "path").and.returnValue("/chapter/3");
      window.PubSub.subscribe("changingChapter", (msg, data) => {
        expect(data.currentChapterIndex).toBe(2);
        expect(data.nextChapterIndex).toBe(1);
        window.PubSub.clearAllSubscriptions();
        done();
      });
      navigationSvc.previousChapter();
    });

    it("should update the location path to the first chapter if there is no previous chapter", done => {
      stateSvc.setConfig({ chapters: [{}] });
      spyOn(navigationSvc.location, "path");
      navigationSvc.previousChapter();
      setTimeout(() => {
        expect(navigationSvc.location.path).toHaveBeenCalledWith("/chapter/1");
        done();
      }, 300);
    });

    it("broadcast a chapter change to the first chapter if there is no previous chapter", done => {
      stateSvc.setConfig({ chapters: [{}] });
      window.PubSub.subscribe("changingChapter", (msg, data) => {
        expect(data.currentChapterIndex).toBe(0);
        expect(data.nextChapterIndex).toBe(0);
        window.PubSub.clearAllSubscriptions();
        done();
      });
      navigationSvc.previousChapter();
    });
  });
  describe("go to chapter", () => {
    beforeEach(inject($compile => {}));

    it("should update the location path to the new chapter if it exists", () => {
      stateSvc.setConfig({ chapters: [{}, {}, {}] });
      spyOn(navigationSvc.location, "path").and.returnValue("/chapter/3");
      navigationSvc.goToChapter(2);
      expect(navigationSvc.location.path).toHaveBeenCalledWith(
        config.routes.chapter + 2
      );
    });

    it("should broadcast the new chapter if it exists", done => {
      stateSvc.setConfig({ chapters: [{}, {}, {}] });
      spyOn(location, "path").and.returnValue("/chapter/3");
      window.PubSub.subscribe("changingChapter", (msg, data) => {
        expect(data.currentChapterIndex).toBe(2);
        expect(data.nextChapterIndex).toBe(1);
        window.PubSub.clearAllSubscriptions();
        done();
      });
      navigationSvc.goToChapter(2);
    });
  });
});
