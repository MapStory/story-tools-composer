import Papa from "papaparse"; // Used for CSV Parsing
import moment from "moment"; // For time and dates
import PubSub from "pubsub-js"; // For event handling
import whiteListRegex from "./whiteListRegex";
import Pin from "./Pin";

/**
 * StoryPin Service.
 * All things StoryPins.
 *
 * @param $translate .
 * @param timeSvc .
 * @param stateSvc .
 * @param MapManager .
 * @param $uibModal .
 * @returns {{}} pinSvc.
 */
function pinSvc($translate, timeSvc, stateSvc, MapManager, $uibModal) {
  const svc = {}; // this
  // The collection of pins
  svc.pins = [[]];
  // The current Pin being edited
  svc.currentPin = null;
  // For Drag functionality:
  svc.isDrawing = false;
  svc.dragControl = null;
  // This is the openlayers source that stores all the features that are drawn on the map.
  svc.pinLayerSource = null;
  svc.oldInteractions = [];

  /**
   * Get pins from the current chapter
   * @returns {Array|*} An array of Pins
   */
  svc.getCurrentPins = () => {
    if (!stateSvc.getConfig()) {
      return false;
    }
    return stateSvc.getConfig().chapters[stateSvc.getChapterIndex()].pins;
  };

  svc.getPinsByChapterIndex = i => {
    const cfg = stateSvc.getConfig().chapters[i];
    return cfg.pins;
  };

  svc.availableDisplayCoordinates = [
    { display: "Decimal Degrees", value: "dd" },
    { display: "Degrees Minutes Seconds", value: "dms" }
  ];
  svc.displayCoordinates = "dd";
  // Media whitelist
  svc.whitelist = whiteListRegex;

  svc.Pin = Pin;

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
    "autoShow",
    "autoPlay",
    "playLength",
    "offset"
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
    "autoShow",
    "autoPlay",
    "playLength",
    "offset"
  ];

  /**
   * Get pins from chapter index
   * @param chapterIndex The chapter
   * @returns {Array|*} An array of Pins
   */
  svc.getPins = chapterIndex => svc.getCurrentPins() || [];

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
    svc.getPinsByChapterIndex(chapterIndex).push(storyPin);
    return storyPin;
  };

  // @ TODO: move to another service
  svc.isUrl = str => {
    if (!/^(f|ht)tps?:\/\//i.test(str)) {
      return false;
    }
    return true;
  };

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
    pin.indexID = svc.getCurrentPins().length - 1;
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
    const pin = svc.getCurrentPins()[index];
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
    /*
      The extra values added to the height and width are based on the css
      rules for .storypin-overlay
    */
    element.setAttribute(
      "style",
      `max-width: calc(${pin.boxWidth +
        20}px + 0.45em); max-height: calc(${pin.boxHeight + 40}px + 0.45em);`
    );

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
        const whitelistObj = svc.getWhitelistObject(pin.media);
        if (whitelistObj != null) {
          if (whitelistObj.isImage) {
            const imgDiv = document.createElement("div");
            const img = document.createElement("img");
            img.setAttribute("src", pin.media);
            if (pin.boxWidth && pin.boxHeight) {
              // Set custom box sizes
              img.setAttribute("width", `${pin.boxWidth}px`);
              img.setAttribute("height", `${pin.boxHeight}px`);
            } else {
              // Use a default size
              img.setAttribute("height", "200px");
            }
            imgDiv.appendChild(img);
            element.appendChild(imgDiv);
          } else {
            pin.embeddedMedia = document.createElement("iframe");
            pin.embeddedMedia.setAttribute("src", pin.media);
            element.appendChild(pin.embeddedMedia);

            if (pin.boxWidth && pin.boxHeight) {
              // Set custom box sizes
              pin.embeddedMedia.setAttribute("width", `${pin.boxWidth}px`);
              pin.embeddedMedia.setAttribute("height", `${pin.boxHeight}px`);
            }
          }
        }
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
    if (svc.getCurrentPins().indexOf(pin) > -1) {
      svc.createPinOverlay(pin);
    }

    // Add functionality for the pin to show and hide itself from the map:
    pin.show = () => {
      if (!pin.overlay.getPosition()) {
        const whitelistObj = svc.getWhitelistObject(pin.media);
        if (pin.embeddedMedia && whitelistObj && !whitelistObj.isImage) {
          if (stateSvc.timelineSettings.loop !== "none" && pin.autoPlay) {
            pin.embeddedMedia.setAttribute("allow", "autoplay;");
            pin.embeddedMedia.setAttribute(
              "src",
              `${pin.media}?autoplay=1&start=${pin.offset}`
            );
            PubSub.publish("mediaPause");
            pin.windowTimeout = window.setTimeout(() => {
              PubSub.publish("mediaContinue");
            }, pin.playLength * 1000);
            let firstRangeChange = true;

            // If the range changes while we're playing the video reset it rather
            // then keep playing with the pin not showing because either the user
            // clicked play or changed the slider
            pin.rangeListener = PubSub.subscribe("rangeChange", () => {
              if (
                pin.embeddedMedia &&
                whitelistObj &&
                !whitelistObj.isImage &&
                !firstRangeChange
              ) {
                pin.embeddedMedia.removeAttribute("allow");
                pin.embeddedMedia.setAttribute(
                  "src",
                  `${pin.media}?start=${pin.offset}`
                );
                PubSub.unsubscribe(pin.rangeListener);
                window.clearTimeout(pin.windowTimeout);
              } else {
                firstRangeChange = false;
              }
            });
          } else {
            pin.embeddedMedia.removeAttribute("allow");
            pin.embeddedMedia.setAttribute(
              "src",
              `${pin.media}?start=${pin.offset}`
            );
          }
        }
      }
      pin.mapFeature.set("visible", true);
      pin.overlay.setPosition(pin.mapFeature.getGeometry().getCoordinates());
    };

    pin.hide = () => {
      pin.overlay.setPosition(undefined);
      pin.mapFeature.set("visible", false);
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
    PubSub.publish("pinAdded");


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
   * Removes a pin.
   * @param pinIndex The index of the pin.
   * @param chapterIndex The chapter index of the pin.
   */
  svc.removePinByIndex = (pinIndex, chapterIndex) => {
    const pin = svc.getCurrentPins()[pinIndex];
    svc.mRemoveStorypin(pin);
    if (pin.id) {
      stateSvc
        .getConfig()
        .chapters[stateSvc.getChapterIndex()].removedPins.push(pin.id);
    }
    svc.getCurrentPins().splice(pinIndex, 1);
    PubSub.publish("pin-removed", chapterIndex);
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
  svc.getStyle = (feature) => {
    if (!feature.get("visible")) {
      return [];
    }
    return [new ol.style.Style({
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
    })];
  };

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
    if (svc.isDrawing || !svc.getPins(stateSvc.getChapterIndex()).forEach) {
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
      pin.hide();
    });

    // Save to state service
    const featureCollections = [];

    for (let i = 0; i < svc.pins.length; i += 1) {
      featureCollections.push({
        type: "FeatureCollection",
        features: []
      });
      for (let p = 0; p < svc.pins[i].length; p += 1) {
        const properties = {
          inMap: svc.pins[i][p].inMap,
          inTimeline: svc.pins[i][p].inTimeline,
          autoShow: svc.pins[i][p].autoShow,
          media: svc.pins[i][p].media,
          title: svc.pins[i][p].title,
          content: svc.pins[i][p].content,
          offset: svc.pins[i][p].offset
        };
        properties.startTime = svc.pins[i][p].startTime;
        properties.endTime = svc.pins[i][p].endTime;
        properties.playLength = svc.pins[i][p].playLength;
        properties.autoPlay = !!svc.pins[i][p].autoPlay;
        featureCollections[i].features.push({
          type: "Feature",
          id: svc.pins[i][p].id,
          geometry: {
            type: "Point",
            coordinates: [svc.pins[i][p].coords[0], svc.pins[i][p].coords[1]]
          },
          properties
        });
      }
    }
    stateSvc.setStoryPinsToConfig(featureCollections);
    PubSub.publish("pinAdded");
  };

  /**
   * Handles the CSV Uploaded data and converts it to actual pins on the map.
   * @param results The data results from the upload.
   * @returns {Array} An array of created StoryPins.
   */
  svc.onBulkPinComplete = results => {
    const map = MapManager.storyMap.getMap();
    const pinArray = [];
    results.data.forEach(element => {
      // Openlayers treats coords as [lon, lat]
      const [lon, lat] = ol.proj.transform(
        [element.longitude, element.latitude],
        "EPSG:4326",
        map.getView().getProjection(),
      );
      const pin = svc.createNewPin(
        {
          title: element.title,
          startTime: element.startTime,
          endTime: element.endTime,
          geometry: {
            coordinates: [lon, lat]
          }
        },
        stateSvc.getChapterIndex(),
        lon,
        lat,
      );
      pin.content = element.content || "";
      pin.media = element.media || "";
      pin.inMap = element.inMap || true;
      pin.inTimeline = element.inTimeline || true;
      pinArray.push(pin);
    });

    svc.getCurrentPins().push();
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
   * Exports the current chapter's storypins into comma separated values (CSV).
   * @param pinArray
   * @returns {""} An array of objects in CSV format.
   */
  svc.exportPinsToCSV = pinArray => {
    const map = MapManager.storyMap.getMap();
    const csvObjects = []; // Holds objects with the CSV format

    pinArray.forEach(pin => {
      const csvPin = {};
      csvPin.title = pin.title;
      csvPin.content = pin.content;
      csvPin.media = pin.media;
      csvPin.startTime = pin.startTime;
      csvPin.endTime = pin.endTime;
      // Openlayers treats coords as [lon, lat]
      const [lon, lat] = ol.proj.transform(
        pin.mapFeature.getGeometry().getCoordinates(),
        map.getView().getProjection(),
        "EPSG:4326"
      );
      csvPin.latitude = lat;
      csvPin.longitude = lon;
      csvPin.inMap = pin.inMap;
      csvPin.inTimeline = pin.inTimeline;
      csvObjects.push(csvPin);
    });

    // Convert to CSV using Papa.
    return Papa.unparse(csvObjects);
  };

  /**
   * Whitelist.
   * @param url
   * @returns {boolean}
   */
  svc.isWhitelist = url => {
    let allowed = false;
    // Loop whitelist and check if it is ok.
    svc.whitelist.forEach(regexExpr => {
      if (url && url.match(regexExpr.regex)) {
        allowed = true;
      }
    });

    return allowed;
  };

  svc.getWhitelistObject = url => {
    let foundObj = null;

    // Loop whitelist and check if it is ok.
    svc.whitelist.forEach(regexExpr => {
      if (url && url.match(regexExpr.regex)) {
        foundObj = { url, isImage: regexExpr.isImage };
      }
    });
    return foundObj;
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

        pin.autoPlay = pinJSON.auto_play;
        pin.offset = pinJSON.offset;
        pin.playLength = pinJSON.play_length;
        // TODO: Fix these dates
        pin.startTime = startDateObj;
        pin.endTime = endDateObj;
        // Set the id from the server.
        if (!pinJSON.id) {
          // TODO: log("this json doesnt have an id for the storypin");
        } else {
          pin.id = pinJSON.id;
        }
      });
    });
    svc.onStoryPinSave();
  });

  /**
   * Callback for changing chapters
   */
  PubSub.subscribe("changingChapter", (event, data) => {
    const oldChapterIndex = data.previousChapterIndex;
    const nextChapterIndex = data.currentChapterIndex;
    if (
      nextChapterIndex === null ||
      nextChapterIndex === undefined ||
      oldChapterIndex === null ||
      oldChapterIndex === undefined
    )
      return;
    const currentPins = svc.getPinsByChapterIndex(oldChapterIndex);
    const nextPins = svc.getPinsByChapterIndex(nextChapterIndex);
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

    // Refresh the things
    svc.onStoryPinSave();
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

  svc.activePin = null;

  return svc;
}

module.exports = pinSvc;
