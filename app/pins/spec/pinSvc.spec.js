// TODO: Remove this when done.
const csv_data = `title,content,media,start_time,end_time,latitude,longitude,in_map,in_timeline,pause_playback,auto_show
Test Pin 1,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 2,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 3,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 4,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 5,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 6,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE`;

describe("pinSvc", () => {
  let rootScope, httpBackend, pinSvc, stateSvc, pin, serverFeatures, validProperties, pinConfigs;

  beforeEach(module("composer"));
  beforeEach(
    inject(($rootScope, $httpBackend, _pinSvc_, _stateSvc_) => {
      pinSvc = _pinSvc_;
      stateSvc = _stateSvc_;
      httpBackend = $httpBackend;
      rootScope = $rootScope;

      pin = new pinSvc.Pin({
        geometry: {
          coordinates: [0, 0]
        }
      });

      validProperties = {
        title: "test",
        start_time: "10/1/2017",
        end_time: "10/20/2017",
        geometry: {
          coordinates: [0, 0]
        }
      };

      pinConfigs = [
        validProperties,
        {
          title: "test2",
          start_time: "9/1/2000",
          end_time: "10/20/2000",
          geometry: {
            coordinates: [0, 0]
          }
        }
      ];

      serverFeatures = {
        features: [
          {
            geometry: '{"coordinates": [29,30]}',
            id: 1,
            properties: {
              start_time: 5,
              end_time: 5,
              id: 5
            }
          },
          {
            geometry: '{"coordinates": [29,30]}',
            id: 2,
            properties: {
              start_time: 6,
              end_time: 6,
              id: 6
            }
          }
        ]
      };

      httpBackend.when("GET", "/maps/12/annotations").respond(serverFeatures);
    })
  );

  describe("Pin", () => {
    it("should instantiate an object if provided geometry data", () => {
      expect(pin).toBeDefined();
    });
  });

  describe("createStoryPinLayer", () => {
    it("should return a layer with metadata that has `StoryPinLayer` set to `true`", () => {
      const testLayer = pinSvc.createStoryPinLayer();
      expect(testLayer.get("metadata").StoryPinLayer).toBe(true);
    });
  });

  describe("addGetterAndSetterToPinPrototype", () => {
    it("should add a getter and setter function for the attribute passed in", () => {
      pinSvc.addGetterAndSetterToPinPrototype("test");
      pin.set("test", "pass");
      expect(pin.get("test")).toBe("pass");
    });
  });

  describe("addMultipleGettersAndSettersToPinPrototype", () => {
    it("should add getter and setter functions for all properties passed as an array", () => {
      pinSvc.addMultipleGettersAndSettersToPinPrototype(["test_1", "test_2"]);
      pin.set("test_1", "pass_1");
      pin.set("test_2", "pass_2");
      expect(pin.get("test_1")).toBe("pass_1");
      expect(pin.get("test_2")).toBe("pass_2");
    });
  });

  describe("validatePinProperty", () => {
    it("", () => {});
  });

  describe("addChapter", () => {
    it("add an additional array to the `pins` array", () => {
      expect(pinSvc.pins.length).toBe(1);
      pinSvc.addChapter();
      expect(pinSvc.pins.length).toBe(2);
    });
  });

  describe("removeChapter", () => {
    it("remove the specified chapter index", () => {
      expect(pinSvc.pins.length).toBe(1);
      pinSvc.pins[0].push("ch1");
      expect(pinSvc.pins[0][0]).toBe("ch1");
      pinSvc.addChapter();
      expect(pinSvc.pins.length).toBe(2);
      pinSvc.pins[1].push("ch2");
      expect(pinSvc.pins[1][0]).toBe("ch2");
      pinSvc.removeChapter(0);
      expect(pinSvc.pins.length).toBe(1);
      expect(pinSvc.pins[0][0]).toBe("ch2");
      expect(pinSvc.pins[1]).toBeUndefined();
    });
  });

  describe("validateAllPinProperties", () => {
    it("should return true if provided an object containing all valid properties", () => {
      const test = pinSvc.validateAllPinProperties(validProperties);
      expect(test).toBe(true);
    });

    it("should return missing required properties as an array", () => {
      const incompleteProps = {
        title: "test",
        geometry: {},
        end_time: 1
      };
      const test = pinSvc.validateAllPinProperties(incompleteProps);
      expect(test[0]).toBe("start_time");
    });
  });

  describe("addPin", () => {
    it("should create a valid pin", () => {
      const test = pinSvc.addPin(validProperties, 0);
      expect(test).not.toBe(null);
    });

    it("should push the pin to the correct svc.pin array", () => {
      pinSvc.addPin(validProperties, 0);
      expect(pinSvc.pins[0][0].get("title")).toBe("test");
    });
  });

  describe("addPinFromGeojsonObj", () => {
    it("should create a valid pin", () => {
      const test = pinSvc.addPinFromGeojsonObj(
        {
          geometry: '{"coordinates": [29,30]}',
          properties: {
            start_time: 5,
            end_time: 5,
            id: 5
          }
        },
        0
      );
      expect(pinSvc.pins[0][0]).toBeDefined();
    });
  });

  describe("getFeaturesFromServer", () => {
    it("should return a promise containing feature data", () => {
      pinSvc.getFeaturesFromServer({ id: 12 }).then(data => {
        expect(data).toBe(serverFeatures);
      });
    });
  });

  describe("getFeaturesAndConvertToPins", () => {
    it("should return true", () => {
      pinSvc.getFeaturesAndConvertToPins({ id: 12 }).then(data => {
        expect(data).toBe(true);
      });
    });

    it("should add pins to pin collection", () => {
      pinSvc.pins = [[]];
      pinSvc.getFeaturesAndConvertToPins({ id: 12 }).then(data => {
        expect(pinSvc.pins[0].length).toBe(2);
      });
    });
  });

  describe("getPins", () => {
    it("should return pin array for a given chapter index if the chapter exists", () => {
      const config = stateSvc.getConfig();
      pinSvc.addChaptersAndPins(config).then(complete => {
        const chapterPins = pinSvc.getPins(1);
        expect(chapterPins.length).toBe(1);
      });
    });

    it("should return an empty array for a given chapter index if the chapter does not exist", () => {
      pinSvc.pins = [[]];
      const chapterPins = pinSvc.getPins(1);
      expect(chapterPins.length).toBe(0);
    });
  });

  describe("addChaptersAndPins", () => {
    it("should return a promise", () => {
      const config = stateSvc.getConfig();
      pinSvc.addChaptersAndPins(config).then(complete => {
        expect(complete).toBe(true);
      });
    });

    it("should add chapters and pins to `svc.pins`", () => {
      const config = stateSvc.getConfig();
      pinSvc.addChaptersAndPins(config).then(() => {
        expect(pinSvc.pins[0][0]).toBeDefined();
        expect(pinSvc.pins[1][0]).toBeDefined();
      });
    });
  });

  describe("reorderPins", () => {
    it("should reoder a pin collection given the `to` and `from` index", () => {
      pinSvc.pins = [["1"], ["2"], ["3"]];
      pinSvc.reorderPins(0, 1);
      expect(pinSvc.pins[0][0]).toBe("2");
      pinSvc.reorderPins(2, 0);
      expect(pinSvc.pins[0][0]).toBe("3");
    });
  });

  // @TODO: figure out why splice isn't working in this method,
  // causing test to fail
  describe("removePin", () => {
    it("should remove the specified pin from the specified chapter index", () => {
      pinSvc.addPinsFromGeojsonObj(serverFeatures, 0);
      const newPin = jQuery.extend(true, {}, pinSvc.pins[0][1]);
      console.log("NEW PIN ---- > ", newPin);
      expect(pinSvc.pins[0].length).toBe(2);
      pinSvc.removePin(pinSvc.pins[0][0], 0);
      expect(pinSvc.pins[0][0].id).toBe(newPin.id_);
    });
  });

  describe("removePinByIndex", () => {
    it("should remove the specified pin by index from the specified chapter index", () => {
      pinSvc.addPinsFromGeojsonObj(serverFeatures, 0);
      expect(pinSvc.pins[0].length).toBe(2);
      pinSvc.removePinByIndex(0, 0);
      expect(pinSvc.pins[0].length).toBe(1);
    });
  });

  describe("defaultPinValues", () => {
    it('should convert a string value of "TRUE" to a boolean', () => {
      const newPin = pinSvc.defaultPinValues({ test: "TRUE" });
      expect(newPin.test).toBe(true);
    });

    it('should convert a string value of "FALSE" to a boolean', () => {
      const newPin = pinSvc.defaultPinValues({ test: "FALSE" });
      expect(newPin.test).toBe(false);
    });

    it("should replace an empty string with `false` for the keys `in_timeline`, `auto_show`, and `pause_playback`", () => {
      const newPin = pinSvc.defaultPinValues({
        in_timeline: "",
        auto_show: "",
        pause_playback: ""
      });
      expect(newPin.in_timeline).toBe(false);
      expect(newPin.auto_show).toBe(false);
      expect(newPin.pause_playback).toBe(false);
    });

    it("should replace an empty string with `true` for the keys `in_map`", () => {
      const newPin = pinSvc.defaultPinValues({
        in_map: ""
      });
      expect(newPin.in_map).toBe(true);
    });
  });

  describe("bulkPinAdd", () => {
    it("should add multiple pins to the provided chapter index", () => {
      expect(pinSvc.pins[0][0]).toBeUndefined();
      expect(pinSvc.pins[0][1]).toBeUndefined();
      pinSvc.bulkPinAdd(pinConfigs, 0);
      expect(pinSvc.pins[0][0]).toBeDefined();
      expect(pinSvc.pins[0][1]).toBeDefined();
    });

    xit("should create multiple pins when provided some csv data that is correct", () => {
      // TODO: WIP
      const init_count = pinSvc.pins[stateSvc.getChapterIndex()].length;
      pinSvc.createPinsWithCSV(csv_data);
      const fin_count = pinSvc.pins[stateSvc.getChapterIndex()].length;
      expect(fin_count).toBe(6);
    });
  });

  describe("addEmptyPinToCurrentChapter", () => {
    it("should add an empty object to the current chapter's pin array", () => {});
  });

  describe("addPinsFromGeojsonObj", () => {
    it("should create multiple valid pins", () => {
      pinSvc.addPinsFromGeojsonObj(serverFeatures, 0);
      expect(pinSvc.pins[0][0]).toBeDefined();
      expect(pinSvc.pins[0][1]).toBeDefined();
    });
  });

  describe("StoryPin Exporter", () => {
    xit("exports to CSV", () => {
      pinSvc.createPinsWithCSV(csv_data);
      const pins = pinSvc.pins[stateSvc.getChapterIndex()];
      expect(pins.length).toBe(6);
      const results = pinSvc.exportPinsToCSV(pins);

      // CSV should have same 6 pins
      pinSvc.createPinsWithCSV(results);
      expect(pins.length).toBe(12);
    });
    xit("exports to JSON", () => {

    });
  });

  describe("StoryPin Overlay", () => {
    xit("has an overlay for each StoryPin in the DOM", () => {

    });
  });
});
