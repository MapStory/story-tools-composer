import PubSub from "pubsub-js";
import MinimalConfig from "app/state/MinimalConfig";
import headerSvc from "app/ui/headerSvc";
import locationSvc from "app/ui/locationSvc";
import configSvc from "app/state/configSvc";

export default function stateSvc() {
  stateSvc.currentChapter = null;
  stateSvc.previousChapter = null;
  stateSvc.originalConfig = null;
  stateSvc.config = null;
  stateSvc.frameSettings = null;
  stateSvc.timelineSettings = {
    loop: "none",
    state: "stopped"
  };

  PubSub.subscribe("stateChange", (event, data) => {
    stateSvc.timelineSettings.loop = data.loop;
    stateSvc.timelineSettings.state = data.state;
  });

  stateSvc.addNewChapter = () => {
    const newChapter = configSvc.generateChapterConfig(
      stateSvc.config.chapters.length + 1
    );
    stateSvc.config.chapters.push(newChapter);
    PubSub.publish("chapterCreated", newChapter.index);
  };

  stateSvc.removeChapter = chapterId => {
    const index = chapterId - 1;
    if (stateSvc.config.chapters[index].mapId) {
      stateSvc.config.removedChapters.push(stateSvc.config.chapters[index].mapId);
    }
    stateSvc.config.chapters.splice(index, 1);

    for (let i = 0; i < stateSvc.config.chapters.length; i += 1) {
      stateSvc.config.chapters[i].index = i + 1;
    }
  };

  // mutates the input array
  stateSvc.arrayMove = (array, oldIndex, newIndex) => {
    if (newIndex >= array.length) {
      let k = newIndex - array.length;
      while (k) {
        array.push(undefined);
        k -= 1;
      }
    }
    array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    return array; // for testing purposes
  };

  stateSvc.reorderLayer = (from, to) => {
    let arr = [];
    if (stateSvc.config.mapManager) {
      arr = stateSvc.config.mapManager.storyMap
        .getMap()
        .getLayers()
        .getArray();
    }
    stateSvc.arrayMove(stateSvc.config.chapters[stateSvc.getChapterIndex()].layers, from, to);
    stateSvc.arrayMove(
      stateSvc.config.chapters[stateSvc.getChapterIndex()].map.layers,
      from,
      to
    );
    arr.forEach(layer => {
      if (layer.getSource() && layer.getSource().getParams) {
        const layerName = layer.getSource().getParams().LAYERS;
        const zIndex = stateSvc.config.chapters[
          stateSvc.getChapterIndex()
        ].layers.findIndex(item => item.name === layerName);
        layer.setZIndex(zIndex);
      }
    });
  };

  function initializeNewConfig() {
    stateSvc.config = configSvc.getMapstoryConfig();
    window.config = stateSvc.config;
    stateSvc.originalConfig = window.config;
    PubSub.publish("configInitialized");
  }

  stateSvc.initConfig = () => {
    const path = window.location.pathname;
    const mapID = /\/story\/([A-Za-z0-9-_]+)/.exec(path)
      ? /\/story\/([A-Za-z0-9-_]+)/.exec(path)[1]
      : null;
    const mapJsonUrl = Number.isNaN(Number(mapID))
      ? `/api/mapstories/slug/${mapID}`
      : `/api/mapstories/${mapID}`;
    if (mapID && mapID !== "new") {
      $.ajax({
        dataType: "json",
        url: mapJsonUrl
      })
        .done(data => {
          stateSvc.config = configSvc.getMapstoryConfig(data);
          window.config = stateSvc.config;
          stateSvc.originalConfig = data;
          PubSub.publish("configInitialized");
        })
        .fail(() => {
          initializeNewConfig();
        });
    } else {
      initializeNewConfig();
    }
  };

  stateSvc.getConfig = () => stateSvc.config;

  stateSvc.setConfig = config => {
    stateSvc.config = config;
  };

  stateSvc.set = (k, v) => {
    stateSvc.config[k] = v;
  };

  stateSvc.updateCurrentChapterConfig = () => {
    stateSvc.currentChapter = stateSvc.getChapterConfig();
  };

  stateSvc.addLayer = layerOptions => {
    stateSvc.config.chapters[stateSvc.getChapterIndex()].layers.push(layerOptions);
    stateSvc.config.chapters[stateSvc.getChapterIndex()].map.layers.push(layerOptions);
  };

  stateSvc.updateLayerStyle = (layerName, styleName, style) => {
    const chapter = stateSvc.config.chapters[stateSvc.getChapterIndex()];
    const layerCount = chapter.layers.length;
    const layerArray = stateSvc.config.mapManager.storyMap
      .getStoryLayers()
      .getArray();

    for (let i = 0; i < layerCount; i += 1) {
      if (chapter.layers[i].name === layerName) {
        chapter.layers[i].styleName = styleName;
        chapter.layers[i].styleConfig = style;
      }
    }

    layerArray.forEach(layer => {
      if (layer.get("name") === layerName) {
        layer.set("styleName", styleName);
      }
    });
    PubSub.publish("layerUpdated");
  };

  /**
   * Gets storypins and storyframes for the given mapstory id from the server.
   * @param storyID The mapstory id.
   */
  stateSvc.fetchComponentsFromAPI = storyID =>
    fetch(`/api/mapstories/${storyID}`)
      .then(resp => resp.json())
      .then(data => {
        PubSub.publish("updateStorypins", data.chapters);
        PubSub.publish("updateStoryframes", data.chapters);
      });

  /**
   * Event responder for Init has finished.
   */
  PubSub.subscribe("configInitialized", () => {
    // This means we are in a new temp mapstory. No id has been created for this yet.
    if (stateSvc.isTempStory()) {
      // Initialize empty arrays for storypins
      stateSvc.getConfig().storypins = [[]];
    } else {
      // Data should exist for this mapstory. Get saved components from API:
      stateSvc.fetchComponentsFromAPI(stateSvc.getConfig().storyID);
    }
  });

  /**
   * True if this is a temp unsaved mapstory.
   * @returns {boolean} True if this is a temp unsaved mapstory.
   */
  stateSvc.isTempStory = () => {
    if (stateSvc.getConfig().storyID === 0) {
      return true;
    }
    return false;
  };

  // !DJA @TODO: write test
  stateSvc.removeLayer = uuid => {
    const layers = stateSvc.config.chapters[stateSvc.getChapterIndex()].layers;
    for (let i = 0; i < layers.length; i += 1) {
      if (layers[i].uuid === uuid) {
        const index = layers.indexOf(layers[i]);
        if (index > -1) {
          stateSvc.config.chapters[stateSvc.getChapterIndex()].layers.splice(index, 1);
        }
      }
    }
  };

  stateSvc.setStoryframeDetails = copiedFrameSettings => {
    const chapterLookup = {};
    stateSvc.config.frameSettings = [];
    for (let i = 0; i < copiedFrameSettings.length; i += 1) {
      if (!chapterLookup[copiedFrameSettings[i].chapter]) {
        chapterLookup[copiedFrameSettings[i].chapter] = [];
      }

      chapterLookup[copiedFrameSettings[i].chapter].push({
        type: "Feature",
        geometry: null,
        id: copiedFrameSettings[i].id,
        properties: {
          id: copiedFrameSettings[i].id,
          chapter: copiedFrameSettings[i].chapter,
          title: copiedFrameSettings[i].title,
          startTime: copiedFrameSettings[i].startDate,
          endTime: copiedFrameSettings[i].endDate,
          center: [
            [copiedFrameSettings[i].bb1[0], copiedFrameSettings[i].bb1[1]],
            [copiedFrameSettings[i].bb2[0], copiedFrameSettings[i].bb2[1]],
            [copiedFrameSettings[i].bb3[0], copiedFrameSettings[i].bb3[1]],
            [copiedFrameSettings[i].bb4[0], copiedFrameSettings[i].bb4[1]]
          ]
        }
      });
    }

    Object.keys(chapterLookup).forEach(index => {
      const featureCollection = {
        type: "FeatureCollection",
        features: chapterLookup[index]
      };
      stateSvc.config.frameSettings[index] = featureCollection;
    });
    stateSvc.saveStoryframes(stateSvc.config.frameSettings);
  };

  stateSvc.getChapter = () => {
    let chapter = 1;
    const path = locationSvc.path();
    if (path && path.indexOf("/chapter") === 0) {
      const matches = /\d+/.exec(path);
      if (matches !== null) {
        chapter = matches[0];
      }
    }
    return parseInt(chapter, 10);
  };

  stateSvc.getChapterIndex = () => stateSvc.getChapter() - 1;

  stateSvc.getChapterConfig = () => {
    const chapter = stateSvc.getChapter();
    const config = stateSvc.getConfig();
    if (!config) {
      return undefined;
    }
    const i = chapter - 1;
    if (config.chapters && chapter > 0 && chapter <= config.chapters.length) {
      if (config.chapters[i]) {
        return config.chapters[i];
      }
      return config.chapters[0];
    }
    return config;
  };

  stateSvc.updateBaseLayer = baselayer => {
    const layers = stateSvc.config.chapters[stateSvc.getChapterIndex()].map.layers;
    /*
     The first base layer in the config when a map is reloaded will be set as `selected`
    */
    const replacedBaselayer = layers[0];
    let selectedBaseLayerIndex = null;
    for (let i = 0; i < layers.length; i += 1) {
      if (baselayer.name === layers[i].name) {
        selectedBaseLayerIndex = i;
        layers[i].visibility = true;
        layers[i].selected = true;
        layers[0] = layers[selectedBaseLayerIndex];
        layers[selectedBaseLayerIndex] = replacedBaselayer;
      } else {
        layers[i].visibility = false;
        layers[i].selected = false;
      }
    }
  };

  stateSvc.getChapterConfigs = () => {
    const config = stateSvc.getConfig();
    return config.chapters;
  };

  stateSvc.getChapterCount = () => {
    if (!stateSvc.getConfig()) {
      return false;
    }
    return stateSvc.getChapterConfigs() ? stateSvc.getChapterConfigs().length : 0;
  };

  stateSvc.initConfig();

  stateSvc.getCategories = () =>
    fetch("/api/categories/")
      .then(response => response.json())
      .then(data => {
        stateSvc.categories = data.objects;
      });

  stateSvc.getCategories();

  stateSvc.updateLocationUsingStoryId = () => {
    const storyID = stateSvc.getConfig().storyID;
    window.location.href = `/story/${storyID}/draft`;
  };

  stateSvc.onChapterSort = () => {
    // Iterate through the chapters and update their indexes anytime they are sorted
    for (let i = 0; i < stateSvc.config.chapters.length; i += 1) {
      stateSvc.config.chapters[i].index = i + 1;
    }
  };

  stateSvc.save = () =>
    new Promise(res => {
      headerSvc.updateSaveStatus("saving");
      const cfg = new MinimalConfig(stateSvc.config);
      // iterate through feature collections and add them
      // to the corresponding chapters
      for (let i = 0; i < cfg.chapters.length; i += 1) {
        const id = cfg.chapters[i].mapId;
        // ensure key exists even if undefined for server logic
        cfg.chapters[i].mapId = id;
      }

      for (let i = 0; i < stateSvc.config.chapters.length; i += 1) {
        // ensure key exists even if undefined for server logic
        cfg.chapters[i].frames =
          stateSvc.config.storyframes &&
          stateSvc.config.storyframes[i] &&
          stateSvc.config.storyframes[i].features
            ? stateSvc.config.storyframes[i]
            : { features: [] };
      }
      const minimalCfg = {
        storyID: cfg.storyID || "",
        chapters: cfg.chapters,
        about: cfg.about,
        isPublished: cfg.isPublished,
        removedChapters: cfg.removedChapters,
        removedFrames: cfg.removedFrames
      };
      fetch(`/mapstories/save`, {
        method: "POST",
        body: JSON.stringify(minimalCfg),
        headers: {
          "X-CSRFToken": window.mapstory.composer.config.csrfToken
        }
      })
        .then(resp => {
          resp.json().then(data => {
            const stylesToPersist = [];
            for (let i = 0; i < stateSvc.config.chapters.length; i += 1) {
              const id = data.chapters[i].mapId;
              stateSvc.config.chapters[i].id = id;
              stateSvc.config.chapters[i].mapId = id;
              stateSvc.config.chapters[i].removedPins = [];
              stylesToPersist.push(stateSvc.config.chapters[i].layers.flatten());

              for (
                let j = 0;
                j < data.chapters[i].frames.features.length;
                j += 1
              ) {
                stateSvc.config.storyframes[i].features[j].id =
                  data.chapters[i].frames.features[j].id;
              }

              for (let j = 0; j < stateSvc.config.chapters[i].pins.length; j += 1) {
                stateSvc.config.chapters[i].pins[j].id =
                  data.chapters[i].pins.features[j].id;
              }
            }
            if (!stateSvc.config.storyID) {
              stateSvc.set("storyID", data.storyID);
              const promises = stylesToPersist.flatten().map(layer => {
                if (layer.styleName && layer.styleConfig) {
                  return fetch(`/style/${data.storyID}/${layer.styleName}`, {
                    method: "POST",
                    body: JSON.stringify(layer.styleConfig),
                    headers: {
                      "X-CSRFToken": window.mapstory.composer.config.csrfToken
                    }
                  });
                }
                return Promise.resolve(true);
              });
              Promise.all(promises).then(() =>
                stateSvc.updateLocationUsingStoryId(data.storyID)
              );
            }
            stateSvc.config.removedChapters = [];
            stateSvc.config.removedFrames = [];
            const timestamp = headerSvc.updateSaveStatus("saved");
            stateSvc.config.lastSynced = timestamp;
            stateSvc.generateStoryThumbnail(data.storyID);
            res();
          });
        })
        .catch(() => {
          // handle fail
          headerSvc.updateSaveStatus("failed");
          res();
        });
    });

  stateSvc.generateStoryThumbnail = storyId =>
    fetch(`/story/${storyId}/generate_thumbnail`, {
      method: "POST",
      headers: {
        "X-CSRFToken": window.mapstory.composer.config.csrfToken
      },
      credentials: "same-origin"
    });

  stateSvc.publish = () => {
    const config = stateSvc.getConfig();
    config.isPublished = true;
    stateSvc.save();
  };

  /**
   * Sets the storypins to the config that will be saved.
   * @param storypins [[]] An Array chapters containing an array of Storypins each.
   */
  stateSvc.setStoryPinsToConfig = storypins => {
    stateSvc.config.storypins = storypins;
  };

  stateSvc.saveStoryframes = storyframes => {
    stateSvc.config.storyframes = storyframes;
  };
}

