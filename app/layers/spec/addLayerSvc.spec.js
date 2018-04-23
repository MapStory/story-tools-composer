describe("layerSvc", () => {
  let testIndex;
  let layerSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(_layerSvc_ => {
      layerSvc = _layerSvc_;
      testIndex = [
        {
          title: "test1_title",
          typename: "test1_typename"
        },
        {
          title: "test2_title",
          typename: "test2_typename"
        },
        {
          title: "",
          typename: "test3_typename"
        }
      ];
    })
  );

  describe("compileLayerNamesFromSearchIndex", () => {
    it("should return an array of names with the same length as the index passed in", () => {
      const test = layerSvc.compileLayerNamesFromSearchIndex(testIndex);
      expect(test.length).toBe(3);
    });

    it("should use the typename as the title if no title is available", () => {
      const names = layerSvc.compileLayerNamesFromSearchIndex(testIndex);
      const testName1 = names.indexOf("test3_typename") > -1;
      const testName2 = names.indexOf("test2_title") > -1;
      expect(testName1).toBe(true);
      expect(testName2).toBe(true);
    });
  });
});
