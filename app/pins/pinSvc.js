import Papa from "papaparse"; // Used for CSV Parsing
import moment from "moment"; // For time and dates
import PubSub from "pubsub-js"; // For event handling

/**
 * StoryPin Service.
 * All things StoryPins.
 *
 * @param $http .
 * @param $translate .
 * @param timeSvc .
 * @param featureManagerSvc .
 * @param stateSvc .
 * @param MapManager .
 * @param $uibModal .
 * @returns {{}} pinSvc.
 */
function pinSvc(
  $translate,
  timeSvc,
  featureManagerSvc,
  stateSvc,
  MapManager,
  $uibModal
) {
  const svc = {}; // this
  // The collection of pins
  svc.pins = [[]];
  // The current Pin being edited
  svc.currentPin = null;
  // For Drag functionality:
  svc.isDrawing = false;
  svc.selectedFeature = null;
  svc.dragControl = null;
  // This is the openlayers source that stores all the features that are drawn on the map.
  svc.pinLayerSource = null;
  svc.oldInteractions = [];
  // TODO: Move this to pin editor controller
  // For Date selection widgets
  svc.dt = new Date(); // The DT
  svc.startDatePopup = {
    opened: false // State for open/close popup
  };
  svc.endDatePopup = {
    opened: false
  };
  // Start and end times.
  // TODO: Move this to pin editor controller
  svc.pinStartTime = Date.now();
  // TODO: Move this to pin editor controller
  svc.pinEndTime = Date.now();
  // Controlls the accordions
  // TODO: Move this to a form controller
  svc.open = {
    editor: false,
    chooser: false
  };
  svc.availableDisplayCoordinates = [
    { display: "Decimal Degrees", value: "dd" },
    { display: "Degrees Minutes Seconds", value: "dms" }
  ];
  svc.displayCoordinates = "dd";
  // Media whitelist
  svc.whitelist = [
    new RegExp(/https?:\/\/.*\.flickr\.com\/photos\/.*/),
    new RegExp(/https?:\/\/flic\.kr\/p\/.*/),
    new RegExp(/https?:\/\/instagram\.com\/p\/.*/),
    new RegExp(/https?:\/\/instagr\.am\/p\/.*/),
    new RegExp(/https?:\/\/vine\.co\/v\/.*/),
    new RegExp(/https?:\/\/(?:www\.)?vimeo\.com\/.+/),
    new RegExp(/https?:\/\/((?:www\.)|(?:pic\.)?)twitter\.com\/.*/),
    new RegExp(
      /https?:\/\/(?:w{3}\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com).+/im
    ),
    new RegExp(/https?:\/\/(w{3}\.)?soundcloud\.com\/.+/im),
    new RegExp(
      /https?:\/\/(?:((?:m)\.)|((?:www)\.)|((?:i)\.))?imgur\.com\/?.+/im
    )
  ];

  /**
   * Gets the current day
   * @param data
   * @returns {string}
   */
  svc.getDayClass = data => {
    const [date, mode] = [data.date, data.mode];
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
  svc.Pin = function createPin(data) {
    // Angular copydata
    const copyData = angular.copy(data);
    // Deletes and re-sets geometry
    delete data.geometry;
    ol.Feature.call(this, data);
    this.properties = data;
    this.setGeometry(new ol.geom.Point(copyData.geometry.coordinates));
    this.startTime = data.startTime ? new Date(data.startTime) : new Date();
    this.endTime = data.endTime ? new Date(data.endTime) : new Date();
  };
  // Set the pin's prototype and constructor
  svc.Pin.prototype = Object.create(ol.Feature.prototype);
  svc.Pin.prototype.constructor = svc.Pin;

  const embedWidth = '"180"';
  const embedHeight = '"180"';
  // The model
  const modelAttributes = [
    "title",
    "id",
    "_id",
    "content",
    "media",
    "startTime",
    "endTime",
    "inMap",
    "inTimeline",
    "pause_playback",
    "autoShow"
  ];
  // Filters
  const filterPropertiesFromValidation = [
    "id",
    "_id",
    "content",
    "media",
    "inMap",
    "inTimeline",
    "pause_playback",
    "autoShow"
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
  };

  /**
   * Removes a chapter with the given index
   * @param chapterIndex Chapter index to remove.
   */
  svc.removeChapter = chapterIndex => {
    svc.pins.splice(chapterIndex, 1);
  };

  /**
   * Gets the geo-features from the server.
   * @param config Config
   * @return Returns a promise
   */
  // TODO: Remove this
  svc.getFeaturesFromServer = config => {
    const featuresURL = `/maps/${config.id}/annotations`;

    const defer = new Promise( (resolve, reject) => {
      return fetch(featuresURL, {
        method: "GET"
      }).then(result => {
        resolve(result.data);
      });
    });
  };

  /**
   * Adds pins from a GEOJSON object
   * @param geojson The object.
   * @param chapter Chapter to insert to.
   */
  svc.addPinsFromGeojsonObj = (geojson, chapter) => {
    // eslint-disable-next-line array-callback-return
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
    props.startTime *= 1000;
    props.endTime *= 1000;

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
   * @param chapterIndex The chapter
   * @returns {Array|*} An array of Pins
   */
  svc.getPins = chapterIndex => svc.pins[chapterIndex] || [];
  svc.reorderPins = (fromIndex, toIndex) => {
    svc.pins.splice(toIndex, 0, svc.pins.splice(fromIndex, 1)[0]);
  };

  /**
   * Removes a pin from a chapter
   * @param storyPin The Storypin to be removed.
   * @param chapterIndex The chapter to remove from.
   */
  svc.removePin = (storyPin, chapterIndex) => {
    for (let i = 0; i < svc.pins[chapterIndex].length; i++) {
      if (storyPin.id_ === svc.pins[chapterIndex][i].id_) {
        const spliceIndex = i;
        if (spliceIndex === 0) {
          svc.pins[chapterIndex].splice(0, 1);
        } else {
          svc.pins[chapterIndex].splice(spliceIndex, 1);
        }
        PubSub.publish("pin-removed", chapterIndex);
        return storyPin.id;
      }
    }
    return undefined;
  };

  /**
   * Validates pin config.
   * @param pinInstantiationObj
   * @param propertyName
   * @returns {*|boolean}
   */
  svc.validatePinProperty = (pinInstantiationObj, propertyName) =>
    Object.prototype.hasOwnProperty.call(pinInstantiationObj, propertyName) &&
    (goog.isDefAndNotNull(pinInstantiationObj[propertyName]) &&
      !goog.string.isEmptySafe(pinInstantiationObj[propertyName]));

  svc.validateAllPinProperties = pinInstantiationObj => {
    const missingProperties = [];
    const copyAttrs = angular.copy(modelAttributes);
    copyAttrs.push("geometry");
    for (let iProp = 0; iProp < copyAttrs.length; iProp += 1) {
      const property = copyAttrs[iProp];
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
      let invalidString =
        "These properties must be set before saving a StoryPin: ";
      for (let iProp = 0; iProp < invalidProperties.length; iProp += 1) {
        const property = invalidProperties[iProp];
        let translatedProp = translations[property];
        translatedProp = translatedProp.concat(", ");
        invalidString = invalidString.concat(translatedProp);
      }
      toastr.error(invalidString, "Cannot save StoryPin");
    });
  };

  /**
   * Adds a new Pin with the given properties to the given chapter.
   * @param props The pin's properties.
   * @param chapterIndex The chapter's index.
   * @returns {Pin} The Pin created.
   */
  svc.mAddPin = (props, chapterIndex) => {
    const pinValidated = svc.validateAllPinProperties(props);
    if (pinValidated !== true) {
      // TODO: log("invalid pin!!!");
      svc.handleInvalidPin(pinValidated);
      return null;
    }

    // Check time is OK
    if (timeSvc.getTime(props.startTime) > timeSvc.getTime(props.endTime)) {
      toastr.error("Start Time must be before End Time", "Invalid Time");
      return null;
    }

    // Create the new storypin
    const storyPin = new svc.Pin(props);
    // Push to the chapter
    if (!svc.pins[chapterIndex]) {
      svc.pins[chapterIndex] = [];
    }
    svc.pins[chapterIndex].push(storyPin);
    return storyPin;
  };

  /**
   * Updates a pin at the given chapter index
   * @param pin The Pin
   * @param chapterIndex The chapter
   * @ TODO: write test for this after mapService functions are ported over
   */
  svc.updatePin = (pin, chapterIndex) => {
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
          key === "inTimeline" ||
          key === "autoShow" ||
          key === "pause_playback"
        ) {
          pin[key] = false;
        } else if (key === "inMap") {
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
   * @param chapterIndex The chapter index to add them to.
   * TODO: Remove if not used
   */
  svc.bulkPinAdd = (pinConfigs, chapterIndex) => {
    // let failedToAdd = 0;
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
        timeSvc.getTime(pin.startTime) > timeSvc.getTime(pin.endTime)
      ) {
        // failedToAdd += 1;
        // TODO: This is not OK! Fix!
        // eslint-disable-next-line no-continue
        continue;
      }

      if (goog.isDefAndNotNull(pin.media) && !svc.isUrl(pin.media)) {
        pin.media = pin.media.replace(/width="\d+"/i, `width=${embedWidth}`);
        pin.media = pin.media.replace(/height="\d+"/i, `height=${embedHeight}`);
      }

      const storyPin = new svc.Pin(pin);
      svc.pins[chapterIndex].push(storyPin);
    }
  };

  /**
   * Convenience method for adding chapters and pins.
   * @param config The config.
   */
  svc.addChaptersAndPins = config => {
    const defer = new Promise((resolve, reject) => {
      angular.forEach(config.chapters, (chapterConfig, index) => {
        if (!goog.isDefAndNotNull(svc.pins[index])) {
          svc.addChapter();
        }
        svc.getFeaturesAndConvertToPins(chapterConfig).then(complete => {
          resolve(complete);
        });
      });
    });
    return defer;
  };

  /**
   * Gets Features from server and converts them to pins.
   * @param chapterConfig The config.
   * @return {promise} A promise.
   */
  svc.getFeaturesAndConvertToPins = chapterConfig => {
    const defer = new Promise((resolve, reject) => {
      svc.getFeaturesFromServer(chapterConfig).then(geojson => {
        svc.addPinsFromGeojsonObj(geojson);
        resolve(true);
      });
    });

    return defer;
  };

  /**
   * Initializes the PinService.
   */
  svc.initPinSvc = () => {
    const defer = new Promise((resolve, reject) => {
      const config = stateSvc.getConfig();
      if (goog.isDefAndNotNull(config.chapters)) {
        svc.addChaptersAndPins(config).then(complete => {
          resolve(complete);
        });
      }
    });
    return defer;
  };

  // TODO: Move this somewhere more visible.
  svc.addMultipleGettersAndSettersToPinPrototype(modelAttributes);

  /*
    When a user starts creating a new pin, this creates the default pin.
    It then creates a map point feature and adds it to the pin.
   */
  svc.onNewStoryPin = chapterIndex => {
    const map = MapManager.storyMap.getMap();
    const center = map.getView().getCenter(); // Creates it on the center of the current view.

    // TODO: Insert current timeline times here
    const defaults = {
      title: "A StoryPin",
      startTime: "1/1/2018",
      endTime: "1/1/2018",
      inTimeline: true,
      inMap: true,
      geometry: {
        coordinates: center
      }
    };
    return svc.createStoryPinWithConfig(defaults, chapterIndex, center);
  };

  /**
   * Creates and adds storypin to map.
   * @param config The config obj.
   */
  svc.createStoryPinWithConfig = (config, chapterIndex, coords) => {
    // Add to this chapter's StoryPin list
    const pin = svc.mAddPin(config, chapterIndex);
    if (!pin) {
      // TODO: log("No pin was created");
    }

    // Set some extra properties.
    pin.indexID = svc.pins[chapterIndex].length - 1;
    pin.coords = coords;

    // Update the map with the new Pin
    if (pin.inMap === true) {
      svc.addStorypinToMap(pin);
    }

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
    svc.isDrawing = !svc.isDrawing;
    if (svc.isDrawing === true) {
      // Remove the overlay while moving
      pin.overlay.setPosition(undefined);

      svc.doBounceAnim(pin.coords);
      // Add the drag interaction
      svc.startDragInteraction([pin.mapFeature]);
    } else {
      // Remove the drag interaction
      svc.stopDragInteraction();
      pin.coords = pin.mapFeature.getGeometry().getCoordinates();
      // Set the overlay again
      pin.overlay.setPosition(pin.coords);
    }
    if (!pin) {
      // TODO: alert("No pin!");
    }
  };

  svc.onBulkPinAdd = () => {
    // Open modal and start the upload wizard
    svc.modalInstance = $uibModal.open({
      animation: true,
      ariaLabelledBy: "modal-title",
      ariaDescribedBy: "modal-body",
      templateUrl: "myModalContent.html"
    });

    svc.modalInstance.result.then(
      resolved => {
        svc.selected = resolved;
      },
      () => {}
    );
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
   * Creates and inserts a new element in the DOM for the given StoryPin.
   * @param pin The StoryPin to create the overlay for.
   * // TODO: create a function that removes the div when a storypin is deleted.
   */
  svc.insertNewOverlayIntoDOMForPin = pin => {
    const txtTitle = pin.title || "";
    const txtContent = pin.content || "";
    const txtMedia = pin.media || "http://#";

    // Creates a new div with a unique ID.
    const element = document.createElement("div");
    element.setAttribute("id", `pin-overlay-${pin.indexID}`);
    element.setAttribute("class", "storypin-overlay");

    // Create dynamic content and append to parent element.
    const heading = document.createElement("div");
    heading.setAttribute("class", "heading");
    const title = document.createTextNode(`${txtTitle}`);
    heading.appendChild(title);

    const body = document.createElement("div");
    const content = document.createTextNode(`${txtContent}`);
    body.appendChild(content);

    const link = document.createElement("a");
    link.setAttribute("href", `${txtMedia}`);
    body.appendChild(link);

    // Need to check for null or empty string.
    if (pin.media !== null) {
      if (pin.media !== "") {
        const embbededMedia = document.createElement("iframe");
        embbededMedia.setAttribute("src", svc.checkWhitelist(pin.media));
        element.appendChild(embbededMedia);
      }
    }

    element.appendChild(heading);
    element.appendChild(body);

    // Add to the DOM as a hidden element.
    let overlayDiv = document.getElementById("hidden-overlays");
    if (overlayDiv === null) {
      overlayDiv = document.createElement("hidden-overlays");
    }
    overlayDiv.appendChild(element);
  };

  /**
   * Creates a storypin overlay and sets its position.
   * @param pin The pin.
   */
  svc.createPinOverlay = pin => {
    const map = MapManager.storyMap.getMap();

    // Create overlay in DOM.
    svc.insertNewOverlayIntoDOMForPin(pin);

    const overlay = new ol.Overlay({
      element: document.getElementById(`pin-overlay-${pin.indexID}`)
    });
    map.addOverlay(overlay);
    overlay.setPosition(pin.getGeometry().getCoordinates());
    pin.overlay = overlay;
  };

  /**
   * Initializes the StoryPin overlay.
   */
  svc.initEditPinOverlay = () => {
    const map = MapManager.storyMap.getMap();

    // Create the layer
    svc.pinLayerSource = new ol.source.Vector({
      projection: "EPSG:4326"
    });
    svc.vectorLayer = new ol.layer.Vector({
      source: svc.pinLayerSource,
      style: svc.getStyle
    });
    map.addLayer(svc.vectorLayer);
    const selectInteraction = new ol.interaction.Select({
      source: svc.pinLayerSource
    });
    map.addInteraction(selectInteraction);
    selectInteraction.on("select", e => {
      const features = e.target.getFeatures();
      const mapFeature = features.getArray()[0];
      if (mapFeature) {
        const pin = mapFeature.getStoryPin();
        pin.toggleShow();
      }
      // Clears the selection
      selectInteraction.getFeatures().clear();
    });
  };

  svc.removeOverlayFromDOMForPin = pin => {
    const element = document.getElementById(`pin-overlay-${pin.indexID}`);
    if (element) {
      element.remove();
    }
  };

  svc.destroyOverlay = pin => {
    const map = MapManager.storyMap.getMap();
    // Create overlay in DOM.
    map.removeOverlay(pin.overlay);
    svc.removeOverlayFromDOMForPin(pin);
    pin.overlay = null;
  };

  /**
   * Adds a new point feature to the layer.
   * Adds this feature and associates it to the Pin.
   * @param pin The pin.
   */
  svc.addStorypinToMap = pin => {
    // Lazy instantiate the pin layer
    if (svc.pinLayerSource === null || svc.vectorLayer === null) {
      svc.initEditPinOverlay();
    }

    // Builds a new point at the pin's location
    const point = new ol.Feature({
      geometry: new ol.geom.Point(pin.coords)
    });
    // TODO: Fix circular dependency
    point.getStoryPin = () => pin;
    // Pin now has a feature:
    pin.mapFeature = point;

    // Draw Labels
    // pin.mapFeature.set("label", pin.title);

    // Add to the Pin layer.
    svc.pinLayerSource.addFeatures([pin.mapFeature]);

    // Create an overlay if it doesnt exist.
    if (pin.overlay) {
      // Remove overlay
      svc.destroyOverlay(pin);
    }
    svc.createPinOverlay(pin);

    // Add functionality for the pin to show and hide itself from the map:
    pin.show = () => {
      pin.overlay.setPosition(pin.mapFeature.getGeometry().getCoordinates());
    };

    pin.hide = () => {
      pin.overlay.setPosition(undefined);
    };

    pin.toggleShow = () => {
      if (pin.overlay.getPosition()) {
        pin.hide();
      } else {
        pin.show();
      }
    };
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
    const pin = svc.mAddPin(config, chapterIndex);
    if (!pin) {
      // TODO: alert("No pin was created");
    }
    pin.coords = [lat, long];
    pin.content = "";
    pin.media = "";
    pin.inMap = true;
    pin.inTimeline = true;
    // TODO: Implement dates here:
    // pin.startDate = new Date();
    // pin.endDate = new Date();
    svc.addStorypinToMap(pin);
    return pin;
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
   * @param pinIndex The pin's index.
   * @param chapterIndex The chapter's index.
   */
  svc.removePinFeatureFromMap = (pinIndex, chapterIndex) => {
    const chapterPins = svc.pins[chapterIndex];
    const pin = chapterPins[pinIndex];

    if (!pin) {
      // TODO: alert("Trying to remove something that isn't");
      return;
    }

    if (pin.mapFeature) {
      // Remove the feature
      svc.pinLayerSource.removeFeature(pin.mapFeature);
      // Make the overlay invisible
      pin.overlay.setPosition(undefined);
    } else {
      // Log error
      // TODO: alert("no map feature to remove!");
    }
  };

  /**
   * Removes a pin.
   * @param pinIndex The index of the pin.
   * @param chapterIndex The chapter index of the pin.
   */
  svc.removePinByIndex = (pinIndex, chapterIndex) => {
    const pin = svc.pins[stateSvc.getChapterIndex()][pinIndex];
    svc.mRemoveStorypin(pin);
    // Remove pin from list:
    svc.pins[chapterIndex].splice(pinIndex, 1);
    PubSub.publish("pin-removed", chapterIndex);
  };

  /**
   * Builds a JSON object of all the StoryPins.
   * @returns {Array} An array of StoryPins.
   */
  svc.getPinsJSON = () => {
    const pinList = [];
    let chapterCount = 0;
    // Loop chapters.
    svc.pins.forEach(chapter => {
      if (chapter) {
        chapter.forEach(pin => {
          pinList.push({
            chapterIndex: chapterCount,
            title: pin.title,
            content: pin.content,
            latitude: pin.coords[0],
            longitude: pin.coords[1],
            media: pin.media,
            startTime: pin.startTime,
            endTime: pin.endTime,
            inMap: pin.inMap,
            inTimeline: pin.inTimeline
          });
        });
      } else {
        // TODO: alert("bad chapter!");
      }

      chapterCount += 1;
    });
    return pinList;
  };

  /**
   * Triggered when the user presses OK on the StoryPin Bulk Upload dialog window.
   */
  svc.processCSVFile = () => {
    const selectedFile = document.getElementById("bulk_pin_csv_file").files[0];
    if (selectedFile) {
      svc.createPinsWithCSV(selectedFile);
    } else {
      // TODO: alert("No file selected!");
    }
  };

  /**
   * This defines the style for each StoryPin.
   * This function is supposed to be passed to the Layer that contains them.
   * @param feature The storypin.mapFeature
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
  svc.startDragInteraction = features => {
    const map = MapManager.storyMap.getMap();
    // Remove previous interaction
    if (svc.dragControl !== null) {
      map.removeInteraction(svc.dragControl);
      svc.dragControl = null;
    }
    // Save old interactions
    svc.oldInteractions = map.getInteractions();
    svc.dragControl = new ol.interaction.Modify({
      features: new ol.Collection(features)
    });
    map.addInteraction(svc.dragControl);
  };

  /**
   * The user is Done moving the StoryPin
   */
  svc.stopDragInteraction = () => {
    const map = MapManager.storyMap.getMap();
    if (svc.dragControl !== null) {
      map.removeInteraction(svc.dragControl);
      svc.dragControl = null;
    }
    // Restore old interactions
    svc.oldInteractions.forEach(interaction => {
      map.addInteraction(interaction);
    });
  };

  /**
   * When the user clicks on save it will reflect his changes on the map.
   */
  svc.onStoryPinSave = () => {
    if (svc.isDrawing) {
      // TODO: alert("Finish moving StoryPin first!");
      return;
    }

    // Update information from features, and remove form map.
    svc.getPins(stateSvc.getChapterIndex()).forEach(pin => {
      svc.mRemoveStorypin(pin);
    });

    // Remove the old layer
    const map = MapManager.storyMap.getMap();
    map.removeLayer(svc.vectorLayer);
    svc.pinLayerSource = null;
    svc.vectorLayer = null;

    // Add to the map with the new info.
    svc.getPins(stateSvc.getChapterIndex()).forEach(pin => {
      // Todo: Set coordinates properly
      // pin.coords = pin.mapFeature.getGeometry().getCoordinates();
      svc.mShowPinOnMap(pin);
    });

    // Save to state service
    const featureCollections = [];

    for (let i = 0; i < svc.pins.length; i += 1) {
      featureCollections.push({
        type: "FeatureCollection",
        features: []
      });
      for (let p = 0; p < svc.pins[i].length; p += 1) {
        featureCollections[i].features.push({
          type: "Feature",
          id: svc.pins[i][p].id,
          geometry: {
            type: "Point",
            coordinates: [svc.pins[i][p].coords[0], svc.pins[i][p].coords[1]]
          },
          properties: {
            inMap: svc.pins[i][p].inMap,
            inTimeline: svc.pins[i][p].inTimeline,
            autoShow: svc.pins[i][p].autoShow,
            media: svc.pins[i][p].media,
            start_time: svc.pins[i][p].startTime,
            end_time: svc.pins[i][p].endTime,
            title: svc.pins[i][p].title,
            content: svc.pins[i][p].content
          }
        });
      }
    }
    stateSvc.setStoryPinsToConfig(featureCollections);
  };

  /**
   * Handles the CSV Uploaded data and converts it to actual pins on the map.
   * @param results The data results from the upload.
   * @returns {Array} An array of created StoryPins.
   */
  svc.onBulkPinComplete = results => {
    const pinArray = [];
    results.data.forEach(element => {
      const pin = svc.createNewPin(
        {
          title: element.title,
          startTime: element.startTime,
          endTime: element.endTime,
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
      pin.inMap = element.inMap || true;
      pin.inTimeline = element.inTimeline || true;
      pinArray.push(pin);
    });

    svc.pins[stateSvc.getChapterIndex()].push();
    svc.onStoryPinSave();
    return pinArray;
  };

  /**
   * Starts the downloading of a CSV file.
   * Creates a hidden element with the file as a URI and clicks it to start the download.
   * @param pinArray
   */
  svc.downloadCSV = pinArray => {
    // Convert the pins to CSV
    let data = svc.exportPinsToCSV(pinArray);
    if (!data.match(/^data:text\/csv/i)) {
      data = `data:text/csv;charset=utf-8,${data}`;
    }
    window.open(encodeURI(data));
  };

  /**
   * Exoports the current chapter's storypins into comma separated values (CSV).
   * @param pinArray
   * @returns {""} An array of objects in CSV format.
   */
  svc.exportPinsToCSV = pinArray => {
    const csvObjects = []; // Holds objects with the CSV format

    pinArray.forEach(pin => {
      const csvPin = {};
      csvPin.title = pin.title;
      csvPin.content = pin.content;
      csvPin.media = pin.media;
      csvPin.startTime = pin.startTime;
      csvPin.endTime = pin.endTime;
      const coords = pin.mapFeature.getGeometry().getCoordinates();
      csvPin.latitude = coords[0];
      csvPin.longitude = coords[1];
      csvPin.inMap = pin.inMap;
      csvPin.inTimeline = pin.inTimeline;
      csvObjects.push(csvPin);
    });

    // Convert to CSV using Papa.
    return Papa.unparse(csvObjects);
  };

  /**
   * This reacts to the timepicker being changed.
   * TODO: Implement this.
   */
  svc.onChangedTime = () => {};

  /**
   * Whitelist.
   * @param url
   * @returns {boolean}
   */
  svc.isWhitelist = url => {
    let allowed = false;

    // Loop whitelist and check if it is ok.
    svc.whitelist.forEach(regexExpr => {
      if (url.match(regexExpr)) {
        allowed = true;
      }
    });

    return allowed;
  };

  /**
   * Cleans the url to be used inside the embeded div.
   * @param url the url to be cleaned.
   */
  svc.checkWhitelist = url => {
    if (svc.isUrl(url)) {
      // Whitelist
      if (svc.isWhitelist(url)) {
        return url;
      }
      // TODO: Alert the user here
      return "";
    }
    return "";
  };

  PubSub.subscribe("updateStorypins", (event, chapters) => {
    chapters.forEach((chapter, chapterIndex) => {
      chapter.storypins.forEach((pinJSON, pinIndex) => {
        const geomObj = JSON.parse(pinJSON.the_geom);

        const startDateObj = pinJSON.start_time
          ? moment.unix(pinJSON.start_time).toDate()
          : new Date();
        const endDateObj = pinJSON.end_time
          ? moment.unix(pinJSON.end_time).toDate()
          : new Date();

        const pin = svc.createNewPin(
          {
            title: pinJSON.title,
            startTime: startDateObj,
            endTime: endDateObj,
            geometry: {
              coordinates: geomObj.coordinates
            }
          },
          chapterIndex,
          geomObj.coordinates[0],
          geomObj.coordinates[1]
        );
        pin.content = pinJSON.content || "";
        pin.media = pinJSON.media || "";
        pin.inMap = pinJSON.inMap || true;
        pin.inTimeline = pinJSON.inTimeline || true;
        pin.indexID = pinIndex;
        // TODO: Fix these dates
        pin.startTime = startDateObj;
        pin.endTime = endDateObj;
        // Set the id from the server.
        if (!pinJSON.id) {
          // TODO: log("this json doesnt have an id for the storypin");
        } else {
          pin.id = pinJSON.id;
        }
        pin.show();
      });
    });
    svc.onStoryPinSave();
  });

  PubSub.subscribe(
    "changingChapter",
    (event, currentChapterIndex, nextChapterIndex) => {
      const currentPins = svc.getPins(currentChapterIndex);
      const nextPins = svc.getPins(nextChapterIndex);
      const map = MapManager.storyMap.getMap();

      // Remove previous chapter
      currentPins.forEach(pin => {
        svc.mRemoveStorypin(pin);
      });

      map.removeLayer(svc.vectorLayer);
      svc.pinLayerSource = null;
      svc.vectorLayer = null;

      // // Add the new pins:
      nextPins.forEach(pin => {
        svc.mShowPinOnMap(pin);
      });
    }
  );

  /**
   * This event gets triggered once the server has saved a new storypin.
   * @event  *Obj* The event that triggered this callback
   * @idArray *[]* An array of ids for each storypin created on the server.
   * */
  PubSub.subscribe("loadids", (event, idArray, chapterID) => {
    // Sometimes we get a null idArray.
    if (!idArray) {
      // TODO: log("Received a null ID Array from the server");
      return;
    }
    // Look for the next null id and assign it.
    idArray.forEach(newPinId => {
      let wasThisIDUsed = false;
      svc.pins[chapterID].forEach(pin => {
        if (wasThisIDUsed) {
          return;
        }
        if (!pin.id) {
          pin.id = newPinId;
          wasThisIDUsed = true;
        }
      });
    });
  });

  /**
   * Removes a storypin and it's overlay from the map.
   * @param pin
   * @private
   */
  svc.mRemoveStorypin = pin => {
    if (pin.mapFeature && svc.pinLayerSource) {
      svc.pinLayerSource.removeFeature(pin.mapFeature);
    }
    svc.destroyOverlay(pin);
    pin.overlay = null;
    pin.mapFeature = null;
  };

  svc.mShowPinOnMap = pin => {
    svc.addStorypinToMap(pin);
    if (!pin.overlay) {
      // TODO: alert("No Overlay present!");
    }
    pin.overlay.setPosition(pin.coords);
  };

  svc.addSelectInteraction = features => {
    const map = MapManager.storyMap.getMap();
    const selectInteraction = new ol.interaction.Select({
      features: new ol.Collection(features)
    });
    map.addInteraction(selectInteraction);
    selectInteraction.on("select", e => {
      // TODO: For debugging only, remove this later.
      // alert(`selected ${  e.target.getFeatures().getLength()}`);
    });
  };

  // For Date selection widgets
  svc.dt = new Date(); // The DT
  svc.startDatePopup = {
    opened: false // Controlls open/close of popup
  };
  svc.endDatePopup = {
    opened: false
  };

  svc.formats = ["dd-MMMM-yyyy", "yyyy/MM/dd", "dd.MM.yyyy", "shortDate"];
  svc.format = svc.formats[0];
  svc.altInputFormats = ["M!/d!/yyyy"];
  svc.inlineOptions = {
    customClass: svc.getDayClass,
    minDate: new Date(1200, 1, 1),
    showWeeks: true
  };

  svc.dateOptions = {
    dateDisabled: svc.disabled,
    formatYear: "yy",
    maxDate: new Date(2020, 5, 22),
    minDate: new Date(1200, 1, 1),
    startingDay: 1
  };

  svc.disabled = data => {
    const date = data.date;
    const mode = data.mode;
    return mode === "day" && (date.getDay() === 0 || date.getDay() === 6);
  };

  /**
   * Sets current date to today.
   */
  svc.today = () => {
    svc.dt = new Date();
  };

  /**
   * Clears the date.
   */
  svc.clear = () => {
    svc.dt = null;
  };

  /**
   * Opens the start date popup
   */
  svc.openStartDate = () => {
    svc.startDatePopup.opened = true;
  };

  /**
   * Opens the end date popup
   */
  svc.openEndDate = () => {
    svc.endDatePopup.opened = true;
  };

  svc.setDate = (year, month, day) => {
    svc.dt = new Date(year, month, day);
  };

  svc.activePin = null;

  svc.togglePinForm = $index => {
    const i = $index.$index;
    if (svc.activePin === i) {
      svc.activePin = null;
    } else {
      svc.activePin = i;
    }
  };

  return svc;
}

module.exports = pinSvc;
