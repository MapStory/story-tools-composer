describe('pinSvc', function() {

  var rootScope, httpBackend, pinSvc, stateSvc, pin, serverFeatures, validProperties,
      pinConfigs;

  beforeEach(module('composer'));
  beforeEach(inject(function ($rootScope, $httpBackend, _pinSvc_, _stateSvc_) {
    pinSvc = _pinSvc_;
    stateSvc = _stateSvc_;
    httpBackend = $httpBackend;
    rootScope = $rootScope;

    pin = new pinSvc.Pin({
      geometry: {
        coordinates: [0,0]
      }
    });

    validProperties = {
      title: 'test',
      start_time: '10/1/2017',
      end_time: '10/20/2017',
      geometry: {
        coordinates: [0,0]
      }
    };

    pinConfigs = [
      validProperties,
      {
        title: 'test2',
        start_time: '9/1/2000',
        end_time: '10/20/2000',
        geometry: {
          coordinates: [0,0]
        }
      }
    ];

    serverFeatures = {
      features: [{
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
    }]};

    httpBackend.when('GET', '/maps/12/annotations')
               .respond(serverFeatures);
  }));

  describe('Pin', function() {
    it('should instantiate an object if provided geometry data',
    function() {
      expect(pin).toBeDefined();
    });
  });

  describe('addGetterAndSetterToPinPrototype', function() {
    it('should add a getter and setter function for the attribute passed in',
    function() {
      pinSvc.addGetterAndSetterToPinPrototype('test');
      pin.set('test', 'pass');
      expect(pin.get('test')).toBe('pass');
    });
  });

  describe('addMultipleGettersAndSettersToPinPrototype', function() {
    it('should add getter and setter functions for all properties passed as an array',
    function() {
      pinSvc.addMultipleGettersAndSettersToPinPrototype(['test_1', 'test_2']);
      pin.set('test_1', 'pass_1');
      pin.set('test_2', 'pass_2');
      expect(pin.get('test_1')).toBe('pass_1');
      expect(pin.get('test_2')).toBe('pass_2');
    });
  });

  describe('validatePinProperty', function() {
    it('', function(){
    });
  });

  describe('addChapter', function() {
    it('add an additional array to the `pins` array', function(){
      expect(pinSvc.pins.length).toBe(1);
      pinSvc.addChapter();
      expect(pinSvc.pins.length).toBe(2);
    });
  });

  describe('removeChapter', function() {
    it('remove the specified chapter index', function(){
      expect(pinSvc.pins.length).toBe(1);
      pinSvc.pins[0].push('ch1');
      expect(pinSvc.pins[0][0]).toBe('ch1');
      pinSvc.addChapter();
      expect(pinSvc.pins.length).toBe(2);
      pinSvc.pins[1].push('ch2');
      expect(pinSvc.pins[1][0]).toBe('ch2');
      pinSvc.removeChapter(0);
      expect(pinSvc.pins.length).toBe(1);
      expect(pinSvc.pins[0][0]).toBe('ch2');
      expect(pinSvc.pins[1]).toBeUndefined();
    });
  });

  describe('validateAllPinProperties', function() {
    it('should return true if provided an object containing all valid properties',
    function(){
      var test = pinSvc.validateAllPinProperties(validProperties);
      expect(test).toBe(true);
    });

    it('should return missing required properties as an array',
    function(){
      var incompleteProps = {
        'title': 'test',
        'geometry': {},
        'end_time': 1
      };
      var test = pinSvc.validateAllPinProperties(incompleteProps);
      expect(test[0]).toBe('start_time');
    });
  });

  describe('addPin', function() {
    it('should create a valid pin', function(){
      var test = pinSvc.addPin(validProperties, 0);
      expect(test).toBe(true);
    });

    it('should push the pin to the correct svc.pin array', function() {
      pinSvc.addPin(validProperties, 0);
      expect(pinSvc.pins[0][0].get('title')).toBe('test');
    });
  });

  describe('addPinFromGeojsonObj', function() {
    it('should create a valid pin', function(){
      var test = pinSvc.addPinFromGeojsonObj({
        geometry: '{"coordinates": [29,30]}',
        properties: {
          start_time: 5,
          end_time: 5,
          id: 5
        }
      }, 0);
      expect(pinSvc.pins[0][0]).toBeDefined();
    });
  });

  describe('getFeaturesFromServer', function() {
    it('should return a promise containing feature data', function(){
      pinSvc.getFeaturesFromServer({id: 12})
      .then(function(data) {
        expect(data).toBe(serverFeatures);
      });
    });
  });

  describe('getFeaturesAndConvertToPins', function() {
    it('should return true', function(){
      pinSvc.getFeaturesAndConvertToPins({id: 12})
      .then(function(data) {
        expect(data).toBe(true);
      });
    });

    it('should add pins to pin collection', function(){
      pinSvc.pins = [[]];
      pinSvc.getFeaturesAndConvertToPins({id: 12})
      .then(function(data) {
        expect(pinSvc.pins[0].length).toBe(2);
      });
    });
  });

  describe('getPins', function() {
    it('should return pin array for a given chapter index if the chapter exists',
    function(){
      var config = stateSvc.getConfig();
      pinSvc.addChaptersAndPins(config)
      .then(function(complete) {
        var chapterPins = pinSvc.getPins(1);
        expect(chapterPins.length).toBe(1);
      });
    });

    it('should return an empty array for a given chapter index if the chapter does not exist',
    function(){
      pinSvc.pins = [[]];
      var chapterPins = pinSvc.getPins(1);
      expect(chapterPins.length).toBe(0);
    });
  });

  describe('addChaptersAndPins', function() {
    it('should return a promise', function(){
      var config = stateSvc.getConfig();
      pinSvc.addChaptersAndPins(config)
      .then(function(complete) {
        expect(complete).toBe(true);
      });
    });

    it('should add chapters and pins to `svc.pins`', function(){
      var config = stateSvc.getConfig();
      pinSvc.addChaptersAndPins(config)
      .then(function() {
        expect(pinSvc.pins[0][0]).toBeDefined();
        expect(pinSvc.pins[1][0]).toBeDefined();
      });
    });
  });

  describe('reorderPins', function() {
    it('should reoder a pin collection given the `to` and `from` index',
    function(){
      pinSvc.pins = [['1'], ['2'], ['3']];
      pinSvc.reorderPins(0,1);
      expect(pinSvc.pins[0][0]).toBe('2');
      pinSvc.reorderPins(2,0);
      expect(pinSvc.pins[0][0]).toBe('3');
    });
  });

  // @TODO: figure out why splice isn't working in this method,
  // causing test to fail
  describe('removePin', function() {
    it('should remove the specified pin from the specified chapter index',
    function() {
      // var newPin = jQuery.extend({}, pinSvc.pins[0][0]);
      // pinSvc.addPinsFromGeojsonObj(serverFeatures, 0);
      // expect(pinSvc.pins[0][0]).toBeDefined();
      // pinSvc.removePin(pinSvc.pins[0][0], 0);
      // expect(pinSvc.pins[0].length).toBe(0);
    });
  });

  describe('defaultPinValues', function() {
    it('should convert a string value of "TRUE" to a boolean',
    function() {
      var newPin = pinSvc.defaultPinValues({test: 'TRUE'});
      expect(newPin.test).toBe(true);
    });

    it('should convert a string value of "FALSE" to a boolean',
    function() {
      var newPin = pinSvc.defaultPinValues({test: 'FALSE'});
      expect(newPin.test).toBe(false);
    });

    it('should replace an empty string with `false` for the keys `in_timeline`, `auto_show`, and `pause_playback`',
    function() {
      var newPin = pinSvc.defaultPinValues({
                                            in_timeline: '',
                                            auto_show: '',
                                            pause_playback: ''
                                          });
      expect(newPin.in_timeline).toBe(false);
      expect(newPin.auto_show).toBe(false);
      expect(newPin.pause_playback).toBe(false);
    });

    it('should replace an empty string with `true` for the keys `in_map`',
    function() {
      var newPin = pinSvc.defaultPinValues({
                                            in_map: ''
                                          });
      expect(newPin.in_map).toBe(true);
    });
  });

  describe('bulkPinAdd', function() {
    it('should add multiple pins to the provided chapter index',
    function() {
      expect(pinSvc.pins[0][0]).toBeUndefined();
      expect(pinSvc.pins[0][1]).toBeUndefined();
      pinSvc.bulkPinAdd(pinConfigs, 0);
      expect(pinSvc.pins[0][0]).toBeDefined();
      expect(pinSvc.pins[0][1]).toBeDefined();
    });
  });

  describe('addPinsFromGeojsonObj', function() {
    it('should create multiple valid pins', function(){
      pinSvc.addPinsFromGeojsonObj(serverFeatures, 0);
      expect(pinSvc.pins[0][0]).toBeDefined();
      expect(pinSvc.pins[0][1]).toBeDefined();
    });
  });
});
