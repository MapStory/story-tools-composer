const Papa = require("papaparse"); // Used for CSV Parsing.

/**
 * StoryPin Service
 * @param $rootScope .
 * @param $http .
 * @param $translate .
 * @param $q .
 * @param timeSvc .
 * @param featureManagerSvc .
 * @param stateSvc .
 * @param MapManager .
 * @param $uibModal .
 * @returns {{}} pinSvc.
 */
function pinSvc(
  $rootScope,
  $http,
  $translate,
  $q,
  timeSvc,
  featureManagerSvc,
  stateSvc,
  MapManager,
  $uibModal
) {
  const svc = {}; // this
  svc.pins = [[]]; // The collection of pins
  svc.currentPin = null; // The current Pin being edited
  // For Drag functionality:
  svc.isDrawing = false;
  svc.selected_feature = null;
  svc.drag_control = null;
  // This is the openlayers source that stores all the features that are drawn on the map.
  svc.pinLayerSource = null;
  svc.old_interactions = [];
  // For Date selection widgets
  svc.dt = new Date(); // The DT
  svc.startdate_popup = {
    opened: false // Controls open/close of popup
  };
  svc.enddate_popup = {
    opened: false
  };
  svc.pin_start_time = Date.now();
  svc.pin_end_time = Date.now();

  svc.dt2 = new Date();

  svc.formats = ["dd-MMMM-yyyy", "yyyy/MM/dd", "dd.MM.yyyy", "shortDate"];
  const [first_format] = svc.formats;
  svc.format = first_format;
  svc.altInputFormats = ["M!/d!/yyyy"];
  svc.inlineOptions = {
    customClass: svc.getDayClass,
    minDate: new Date(),
    showWeeks: true
  };

  svc.dateOptions = {
    dateDisabled: svc.disabled,
    formatYear: "yy",
    // maxDate: new Date(2020, 5, 22),
    // minDate: new Date(),
    startingDay: 1
  };

  // Controlls the accordions
  // TODO: Move this to a form controller
  svc.open = {
    editor: false,
    chooser: false
  };

  svc.disabled = data => {
    const date = data.date;
    const mode = data.mode;
    return mode === "day" && (date.getDay() === 0 || date.getDay() === 6);
  };

  svc.open_startdate = () => {
    svc.startdate_popup.opened = true;
  };

  svc.open_enddate = () => {
    svc.enddate_popup.opened = true;
  };

  svc.setDate = function(year, month, day) {
    svc.dt = new Date(year, month, day);
  };

  /**
   * Gets the current day
   * @param data
   * @returns {string}
   */
  svc.getDayClass = data => {
    const date = data.date;
    const mode = data.mode;
    if (mode === "day") {
      const dayToCheck = new Date(date).setHours(0, 0, 0, 0);

      for (let i = 0; i < svc.events.length; i++) {
        const currentDay = new Date(svc.events[i].date).setHours(0, 0, 0, 0);

        if (dayToCheck === currentDay) {
          return svc.events[i].status;
        }
      }
    }

    return "";
  };

  /**
   * Creates a new Pin from data
   * TODO: Check if this actually works as expected
   * @param data The data to build the pin from.
   */
  svc.Pin = function(data) {
    // Angular copydata
    const copyData = angular.copy(data);
    // Deletes and re-sets geometry
    delete data.geometry;
    ol.Feature.call(this, data);
    this.properties = data;
    this.setGeometry(new ol.geom.Point(copyData.geometry.coordinates));
    // Sets the time with the time service.
    // this.start_time = timeSvc.getTime(this.start_time);
    // this.end_time = timeSvc.getTime(this.end_time);
    this.start_time = new Date();
    this.end_time = new Date();
  };
  // Set the pin's prototype and constructor
  svc.Pin.prototype = Object.create(ol.Feature.prototype);
  svc.Pin.prototype.constructor = svc.Pin;

  const embed_width = '"180"';
  const embed_height = '"180"';
  // The model
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
  // Filters
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

  /**
   * Adds an empty chapter to the pin list.
   */
  svc.addChapter = () => {
    svc.pins.push([]);
  };

  /**
   * Creates a vectorlayer with the storypinlayer metadata.
   * @returns {*}
   */
  svc.createStoryPinLayer = () =>
    featureManagerSvc.createVectorLayer(
      featureManagerSvc.storyPinLayerMetadata
    );

  // TODO: Move this to somewhere more appropiate
  svc.pinLayer = svc.createStoryPinLayer();

  /**
   * Adds an empty pin to the current chapter.
   */
  svc.addEmptyPinToCurrentChapter = () => {
    svc.pins[stateSvc.getChapterIndex() - 1].push({});
    $rootScope.$broadcast("pin-added", stateSvc.getChapterIndex() - 1);
  };

  /**
   * Removes a chapter with the given index
   * @param chapter_index Chapter index to remove.
   */
  svc.removeChapter = chapter_index => {
    svc.pins.splice(chapter_index, 1);
  };

  /**
   * Gets the geo-features from the server.
   * @param config Config
   * @return Returns a promise
   */
  svc.getFeaturesFromServer = config => {
    const features_url = `/maps/${config.id}/annotations`;
    const defer = $q.defer();
    $http({
      url: features_url,
      method: "GET"
    }).then(result => {
      defer.resolve(result.data);
    });
    return defer.promise;
  };

  /**
   * Adds pins from a GEOJSON object
   * @param geojson The object.
   * @param chapter Chapter to insert to.
   */
  svc.addPinsFromGeojsonObj = (geojson, chapter) => {
    geojson.features.map(feature => {
      svc.addPinFromGeojsonObj(feature, chapter);
    });
  };
  /**
   * Adds a single pin from a GEOJSON feature object.
   * @param feature The feature
   * @param chapter The chapter to insert into.
   */
  svc.addPinFromGeojsonObj = (feature, chapter) => {
    // Convert the data
    const props = feature.properties;
    props.geometry = $.parseJSON(feature.geometry);
    props.geometry.coordinates = ol.proj.transform(
      props.geometry.coordinates,
      "EPSG:4326",
      "EPSG:3857"
    );
    props.id = feature.id;
    props.start_time *= 1000;
    props.end_time *= 1000;

    // Create the new pin and insert to chapter
    const storyPin = new svc.Pin(props);
    storyPin.setId(feature.id);
    svc.pins[chapter].push(storyPin);
  };

  /**
   * TODO: Why is this needed?
   * @param prop
   */
  svc.addGetterAndSetterToPinPrototype = prop => {
    Object.defineProperty(svc.Pin.prototype, prop, {
      get() {
        const val = this.get(prop);
        return typeof val === "undefined" ? null : val;
      },
      set(val) {
        this.set(prop, val);
      }
    });
  };

  svc.addMultipleGettersAndSettersToPinPrototype = props => {
    props.forEach(prop => {
      svc.addGetterAndSetterToPinPrototype(prop);
    });
  };

  /**
   * Get pins from chapter index
   * @param chapter_index The chapter
   * @returns {Array|*} An array of Pins
   */
  svc.getPins = chapter_index => svc.pins[chapter_index] || [];
  svc.reorderPins = (from_index, to_index) => {
    svc.pins.splice(to_index, 0, svc.pins.splice(from_index, 1)[0]);
  };

  /**
   * Removes a pin from a chapter
   * @param storyPin The Storypin to be removed.
   * @param chapter_index The chapter to remove from.
   */
  svc.removePin = (storyPin, chapter_index) => {
    for (let i = 0; i < svc.pins[chapter_index].length; i++) {
      if (storyPin.id_ === svc.pins[chapter_index][i].id_) {
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

  /**
   * Validates pin config.
   * @param pinInstantiationObj
   * @param propertyName
   * @returns {*|boolean}
   */
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

  /**
   * Deals with a bad pin.
   * @param invalidProperties
   */
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

  /**
   * Adds a new Pin with the given properties to the given chapter.
   * @param props The pin's properties.
   * @param chapter_index The chapter's index.
   * @returns {Pin} The Pin created.
   */
  svc.addPin = (props, chapter_index) => {
    // TODO: Validate the pin!

    const pinValidated = svc.validateAllPinProperties(props);
    if (pinValidated !== true) {
      console.log("invalid pin!!!");
      svc.handleInvalidPin(pinValidated);
      return null;
    }

    // Check time is OK
    if (timeSvc.getTime(props.start_time) > timeSvc.getTime(props.end_time)) {
      console.log("Start Time must be before End Time", "Invalid Time");
      toastr.error("Start Time must be before End Time", "Invalid Time");
      return null;
    }

    // TODO: Check media whitelist and sanitize embed size.
    // if (goog.isDefAndNotNull(props.media) && !this.isUrl(props.media)) {
    //   props.media = props.media.replace(/width="\d+"/i, `width=${embed_width}`);
    //   props.media = props.media.replace(
    //     /height="\d+"/i,
    //     `height=${embed_height}`
    //   );
    // }

    // Create the new storypin
    const storyPin = new svc.Pin(props);
    // Push to the chapter
    if (!svc.pins[chapter_index]) {
      svc.pins[chapter_index] = [];
    }
    svc.pins[chapter_index].push(storyPin);
    // Broadcast event

    console.log("story pin suposed to be added", storyPin);
    $rootScope.$broadcast("pin-added", chapter_index);

    return storyPin;
  };

  /**
   * Updates a pin at the given chapter index
   * @param pin The Pin
   * @param chapter_index The chapter
   * @ TODO: write test for this after mapService functions are ported over
   */
  svc.updatePin = (pin, chapter_index) => {
    console.log("about to update pin");
    // Only set new geometry if location was saved on pin object
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
    // TODO: Check if this broadcast is behaving OK
    $rootScope.$broadcast("pin-added", chapter_index);
  };

  // @ TODO: move to another service
  svc.isUrl = str => {
    if (!/^(f|ht)tps?:\/\//i.test(str)) {
      return false;
    }
    return true;
  };

  /**
   * Sets the default values for a given Pin.
   * @param pin The Pin
   * @returns {*} The same pin with values changed.
   */
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

  /**
   * Bulk create StoryPins
   * @param pinConfigs Pin configurations.
   * @param chapter_index The chapter index to add them to.
   */
  svc.bulkPinAdd = (pinConfigs, chapter_index) => {
    let failedToAdd = 0;
    for (let iPin = 0; iPin < pinConfigs.length; iPin += 1) {
      let pin = pinConfigs[iPin];
      pin = svc.defaultPinValues(pin);

      pin.id = new Date().getUTCMilliseconds();
      pin.geometry = {
        coordinates: ol.proj.transform(
          [Number(pin.longitude), Number(pin.latitude)],
          "EPSG:4326",
          "EPSG:3857"
        )
      };
      delete pin.longitude;
      delete pin.latitude;
      if (
        svc.validateAllPinProperties(pin) !== true ||
        timeSvc.getTime(pin.start_time) > timeSvc.getTime(pin.end_time)
      ) {
        failedToAdd += 1;
        // TODO: This is not OK! Fix!
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

  /**
   * Convenience method for adding chapters and pins.
   * @param config The config.
   */
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

  /**
   * Gets Features from server and converts them to pins.
   * @param chapterConfig The config.
   * @return {promise} A promise.
   */
  svc.getFeaturesAndConvertToPins = chapterConfig => {
    const defer = $q.defer();
    svc.getFeaturesFromServer(chapterConfig).then(geojson => {
      svc.addPinsFromGeojsonObj(geojson);
      defer.resolve(true);
    });
    return defer.promise;
  };

  /**
   * Initializes the PinService.
   * TODO: Verify that this is getting called.
   */
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

  // TODO: Move this somewhere more visible.
  svc.addMultipleGettersAndSettersToPinPrototype(model_attributes);

  /*
    When a user starts creating a new pin, this creates the default pin.
    It then creates a map point feature and adds it to the pin.
   */
  svc.onNewStoryPin = chapterIndex => {
    const map = MapManager.storyMap.getMap();
    const center = map.getView().getCenter(); // Creates it on the center of the current view.

    // TODO: Insert current timeline times here
    const defaults = {
      title: "New StoryPin",
      start_time: "1/1/2018",
      end_time: "1/1/2018",
      in_timeline: true,
      in_map: true,
      geometry: {
        coordinates: center
      }
    };

    // Create or alert
    const pin = svc.addPin(defaults, chapterIndex);
    if (!pin) {
      alert("No pin was created");
    }
    const pin_index = svc.pins[chapterIndex].length - 1;
    pin.index_id = pin_index;
    svc.currentPin = pin; // This behaves weird. Don't rely on currentPin :(
    svc.currentPin.coords = center; // TODO: Use the geometry coords!
    // Update the map with the new Pin
    if (pin.in_map === true) {
      svc.addPointToPinLayer(pin);
    }
    $rootScope.$broadcast("pin-added", pin);
    return pin;
  };

  /**
   * turnPinDrawModeOn
   * -----------------
   *
   * Turns Pin Draw Mode. On the user's next click,
   * a Pin will be placed and the coordinates for currentPin updated.
   */
  svc.turnPinDrawModeOn = index => {
    const pin = svc.pins[stateSvc.getChapterIndex()][index];
    svc.currentPin = pin;
    const map = MapManager.storyMap.getMap();

    svc.isDrawing = !svc.isDrawing;

    if (svc.isDrawing === true) {
      svc.doBounceAnim(pin.coords);
      // Add the drag interaction
      // TODO: Start drag and drop here.
      svc.start_drag_interaction();
    } else {
      // Remove the drag interaction
      // TODO: Stop drag interaction here
      svc.stop_drag_interaction();
      pin.coords = pin.map_feature.getGeometry().getCoordinates();
    }
    if (!pin) {
      alert("No pin!");
    }
    // Create a new overlay for this pin
    // svc.sp_overlay.setPosition(pin.map_feature.getGeometry().getCoordinates());
  };

  // TODO: Finish this
  svc.onBulkPinAdd = () => {
    // Open modal and start the upload wizard
    svc.modalInstance = $uibModal.open({
      animation: true,
      ariaLabelledBy: "modal-title",
      ariaDescribedBy: "modal-body",
      templateUrl: "myModalContent.html"
      // controller: svc,
      // controllerAs: '$ctrl',
    });

    svc.modalInstance.result.then(
      resolved => {
        svc.selected = resolved;
      },
      () => {
        const x = 3;
      }
    );

    // TODO: Remove this later:
    // svc.test_the_thing_remove_this_later();
  };

  /**
   * A map animation that bounces to a location
   * @param location The location to bounce to.
   */
  svc.doBounceAnim = location => {
    const map = MapManager.storyMap.getMap();
    // bounce by zooming out one level and back in
    const bounce = ol.animation.bounce({
      resolution: map.getView().getResolution() * 2
    });
    // start the pan at the current center of the map
    const pan = ol.animation.pan({
      source: map.getView().getCenter()
    });
    map.beforeRender(bounce);
    map.beforeRender(pan);
    // when we set the center to the new location, the animated move will
    // trigger the bounce and pan effects
    map.getView().setCenter(location);
  };

  /**
   * Creates a storypin overlay and sets its position.
   * @param pin The pin.
   */
  svc.createPinOverlay = pin => {
    // TODO: Fix this
    const map = MapManager.storyMap.getMap();

    // // Create a new overlay for this pin
    // const sp_overlay = new ol.Overlay({
    //   element: document.getElementById(`sp-overlay`)
    // });
    //
    // if(!sp_overlay) {
    //   alert("no overlay found!");
    // }
    // // svc.sp_overlay = sp_overlay;
    // map.addOverlay(sp_overlay);
    // sp_overlay.setPosition(pin.map_feature.getGeometry().getCoordinates());
  };

  svc.init_edit_pin_overlay = () => {
    const map = MapManager.storyMap.getMap();

    // Create the layer
    svc.pinLayerSource = new ol.source.Vector({
      projection: "EPSG:4326"
    });
    svc.sp_vectorLayer = new ol.layer.Vector({
      source: svc.pinLayerSource,
      style: svc.getStyle
    });
    map.addLayer(svc.sp_vectorLayer);

    // Register the overlay
    const sp_overlay = new ol.Overlay({
      element: document.getElementById("sp-overlay")
    });
    svc.sp_overlay = sp_overlay;
    map.addOverlay(svc.sp_overlay);
  };

  /**
   * Adds a new point feature to the layer.
   * Adds this feature and associates it to the Pin.
   * @param pin The pin.
   */
  svc.addPointToPinLayer = pin => {
    // Lazy instantiate the pin layer
    if (svc.pinLayerSource === null) {
      svc.init_edit_pin_overlay();
    }

    // Builds a new point at the pin's location
    const point = new ol.Feature({
      geometry: new ol.geom.Point(pin.coords)
    });

    // Pin now has a feature:
    pin.map_feature = point;
    pin.map_feature.set("label", pin.title);
    // TODO: Set other custom feature properties here.

    // Add to the Pin layer.
    svc.pinLayerSource.addFeatures([point]);

    // Draw the overlay on top of this pin
    svc.createPinOverlay(pin);
  };

  /**
   * Creates a new pin. This is the function that gets called from the template.
   * @param config
   * @param chapterIndex
   * @param lat
   * @param long
   * @returns {Pin}
   */
  svc.createNewPin = (config, chapterIndex, lat, long) => {
    const map = MapManager.storyMap.getMap();
    const pin = svc.addPin(config, chapterIndex);
    if (!pin) {
      alert("No pin was created");
    }
    pin.coords = [lat, long];
    svc.addPointToPinLayer(pin);
    $rootScope.$broadcast("pin-added", svc.currentPin);
    return pin;
  };

  /**
   * Callback for StoryPin bulk upload.
   * This gets run when Papa parse finishes parsing a CSV.
   * @param results The Storypins from the CSV
   * @returns {Array} An Array of pins.
   */
  svc.onBulkPinComplete = results => {
    const pin_array = [];
    results.data.forEach(element => {
      const pin = svc.createNewPin(
        {
          title: element.title,
          start_time: element.start_time,
          end_time: element.end_time,
          geometry: {
            coordinates: [element.latitude, element.longitude]
          }
        },
        stateSvc.getChapterIndex(),
        element.latitude,
        element.longitude
      );
      pin.content = element.content || "";
      pin.media = element.media || "";
      pin.in_map = element.in_map || true;
      pin.in_timeline = element.in_timeline || true;
      pin_array.push(pin);
    });
    console.log("pin_array is", pin_array);
    // This is null:
    // TODO: Fix this null object. This should close the modal dialog.
    // svc.modalInstance.close();
    return pin_array;
  };

  /**
   * Parses and creates StoryPins with a CSV
   * @param data
   */
  svc.createPinsWithCSV = data => {
    Papa.parse(data, {
      header: true,
      dynamicTyping: true,
      delimiter: ",",
      complete: svc.onBulkPinComplete,
      skipEmptyLines: true
    });
  };

  /**
   * Removes a feature from the map for the given pin.
   * @param pin_index The pin's index.
   * @param chapter_index The chapter's index.
   */
  svc.removePinFeatureFromMap = (pin_index, chapter_index) => {
    const chapterPins = svc.pins[chapter_index];
    const pin = chapterPins[pin_index];

    if (!pin) {
      alert("Trying to remove something that isn't");
      return;
    }

    if (pin.map_feature) {
      svc.pinLayerSource.removeFeature(pin.map_feature);
    } else {
      alert("no map feature to remove!");
    }
  };

  /**
   * Removes a pin.
   * @param pin_index The index of the pin.
   * @param chapter_index The chapter index of the pin.
   */
  svc.removePinByIndex = (pin_index, chapter_index) => {
    // remove feature from map:
    svc.removePinFeatureFromMap(pin_index.$index, chapter_index);

    // Remove pin from list:
    svc.pins[chapter_index].splice(pin_index, 1);
    $rootScope.$broadcast("pin-removed", chapter_index);
  };

  /**
   * Builds a JSON object of all the StoryPins.
   * @returns {Array} An array of StoryPins.
   */
  svc.getPinsJSON = () => {
    const pin_list = [];
    let chapter_count = 0;
    // Loop chapters.
    svc.pins.forEach(chapter => {
      if (chapter) {
        chapter.forEach(pin => {
          pin_list.push({
            chapter_index: chapter_count,
            title: pin.title,
            content: pin.content,
            latitude: pin.coords[0],
            longitude: pin.coords[1],
            media: pin.media,
            start_time: pin.start_time,
            end_time: pin.end_time,
            in_map: pin.in_map,
            in_timeline: pin.in_timeline
          });
        });
      } else {
        alert("bad chapter!");
      }

      chapter_count += 1;
    });
    return pin_list;
  };

  /**
   * Triggered when the user presses OK on the StoryPin Bulk Upload dialog window.
   */
  svc.processCSVFile = () => {
    const selectedFile = document.getElementById("bulk_pin_csv_file").files[0];
    if (selectedFile) {
      svc.createPinsWithCSV(selectedFile);
    } else {
      alert("No file selected!");
    }
  };

  /**
   * This defines the style for each StoryPin.
   * This function is supposed to be passed to the Layer that contains them.
   * @param feature The storypin.map_feature
   * @returns {*[]} Some CSS
   */
  svc.getStyle = feature => [
    new ol.style.Style({
      text: new ol.style.Text({
        text: feature.get("label"),
        fill: new ol.style.Fill({
          color: "#333"
        }),
        stroke: new ol.style.Stroke({
          color: [255, 255, 255, 0.8],
          width: 2
        }),
        font: "18px 'Helvetica Neue', Arial"
      }),
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: [255, 255, 255, 0.3]
        }),
        stroke: new ol.style.Stroke({
          color: [51, 153, 204, 0.4],
          width: 1.5
        }),
        radius: 10
      })
    })
  ];

  /**
   * Start StoryPin Drag
   */
  svc.start_drag_interaction = () => {
    const map = MapManager.storyMap.getMap();
    // Remove previous interaction
    if (svc.drag_control !== null) {
      map.removeInteraction(svc.drag_control);
      svc.drag_control = null;
    }
    // Save old interactions
    svc.old_interactions = map.getInteractions();
    svc.drag_control = new ol.interaction.Modify({
      features: new ol.Collection(svc.pinLayerSource.getFeatures())
    });
    map.addInteraction(svc.drag_control);
  };

  /**
   * The user is Done moving the StoryPin
   */
  svc.stop_drag_interaction = () => {
    const map = MapManager.storyMap.getMap();
    if (svc.drag_control !== null) {
      map.removeInteraction(svc.drag_control);
      svc.drag_control = null;
    }
    // Restore old interactions
    svc.old_interactions.forEach(interaction => {
      map.addInteraction(interaction);
    });
  };

  /**
   * When the user clicks on save it will reflect his changes on the map.
   */
  svc.onStoryPinSave = () => {
    if (svc.isDrawing) {
      alert("Finish moving StoryPin first!");
      return;
    }

    // Update information from features, and remove form map.
    svc.pins[stateSvc.getChapterIndex()].forEach(pin => {
      svc.pinLayerSource.removeFeature(pin.map_feature);
    });

    // Add to the map with the new info.
    svc.pins[stateSvc.getChapterIndex()].forEach(pin => {
      svc.addPointToPinLayer(pin);
    });
  };

  svc.exportPinsToJSON = pinArray => {
    pinArray.forEach(pin => {
      console.log(pin);
    });
    return [];
  };

  svc.onBulkPinComplete = results => {
    const pin_array = [];
    results.data.forEach(element => {
      const pin = svc.createNewPin(
        {
          title: element.title,
          start_time: element.start_time,
          end_time: element.end_time,
          geometry: {
            coordinates: [element.latitude, element.longitude]
          }
        },
        stateSvc.getChapterIndex(),
        element.latitude,
        element.longitude
      );
      pin.content = element.content || "";
      pin.media = element.media || "";
      pin.in_map = element.in_map || true;
      pin.in_timeline = element.in_timeline || true;
      pin_array.push(pin);
    });
    console.log("pin_array is", pin_array);
    // This is null:
    // TODO: Fix this null object. This should close the modal dialog.
    // svc.modalInstance.close();
    return pin_array;
  };

  svc.downloadCSV = pinArray => {
    const data = svc.exportPinsToCSV(pinArray);
    const hidden_element = document.createElement("a");
    const uri_encoded = encodeURI(data);
    hidden_element.href = `data:text/csv;charset=utf8,${uri_encoded}`;
    hidden_element.target = "_blank";
    hidden_element.download = "storypins.csv";
    hidden_element.click();
  };

  svc.exportPinsToCSV = pinArray => {
    const csv_objects = []; // Holds objects with the CSV format

    pinArray.forEach(pin => {
      const csv_pin = {};
      csv_pin.title = pin.title;
      csv_pin.content = pin.content;
      csv_pin.media = pin.media;
      csv_pin.start_time = pin.start_time;
      csv_pin.end_time = pin.end_time;
      const coords = pin.map_feature.getGeometry().getCoordinates();
      csv_pin.latitude = coords[0];
      csv_pin.longitude = coords[1];
      csv_pin.in_map = pin.in_map;
      csv_pin.in_timeline = pin.in_timeline;
      csv_objects.push(csv_pin);
    });

    // Convert to CSV
    return Papa.unparse(csv_objects);
  };

  svc.onChangedTime = () => {
    console.log(svc.pin_start_time);
  };
  return svc;
}

module.exports = pinSvc;
