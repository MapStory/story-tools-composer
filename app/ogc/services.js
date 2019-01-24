/* eslint no-underscore-dangle: 0 */

let featureInfoPerLayer_ = [];
// valid values: 'layers', 'layer', 'feature', or ''
let state_ = "";
let selectedItem_ = null;
let selectedItemMedia_ = null;
let selectedLayer_ = null;
let selectedItemProperties_ = null;
let position_ = null;
const enabled_ = true;
let containerInstance_ = null;
let overlay_ = null;
let rootScope_;
let service_;
let mapService_;
let configService_;


function registerOnMapClick($rootScope, $compile) {
  mapService_.getMap().on("singleclick", (evt) => {
    // Overlay clones the element so we need to compile it after it is cloned so that ng knows about it
    if (!goog.isDefAndNotNull(containerInstance_)) {
      containerInstance_ = mapService_
        .getMap()
        .getOverlays()
        .array_[0].getElement();
      $compile(containerInstance_)($rootScope);
    }

    service_.hide();
    featureInfoPerLayer_ = [];
    selectedItem_ = null;
    selectedItemMedia_ = null;
    selectedItemProperties_ = null;
    state_ = null;

    const infoPerLayer = [];
    // Attempt to find a marker from the planningAppsLayer
    const view = mapService_.getMap().getView();
    const layers = mapService_.getStoryLayers().getArray();
    let validRequestCount = 0;
    let completedRequestCount = 0;

    goog.array.forEach(layers, (layer) => {
      const source = layer.getLayer().getSource();
      if (goog.isDefAndNotNull(source.getGetFeatureInfoUrl)) {
        validRequestCount += 1;
      }
    });
    // This function is called each time a get feature info request returns (call is made below).
    // when the completedRequestCount == validRequestCount, we can display the popup
    const getFeatureInfoCompleted = () => {
      completedRequestCount += 1;

      if (completedRequestCount === validRequestCount) {
        if (infoPerLayer.length > 0) {
          const clickPosition_ = evt.coordinate;
          service_.show(infoPerLayer, clickPosition_);
        }
      } else {
        service_.hide();
        selectedItem_ = null;
        selectedItemMedia_ = null;
        selectedItemProperties_ = null;
        state_ = null;
        featureInfoPerLayer_ = [];
      }
    };

    goog.array.forEach(layers, (layer, index) => {
      const source = layer.getLayer().getSource();

      if (goog.isDefAndNotNull(source.getGetFeatureInfoUrl)) {
        const url = source.getGetFeatureInfoUrl(
          evt.coordinate,
          view.getResolution(),
          view.getProjection(),
          {
            INFO_FORMAT: "application/json",
            FEATURE_COUNT: 5
          }
        );

          // Local Mod for testing
          // url = url.split('https://mapstory.org')[1];

        fetch(url).then(
          rawResponse => {
            if (!rawResponse.ok) {
              getFeatureInfoCompleted();
              return;
            }
            rawResponse.json().then(response => {
              const layerInfo = {};
              layerInfo.features = response.features;

              if (
                layerInfo.features &&
                  layerInfo.features.length > 0 &&
                  goog.isDefAndNotNull(layers[index])
              ) {
                layerInfo.layer = layers[index];
                goog.array.insert(infoPerLayer, layerInfo);
              }
              getFeatureInfoCompleted();
            });
          },
          () => {
            getFeatureInfoCompleted();
          }
        );
      }
    });
  });
}

export default function stFeatureInfoService() {
  this.$get = ($rootScope, MapManager, $compile) => {
    rootScope_ = $rootScope;
    service_ = this;
    mapService_ = MapManager.storyMap;
    // translate_ = $translate;
    registerOnMapClick($rootScope, $compile);

    overlay_ = new ol.Overlay({
      insertFirst: false,
      element: document.getElementById("popup_test")
    });

    mapService_.getMap().addOverlay(overlay_);

    rootScope_.$on("rangeChange", (evt, layer) => {
      if (goog.isDefAndNotNull(service_.getSelectedLayer())) {
        service_.hide();
      }
    });

    return this;
  };

  function classifyItem(item) {
    let type = "";

    if (goog.isDefAndNotNull(item)) {
      if (item.properties) {
        type = "feature";
      } else if (item.features) {
        type = "layer";
      } else if (item.length && item[0].features) {
        type = "layers";
      }
    }
    return type;
  }

  this.show = (item, position) => {
    // if item is not specified, return
    if (!goog.isDefAndNotNull(item)) {
      return false;
    }

    const selectedItemOld = selectedItem_;

    // classify the item parameter as a layer, feature, or layers
    const type = classifyItem(item);

    // when there is nothing in featureInfoPerLayer_, we need to used the passed in item to initialize it
    // this is done when the user clicks on a single feature (on the map) vice selecting a feature from the pop-up
    // (such as clicking on overlapping features)
    if (featureInfoPerLayer_.length === 0) {
      if (type === "feature") {
        featureInfoPerLayer_.push({
          features: [item],
          layer: selectedLayer_
        });
      } else if (type === "layer") {
        featureInfoPerLayer_.push(item);
      } else if (type === "layers") {
        featureInfoPerLayer_ = item;
      } else {
        const err = new Error();
        err.name = "featureInfoBox";
        err.level = "High";
        err.message = "Expected layers, layer, or feature.";
        err.toString = () => `${err.name  }: ${ err.message}`;
        throw err;
      }
    }

    // set the service's state_ variable (feature, layer, or layers)
    // the state is 'layer' when the user clicks on multiple (aka overlapping) features in a single layer
    // the state is 'layers' when the user clicks on multiple (overlapping) features that exist in separate layers
    // the state is 'feature' when the user finishes creating a feature, they clicked on a single (non-overlapping)
    // feature, or they select a feature from the deconfliction pop-up

    // we are also going to set the selectedItem_ variable
    // the selectedItem will be a single feature, a single layer, or a collection of layers
    // the state is essentially a designation of the selectedItem type
    if (type === "feature") {
      state_ = "feature";
      selectedItem_ = item;
    } else if (type === "layer") {
      if (item.features.length === 1) {
        state_ = "feature";
        selectedItem_ = item.features[0];
      } else {
        state_ = "layer";
        selectedItem_ = item;
      }
    } else if (type === "layers") {
      if (item.length === 1) {
        if (item[0].features.length === 1) {
          state_ = "feature";
          selectedItem_ = item[0].features[0];
        } else {
          state_ = "layer";
          selectedItem_ = item[0];
        }
      } else {
        state_ = "layers";
        selectedItem_ = item;
      }
    } else {
      const err = new Error();
      err.name = "featureInfoBox";
      err.level = "High";
      err.message = "Invalid item passed in. Expected layers, layer, or feature.";
      err.toString = () => `${err.name  }: ${ err.message}`;
      throw err;
    }
    // ---- if selected item changed
    if (selectedItem_ !== selectedItemOld) {
      // -- select the geometry if it is a feature, clear otherwise
      // -- store the selected layer of the feature
      if (classifyItem(selectedItem_) === "feature") {
        selectedLayer_ = this.getSelectedItemLayer().layer;

        // -- update selectedItemProperties_ to contain the props from the newly selected item
        const tempProps = {};
        const props = [];

        // if the selectedItem_ is a feature go through and collect the properties in tempProps
        // if the property is a media property (like photo or video), we need to parse out
        // the value into an array (since there may be multiple photos or videos)
        goog.object.forEach(selectedItem_.properties, (v, k) => {
          tempProps[k] = [k, v];
        });

        Object.keys(tempProps).forEach((propName) => {
          props.push(tempProps[propName]);
        });
        selectedItemProperties_ = props;
      }
    }

    if (goog.isDefAndNotNull(position)) {
      position_ = position;
      mapService_
        .getMap()
        .getOverlays()
        .array_[0].setPosition(position_);
    }
    return true;
  };

  this.getSelectedItemLayer = () => {
    for (let i = 0; i < featureInfoPerLayer_.length; i++) {
      for (let j = 0; j < featureInfoPerLayer_[i].features.length; j++) {
        if (featureInfoPerLayer_[i].features[j].id === selectedItem_.id) {
          return featureInfoPerLayer_[i];
        }
      }
    }
    return null;
  };

  this.showPreviousState = () => {
    // Note: might want to get position and pass it in again
    this.show(this.getPreviousState().item);
  };

  this.getPreviousState = function() {
    let state = null;
    let item = null;

    if (state_ === "feature") {
      const layer = this.getSelectedItemLayer();
      if (layer) {
        if (layer.features.length > 1) {
          state = "layer";
          item = layer;
        } else if (
          layer.features.length === 1 &&
            featureInfoPerLayer_.length > 1
        ) {
          item = featureInfoPerLayer_;
          state = "layers";
        }
      } else {
        throw {
          name: "featureInfoBox",
          level: "High",
          message: "Could not find feature!",
          toString() {
            return `${this.name  }: ${  this.message}`;
          }
        };
      }
    } else if (state_ === "layer") {
      if (featureInfoPerLayer_.length > 1) {
        state = "layers";
        item = featureInfoPerLayer_;
      }
    }

    if (item !== null) {
      return {
        state,
        item
      };
    }

    return "";
  };

  this.getState = () => {
    return state_;
  };

  this.getSelectedItem = () => {
    return selectedItem_;
  };

  this.getMediaUrl = (mediaItem) => {
    let url = mediaItem;
    // if the item doesn't start with 'http' then assume the item can be found in the fileservice and so convert it to
    // a url. This means if the item is, say, at https://mysite.com/mypic.jpg, leave it as is
    if (goog.isString(mediaItem) && mediaItem.indexOf("http") === -1) {
      url = configService_.configuration.fileserviceUrlTemplate.replace(
        "{}",
        mediaItem
      );
    }
    return url;
  };

  this.getSelectedItemMedia = function() {
    return selectedItemMedia_;
  };

  // Warning, returns new array objects, not to be 'watched' / bound. use getSelectedItemMedia instead.
  this.getSelectedItemMediaByProp = function(propName) {
    let media = null;

    if (
      classifyItem(selectedItem_) === "feature" &&
        goog.isDefAndNotNull(selectedItem_) &&
        goog.isDefAndNotNull(selectedItemProperties_)
    ) {
      goog.object.forEach(selectedItemProperties_, (prop, index) => {
        if (service_.isMediaPropertyName(prop[0])) {
          if (!goog.isDefAndNotNull(propName) || propName === prop[0]) {
            if (!goog.isDefAndNotNull(media)) {
              // TODO: media should no longer be objects
              media = [];
            }

            goog.object.forEach(prop[1], (mediaItem) => {
              media.push(mediaItem);
            });
          }
        }
      });
    }

    return media;
  };

  this.isMediaPropertyName = function(name) {
    const lower = name.toLowerCase();
    return (
      lower.indexOf("fotos") === 0 ||
        lower.indexOf("photos") === 0 ||
        lower.indexOf("audios") === 0 ||
        lower.indexOf("videos") === 0
    );
  };

  this.getMediaTypeFromPropertyName = function(name) {
    const lower = name.toLowerCase();
    let type = null;
    if (lower.indexOf("fotos") === 0 || lower.indexOf("photos") === 0) {
      type = "photos";
    } else if (lower.indexOf("audios") === 0) {
      type = "audios";
    } else if (lower.indexOf("videos") === 0) {
      type = "videos";
    }
    return type;
  };

  // Supported video formats isn't defined anywhere, so we're just going to return the media item
  this.getMediaUrlThumbnail = (mediaURL) => mediaURL;

  this.getMediaUrlDefault = () => "/static/maploom/assets/media-default.png";

  this.getMediaUrlError = () => "/static/maploom/assets/media-error.png";

  this.getSelectedItemProperties = () => selectedItemProperties_;

  // this method is intended for unit testing only
  this.setSelectedItemProperties = (props) => {
    selectedItemProperties_ = props;
  };

  this.getSelectedLayer = () => selectedLayer_;

  this.getPosition = () => position_;

  this.getEnabled = () => enabled_;

  this.hide = () => {
    selectedItem_ = null;
    selectedItemMedia_ = null;
    selectedItemProperties_ = null;
    state_ = null;
    featureInfoPerLayer_ = [];
    mapService_
      .getMap()
      .getOverlays()
      .array_[0].setPosition(undefined);
  };
}