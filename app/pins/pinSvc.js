function pinSvc(
  $rootScope,
  $http,
  $translate,
  $q,
  timeSvc,
  featureManagerSvc,
  stateSvc,
  MapManager
) {
  const svc = {};
  svc.pins = [[]];
  svc.currentPin = null;

  svc.Pin = function(data) {
    const copyData = angular.copy(data);
    delete data.geometry;
    ol.Feature.call(this, data);
    this.properties = data;
    this.setGeometry(new ol.geom.Point(copyData.geometry.coordinates));
    this.start_time = timeSvc.getTime(this.start_time);
    this.end_time = timeSvc.getTime(this.end_time);
  };
  svc.Pin.prototype = Object.create(ol.Feature.prototype);
  svc.Pin.prototype.constructor = svc.Pin;

  const embed_width = '"180"';
  const embed_height = '"180"';
  const model_attributes = [
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
  const filterPropertiesFromValidation = [
    "id",
    "_id",
    "content",
    "media",
    "in_map",
    "in_timeline",
    "pause_playback",
    "auto_show"
  ];

  svc.addChapter = () => {
    svc.pins.push([]);
  };

  svc.createStoryPinLayer = () =>
    featureManagerSvc.createVectorLayer(
      featureManagerSvc.storyPinLayerMetadata
    );

  svc.pinLayer = svc.createStoryPinLayer();

  svc.addEmptyPinToCurrentChapter = () => {
    svc.pins[stateSvc.getChapter() - 1].push({});
    $rootScope.$broadcast("pin-added", stateSvc.getChapter() - 1);
  };

  svc.removeChapter = chapter_index => {
    svc.pins.splice(chapter_index, 1);
  };

  svc.getFeaturesFromServer = config => {
    const defer = $q.defer();
    $http({
      url: `/maps/${config.id}/annotations`,
      method: "GET"
    }).then(result => {
      defer.resolve(result.data);
    });
    return defer.promise;
  };

  svc.addPinsFromGeojsonObj = (geojson, chapter) => {
    geojson.features.map(feature => {
      svc.addPinFromGeojsonObj(feature, chapter);
    });
  };

  svc.addPinFromGeojsonObj = (feature, chapter) => {
    const props = feature.properties;
    props.geometry = $.parseJSON(feature.geometry);
    props.geometry.coordinates = ol.proj.transform(
      props.geometry.coordinates,
      "EPSG:4326",
      "EPSG:3857"
    );
    props.id = feature.id;
    props.start_time = props.start_time * 1000;
    props.end_time = props.end_time * 1000;
    const storyPin = new svc.Pin(props);
    storyPin.setId(feature.id);
    svc.pins[chapter].push(storyPin);
  };

  svc.addGetterAndSetterToPinPrototype = prop => {
    Object.defineProperty(svc.Pin.prototype, prop, {
      get: function() {
        const val = this.get(prop);
        return typeof val === "undefined" ? null : val;
      },
      set: function(val) {
        this.set(prop, val);
      }
    });
  };

  svc.addMultipleGettersAndSettersToPinPrototype = props => {
    props.forEach(prop => {
      svc.addGetterAndSetterToPinPrototype(prop);
    });
  };

  svc.getPins = chapter_index => svc.pins[chapter_index] || [];

  svc.reorderPins = (from_index, to_index) => {
    svc.pins.splice(to_index, 0, svc.pins.splice(from_index, 1)[0]);
  };

  svc.removePin = (storyPin, chapter_index) => {
    for (let i = 0; i < svc.pins[chapter_index].length; i++) {
      if (storyPin.id_ == svc.pins[chapter_index][i].id_) {
        const splice_index = i;
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

  svc.removePinByIndex = (pin_index, chapter_index) => {
    svc.pins[chapter_index].splice(pin_index, 1);
    $rootScope.$broadcast("pin-removed", chapter_index);
  };

  svc.validatePinProperty = (pinInstantiationObj, propertyName) =>
    pinInstantiationObj.hasOwnProperty(propertyName) &&
    (goog.isDefAndNotNull(pinInstantiationObj[propertyName]) &&
      !goog.string.isEmptySafe(pinInstantiationObj[propertyName]));

  svc.validateAllPinProperties = pinInstantiationObj => {
    const missingProperties = [];
    const copy_attribs = angular.copy(model_attributes);
    copy_attribs.push("geometry");
    for (let iProp = 0; iProp < copy_attribs.length; iProp += 1) {
      const property = copy_attribs[iProp];
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

  svc.handleInvalidPin = invalidProperties => {
    $translate(invalidProperties).then(translations => {
      let invalid_string =
        "These properties must be set before saving a StoryPin: ";
      for (let iProp = 0; iProp < invalidProperties.length; iProp += 1) {
        const property = invalidProperties[iProp];
        let translatedProp = translations[property];
        translatedProp = translatedProp.concat(", ");
        invalid_string = invalid_string.concat(translatedProp);
      }
      toastr.error(invalid_string, "Cannot save StoryPin");
    });
  };

  svc.addPin = function(props, chapter_index) {
    const pinValidated = svc.validateAllPinProperties(props);
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
      props.media = props.media.replace(/width="\d+"/i, `width=${embed_width}`);
      props.media = props.media.replace(
        /height="\d+"/i,
        `height=${embed_height}`
      );
    }
    const storyPin = new svc.Pin(props);
    svc.pins[chapter_index].push(storyPin);
    $rootScope.$broadcast("pin-added", chapter_index);
    return true;
  };

  // @TODO: write test for this after mapService functions are ported over
  svc.updatePin = (pin, chapter_index) => {
    //Only set new geometry if location was saved on pin object
    if (goog.isDefAndNotNull(pin.geometry)) {
      // mapService_.removeDraw();
      // mapService_.removeSelect();
      // mapService_.removeModify();
      // mapService_.map.removeLayer(mapService_.editLayer);
      const newGeom = new ol.geom.Point(pin.geometry.coordinates);
      pin.setGeometry(newGeom);
    }
    for (let iPin = 0; iPin < svc.pins.length; iPin += 1) {
      if (pin.id === svc.pins[iPin].id) {
        svc.pins[iPin] = pin;
      }
    }
    rootScope_.$broadcast("pin-added", chapter_index);
  };

  //@TODO: move to another service
  svc.isUrl = str => {
    if (!/^(f|ht)tps?:\/\//i.test(str)) {
      return false;
    }
    return true;
  };

  svc.defaultPinValues = pin => {
    Object.keys(pin).forEach((key, index) => {
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

  svc.bulkPinAdd = (pinConfigs, chapter_index) => {
    let failedToAdd = 0;
    for (let iPin = 0; iPin < pinConfigs.length; iPin += 1) {
      let pin = pinConfigs[iPin];
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
        pin.media = pin.media.replace(/width="\d+"/i, `width=${embed_width}`);
        pin.media = pin.media.replace(
          /height="\d+"/i,
          `height=${embed_height}`
        );
      }

      const storyPin = new svc.Pin(pin);
      svc.pins[chapter_index].push(storyPin);
    }
    $rootScope.$broadcast("pin-added", chapter_index);
  };

  svc.addChaptersAndPins = config => {
    const defer = $q.defer();
    angular.forEach(config.chapters, (chapterConfig, index) => {
      if (!goog.isDefAndNotNull(svc.pins[index])) {
        svc.addChapter();
      }
      svc.getFeaturesAndConvertToPins(chapterConfig).then(complete => {
        defer.resolve(complete);
      });
    });
    return defer.promise;
  };

  svc.getFeaturesAndConvertToPins = chapterConfig => {
    const defer = $q.defer();
    svc.getFeaturesFromServer(chapterConfig).then(geojson => {
      addPinsFromGeojsonObj(geojson);
      defer.resolve(true);
    });
    return defer.promise;
  };

  svc.initPinSvc = () => {
    const defer = $q.defer();
    const config = stateSvc.getConfig();
    if (goog.isDefAndNotNull(config.chapters)) {
      svc.addChaptersAndPins(config).then(complete => {
        defer.resolve(complete);
      });
    }
    return defer.promise;
  };

  svc.addMultipleGettersAndSettersToPinPrototype(model_attributes);

  /*
    When a user starts creating a new pin, this creates the default pin.
   */
  svc.onNewStoryPin = chapterIndex => {
    const defaults = {
      title: "unnamed story-pin",
      start_time: "1/1/2018",
      end_time: "1/1/2018",
      geometry: {
        coordinates: [0, 0]
      }
    };
    this.currentPin = svc.addPin(defaults, chapterIndex);
  };

  /*
    Starts "Place new Pin" mode.
    The mouse cursor should change to a Pin.
    When the user clicks on the map it places the pin and fills the Lat,Long on the form.
    If the user presses `esc` the mode will be cancelled.
   */
  svc.placeNewPinOnMap = (pinName, latitude, longitude) => {
    const iconFeature = new ol.Feature({
      geometry: new ol.geom.Point([latitude, longitude]),
      name: pinName
    });

    const iconStyle = new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0, 0],
        anchorXUnits: "fraction",
        anchorYUnits: "pixels",
        opacity: 0.75,
        src: "data/icon.png"
      })
    });

    iconFeature.setStyle(iconStyle);
    const vectorSource = new ol.source.Vector({
      features: [iconFeature]
    });

    const vectorLayer = new ol.layer.Vector({
      source: vectorSource
    });
    // TODO: Add layers to map
    let map = new ol.Map({
      layers: [vectorLayer]
    });
  };

  return svc;
}

module.exports = pinSvc;
