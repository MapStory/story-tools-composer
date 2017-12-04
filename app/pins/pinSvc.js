function pinSvc(
  $rootScope,
  $http,
  $translate,
  $http,
  $q,
  timeSvc,
  featureManagerSvc,
  stateSvc
) {
  var svc = {};
  svc.pins = [[]];

  svc.Pin = function(data) {
    var copyData = angular.copy(data);
    delete data.geometry;
    ol.Feature.call(this, data);
    this.properties = data;
    this.setGeometry(new ol.geom.Point(copyData.geometry.coordinates));
    this.start_time = timeSvc.getTime(this.start_time);
    this.end_time = timeSvc.getTime(this.end_time);
  };
  svc.Pin.prototype = Object.create(ol.Feature.prototype);
  svc.Pin.prototype.constructor = svc.Pin;

  var embed_width = '"180"';
  var embed_height = '"180"';
  var model_attributes = [
    "title",
    "id",
    "_id",
    "content",
    "media",
    "start_time",
    "end_time",
    "in_map",
    "in_timeline",
    "pause_playback",
    "auto_show"
  ];
  var filterPropertiesFromValidation = [
    "id",
    "_id",
    "content",
    "media",
    "in_map",
    "in_timeline",
    "pause_playback",
    "auto_show"
  ];

  svc.addChapter = function() {
    svc.pins.push([]);
  };

  svc.createStoryPinLayer = function() {
    return featureManagerSvc.createVectorLayer(
      featureManagerSvc.storyPinLayerMetadata
    );
  };

  svc.pinLayer = svc.createStoryPinLayer();

  svc.addEmptyPinToCurrentChapter = function() {
    svc.pins[stateSvc.getChapter() - 1].push({});
    $rootScope.$broadcast("pin-added", stateSvc.getChapter() - 1);
  };

  svc.removeChapter = function(chapter_index) {
    svc.pins.splice(chapter_index, 1);
  };

  svc.getFeaturesFromServer = function(config) {
    var defer = $q.defer();
    $http({
      url: "/maps/" + config.id + "/annotations",
      method: "GET"
    }).then(function(result) {
      defer.resolve(result.data);
    });
    return defer.promise;
  };

  svc.addPinsFromGeojsonObj = function(geojson, chapter) {
    geojson.features.map(function(feature) {
      svc.addPinFromGeojsonObj(feature, chapter);
    });
  };

  svc.addPinFromGeojsonObj = function(feature, chapter) {
    var props = feature.properties;
    props.geometry = $.parseJSON(feature.geometry);
    props.geometry.coordinates = ol.proj.transform(
      props.geometry.coordinates,
      "EPSG:4326",
      "EPSG:3857"
    );
    props.id = feature.id;
    props.start_time = props.start_time * 1000;
    props.end_time = props.end_time * 1000;
    var storyPin = new svc.Pin(props);
    storyPin.setId(feature.id);
    svc.pins[chapter].push(storyPin);
  };

  svc.addGetterAndSetterToPinPrototype = function(prop) {
    Object.defineProperty(svc.Pin.prototype, prop, {
      get: function() {
        var val = this.get(prop);
        return typeof val === "undefined" ? null : val;
      },
      set: function(val) {
        this.set(prop, val);
      }
    });
  };

  svc.addMultipleGettersAndSettersToPinPrototype = function(props) {
    props.forEach(function(prop) {
      svc.addGetterAndSetterToPinPrototype(prop);
    });
  };

  svc.getPins = function(chapter_index) {
    return svc.pins[chapter_index] || [];
  };

  svc.reorderPins = function(from_index, to_index) {
    svc.pins.splice(to_index, 0, svc.pins.splice(from_index, 1)[0]);
  };

  svc.removePin = function(storyPin, chapter_index) {
    for (var i = 0; i < svc.pins[chapter_index].length; i++) {
      if (storyPin.id_ == svc.pins[chapter_index][i].id_) {
        var splice_index = i;
        if (splice_index === 0) {
          svc.pins[chapter_index].splice(0, 1);
        } else {
          svc.pins[chapter_index].splice(splice_index, 1);
        }
        $rootScope.$broadcast("pin-removed", chapter_index);
        return storyPin.id;
      }
    }
  };

  svc.removePinByIndex = function(pin_index, chapter_index) {
    svc.pins[chapter_index].splice(pin_index, 1);
    $rootScope.$broadcast("pin-removed", chapter_index);
  };

  svc.validatePinProperty = function(pinInstantiationObj, propertyName) {
    return (
      pinInstantiationObj.hasOwnProperty(propertyName) &&
      (goog.isDefAndNotNull(pinInstantiationObj[propertyName]) &&
        !goog.string.isEmptySafe(pinInstantiationObj[propertyName]))
    );
  };

  svc.validateAllPinProperties = function(pinInstantiationObj) {
    var missingProperties = [];
    var copy_attribs = angular.copy(model_attributes);
    copy_attribs.push("geometry");
    for (var iProp = 0; iProp < copy_attribs.length; iProp += 1) {
      var property = copy_attribs[iProp];
      if (
        !svc.validatePinProperty(pinInstantiationObj, property) &&
        !goog.array.contains(filterPropertiesFromValidation, property)
      ) {
        missingProperties.push(property);
      }
    }
    if (missingProperties.length > 0) {
      return missingProperties;
    }
    return true;
  };

  svc.handleInvalidPin = function(invalidProperties) {
    $translate(invalidProperties).then(function(translations) {
      var invalid_string =
        "These properties must be set before saving a StoryPin: ";
      for (var iProp = 0; iProp < invalidProperties.length; iProp += 1) {
        var property = invalidProperties[iProp];
        var translatedProp = translations[property];
        translatedProp = translatedProp.concat(", ");
        invalid_string = invalid_string.concat(translatedProp);
      }
      toastr.error(invalid_string, "Cannot save StoryPin");
    });
  };

  svc.addPin = function(props, chapter_index) {
    var pinValidated = svc.validateAllPinProperties(props);
    if (pinValidated !== true) {
      svc.handleInvalidPin(pinValidated);
      return false;
    }
    if (timeSvc.getTime(props.start_time) > timeSvc.getTime(props.end_time)) {
      console.log("Start Time must be before End Time", "Invalid Time");
      toastr.error("Start Time must be before End Time", "Invalid Time");
      return false;
    }
    //TODO: Check media whitelist and sanitize embed size.
    if (goog.isDefAndNotNull(props.media) && !this.isUrl(props.media)) {
      props.media = props.media.replace(/width="\d+"/i, "width=" + embed_width);
      props.media = props.media.replace(
        /height="\d+"/i,
        "height=" + embed_height
      );
    }
    var storyPin = new svc.Pin(props);
    svc.pins[chapter_index].push(storyPin);
    $rootScope.$broadcast("pin-added", chapter_index);
    return true;
  };

  // @TODO: write test for this after mapService functions are ported over
  svc.updatePin = function(pin, chapter_index) {
    //Only set new geometry if location was saved on pin object
    if (goog.isDefAndNotNull(pin.geometry)) {
      // mapService_.removeDraw();
      // mapService_.removeSelect();
      // mapService_.removeModify();
      // mapService_.map.removeLayer(mapService_.editLayer);
      var newGeom = new ol.geom.Point(pin.geometry.coordinates);
      pin.setGeometry(newGeom);
    }
    for (var iPin = 0; iPin < svc.pins.length; iPin += 1) {
      if (pin.id === svc.pins[iPin].id) {
        svc.pins[iPin] = pin;
      }
    }
    rootScope_.$broadcast("pin-added", chapter_index);
  };

  //@TODO: move to another service
  svc.isUrl = function(str) {
    if (!/^(f|ht)tps?:\/\//i.test(str)) {
      return false;
    }
    return true;
  };

  svc.defaultPinValues = function(pin) {
    Object.keys(pin).forEach(function(key, index) {
      if (pin[key] === "") {
        if (
          key === "in_timeline" ||
          key === "auto_show" ||
          key === "pause_playback"
        ) {
          pin[key] = false;
        } else if (key === "in_map") {
          pin[key] = true;
        } else {
          pin[key] = null;
        }
      } else if (typeof pin[key] === "string") {
        if (pin[key].toUpperCase() === "TRUE") {
          pin[key] = true;
        } else if (pin[key].toUpperCase() === "FALSE") {
          pin[key] = false;
        }
      }
    });
    return pin;
  };

  svc.bulkPinAdd = function(pinConfigs, chapter_index) {
    var failedToAdd = 0;
    for (var iPin = 0; iPin < pinConfigs.length; iPin += 1) {
      var pin = pinConfigs[iPin];
      pin = svc.defaultPinValues(pin);

      pin.id = new Date().getUTCMilliseconds();
      pin.geometry = {
        coordinates: ol.proj.transform(
          [Number(pin["longitude"]), Number(pin["latitude"])],
          "EPSG:4326",
          "EPSG:3857"
        )
      };
      delete pin["longitude"];
      delete pin["latitude"];
      if (
        svc.validateAllPinProperties(pin) !== true ||
        timeSvc.getTime(pin.start_time) > timeSvc.getTime(pin.end_time)
      ) {
        failedToAdd += 1;
        continue;
      }

      if (goog.isDefAndNotNull(pin.media) && !svc.isUrl(pin.media)) {
        pin.media = pin.media.replace(/width="\d+"/i, "width=" + embed_width);
        pin.media = pin.media.replace(
          /height="\d+"/i,
          "height=" + embed_height
        );
      }

      var storyPin = new svc.Pin(pin);
      svc.pins[chapter_index].push(storyPin);
    }
    $rootScope.$broadcast("pin-added", chapter_index);
  };

  svc.addChaptersAndPins = function(config) {
    var defer = $q.defer();
    angular.forEach(config.chapters, function(chapterConfig, index) {
      if (!goog.isDefAndNotNull(svc.pins[index])) {
        svc.addChapter();
      }
      svc.getFeaturesAndConvertToPins(chapterConfig).then(function(complete) {
        defer.resolve(complete);
      });
    });
    return defer.promise;
  };

  svc.getFeaturesAndConvertToPins = function(chapterConfig) {
    var defer = $q.defer();
    svc.getFeaturesFromServer(chapterConfig).then(function(geojson) {
      addPinsFromGeojsonObj(geojson);
      defer.resolve(true);
    });
    return defer.promise;
  };

  svc.initPinSvc = function() {
    var defer = $q.defer();
    var config = stateSvc.getConfig();
    if (goog.isDefAndNotNull(config.chapters)) {
      svc.addChaptersAndPins(config).then(function(complete) {
        defer.resolve(complete);
      });
    }
    return defer.promise;
  };

  svc.addMultipleGettersAndSettersToPinPrototype(model_attributes);

  return svc;
}

module.exports = pinSvc;
