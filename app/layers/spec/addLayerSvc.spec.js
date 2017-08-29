describe("addLayerSvc", function() {
  var testIndex, addLayerSvc;

  beforeEach(module("composer"));
  beforeEach(
    inject(function(_addLayerSvc_) {
      addLayerSvc = _addLayerSvc_;
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

  describe("compileLayerNamesFromSearchIndex", function() {
    it("should return an array of names with the same length as the index passed in", function() {
      var test = addLayerSvc.compileLayerNamesFromSearchIndex(testIndex);
      expect(test.length).toBe(3);
    });

    it("should use the typename as the title if no title is available", function() {
      var names = addLayerSvc.compileLayerNamesFromSearchIndex(testIndex);
      var testName1 = names.indexOf("test3_typename") > -1;
      var testName2 = names.indexOf("test2_title") > -1;
      expect(testName1).toBe(true);
      expect(testName2).toBe(true);
    });
  });
});
