// TODO: Remove this when done.
const csvData = `title,content,media,start_time,end_time,latitude,longitude,in_map,in_timeline,pause_playback,auto_show
Test Pin 1,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 2,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 3,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 4,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 5,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE
Test Pin 6,Example Content about pin,http://#,7/1/91,3/20/92,35.78,28.98,TRUE,TRUE,FALSE,FALSE`;

describe("pinSvc", () => {
  let httpBackend,
    pinSvc,
    stateSvc,
    pin,
    serverFeatures,
    validProperties;

  beforeEach(module("composer"));
  beforeEach(
    inject(($httpBackend, _pinSvc_, _stateSvc_) => {
      pinSvc = _pinSvc_;
      stateSvc = _stateSvc_;
      httpBackend = $httpBackend;

      pin = new pinSvc.Pin({
        geometry: {
          coordinates: [0, 0]
        }
      });

      validProperties = {
        title: "test",
        startTime: "10/1/2017",
        endTime: "10/20/2017",
        geometry: {
          coordinates: [0, 0]
        }
      };

      serverFeatures = {
        features: [
          {
            geometry: '{"coordinates": [29,30]}',
            id: 1,
            properties: {
              startTime: 5,
              endTime: 5,
              id: 5
            }
          },
          {
            geometry: '{"coordinates": [29,30]}',
            id: 2,
            properties: {
              startTime: 6,
              endTime: 6,
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

  describe("validatePinProperty", () => {
    it("", () => {});
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
        endTime: 1
      };
      const test = pinSvc.validateAllPinProperties(incompleteProps);
      expect(test[0]).toBe("startTime");
    });
  });

  describe("addPin", () => {
    it("should create a valid pin", () => {
      const test = pinSvc.mAddPin(validProperties, 0);
      expect(test).not.toBe(null);
    });

    it("should push the pin to the correct svc.pin array", () => {
      pinSvc.mAddPin(validProperties, 0);
      expect(pinSvc.getCurrentPins()[0].get("title")).toBe("test");
    });
  });

  describe("StoryPin Exporter", () => {
    xit("exports to CSV", () => {
      pinSvc.createPinsWithCSV(csvData);
      const pins = pinSvc.pins[stateSvc.getChapterIndex()];
      expect(pins.length).toBe(6);
      const results = pinSvc.exportPinsToCSV(pins);

      // CSV should have same 6 pins
      pinSvc.createPinsWithCSV(results);
      expect(pins.length).toBe(12);
    });
    xit("exports to JSON", () => {});
  });

  describe("StoryPin Overlay", () => {
    xit("has an overlay for each StoryPin in the DOM", () => {});
  });
});
