import PubSub from "pubsub-js";
import MinimalConfig from "app/state/MinimalConfig";
import headerSvc from "app/ui/headerSvc";
import locationSvc from "app/ui/locationSvc";

function stateSvc(configSvc) {
  const svc = {};
  svc.currentChapter = null;
  svc.previousChapter = null;
  svc.originalConfig = null;
  svc.config = null;
  svc.frameSettings = null;
  svc.timelineSettings = {
    loop: "none",
    state: "stopped"
  };

  PubSub.subscribe("stateChange", (event, data) => {
    svc.timelineSettings.loop = data.loop;
    svc.timelineSettings.state = data.state;
  });

  svc.addNewChapter = () => {
    const newChapter = configSvc.generateChapterConfig(
      svc.config.chapters.length + 1
    );
    svc.config.chapters.push(newChapter);
    PubSub.publish("chapterCreated", newChapter.index);
  };

  svc.removeChapter = chapterId => {
    const index = chapterId - 1;
    if (svc.config.chapters[index].mapId) {
      svc.config.removedChapters.push(svc.config.chapters[index].mapId);
    }
    svc.config.chapters.splice(index, 1);

    for (let i = 0; i < svc.config.chapters.length; i += 1) {
      svc.config.chapters[i].index = i + 1;
    }
  };

  // mutates the input array
  svc.arrayMove = (array, oldIndex, newIndex) => {
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

  svc.reorderLayer = (from, to) => {
    let arr = [];
    if (svc.config.mapManager) {
      arr = svc.config.mapManager.storyMap
        .getMap()
        .getLayers()
        .getArray();
    }
    svc.arrayMove(svc.config.chapters[svc.getChapterIndex()].layers, from, to);
    svc.arrayMove(
      svc.config.chapters[svc.getChapterIndex()].map.layers,
      from,
      to
    );
    arr.forEach(layer => {
      if (layer.getSource() && layer.getSource().getParams) {
        const layerName = layer.getSource().getParams().LAYERS;
        const zIndex = svc.config.chapters[
          svc.getChapterIndex()
        ].layers.findIndex(item => item.name === layerName);
        layer.setZIndex(zIndex);
      }
    });
  };

  function initializeNewConfig() {
    svc.config = configSvc.getMapstoryConfig();
    window.config = svc.config;
    svc.originalConfig = window.config;
    PubSub.publish("configInitialized");
  }

  svc.initConfig = () => {
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
          svc.config = configSvc.getMapstoryConfig(data);
          window.config = svc.config;
          svc.originalConfig = data;
          PubSub.publish("configInitialized");
        })
        .fail(() => {
          initializeNewConfig();
        });
    } else {
      initializeNewConfig();
    }
  };

  svc.getConfig = () => svc.config;

  svc.setConfig = config => {
    svc.config = config;
  };

  svc.set = (k, v) => {
    svc.config[k] = v;
  };

  svc.updateCurrentChapterConfig = () => {
    svc.currentChapter = svc.getChapterConfig();
  };

  svc.addLayer = layerOptions => {
    svc.config.chapters[svc.getChapterIndex()].layers.push(layerOptions);
    svc.config.chapters[svc.getChapterIndex()].map.layers.push(layerOptions);
  };

  svc.updateLayerStyle = (layerName, styleName, style) => {
    const chapter = svc.config.chapters[svc.getChapterIndex()];
    const layerCount = chapter.layers.length;
    const layerArray = svc.config.mapManager.storyMap
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
  svc.fetchComponentsFromAPI = storyID =>
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
    if (svc.isTempStory()) {
      // Initialize empty arrays for storypins
      svc.getConfig().storypins = [[]];
    } else {
      // Data should exist for this mapstory. Get saved components from API:
      svc.fetchComponentsFromAPI(svc.getConfig().storyID);
    }
  });

  /**
   * True if this is a temp unsaved mapstory.
   * @returns {boolean} True if this is a temp unsaved mapstory.
   */
  svc.isTempStory = () => {
    if (svc.getConfig().storyID === 0) {
      return true;
    }
    return false;
  };

  // !DJA @TODO: write test
  svc.removeLayer = uuid => {
    const layers = svc.config.chapters[svc.getChapterIndex()].layers;
    for (let i = 0; i < layers.length; i += 1) {
      if (layers[i].uuid === uuid) {
        const index = layers.indexOf(layers[i]);
        if (index > -1) {
          svc.config.chapters[svc.getChapterIndex()].layers.splice(index, 1);
        }
      }
    }
  };

  svc.setStoryframeDetails = copiedFrameSettings => {
    const chapterLookup = {};
    svc.config.frameSettings = [];
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
      svc.config.frameSettings[index] = featureCollection;
    });
    svc.saveStoryframes(svc.config.frameSettings);
  };

  svc.getChapter = () => {
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

  svc.getChapterIndex = () => svc.getChapter() - 1;

  svc.getChapterConfig = () => {
    const chapter = svc.getChapter();
    const config = svc.getConfig();
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

  svc.updateBaseLayer = baselayer => {
    const layers = svc.config.chapters[svc.getChapterIndex()].map.layers;
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

  svc.getChapterConfigs = () => {
    const config = svc.getConfig();
    return config.chapters;
  };

  svc.getChapterCount = () => {
    if (!svc.getConfig()) {
      return false;
    }
    return svc.getChapterConfigs() ? svc.getChapterConfigs().length : 0;
  };

  svc.initConfig();

  svc.getCategories = () =>
    fetch("/api/categories/")
      .then(response => response.json())
      .then(data => {
        svc.categories = data.objects;
      });

  svc.getCategories();

  svc.updateLocationUsingStoryId = () => {
    const storyID = svc.getConfig().storyID;
    window.location.href = `/story/${storyID}/draft`;
  };

  svc.onChapterSort = () => {
    // Iterate through the chapters and update their indexes anytime they are sorted
    for (let i = 0; i < svc.config.chapters.length; i += 1) {
      svc.config.chapters[i].index = i + 1;
    }
  };

  svc.save = () =>
    new Promise(res => {
      headerSvc.updateSaveStatus("saving");
      const cfg = new MinimalConfig(svc.config);
      // iterate through feature collections and add them
      // to the corresponding chapters
      for (let i = 0; i < cfg.chapters.length; i += 1) {
        const id = cfg.chapters[i].mapId;
        // ensure key exists even if undefined for server logic
        cfg.chapters[i].mapId = id;
      }

      for (let i = 0; i < svc.config.chapters.length; i += 1) {
        // ensure key exists even if undefined for server logic
        cfg.chapters[i].frames =
          svc.config.storyframes &&
          svc.config.storyframes[i] &&
          svc.config.storyframes[i].features
            ? svc.config.storyframes[i]
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
            for (let i = 0; i < svc.config.chapters.length; i += 1) {
              const id = data.chapters[i].mapId;
              svc.config.chapters[i].id = id;
              svc.config.chapters[i].mapId = id;
              svc.config.chapters[i].removedPins = [];
              stylesToPersist.push(svc.config.chapters[i].layers.flatten());

              for (
                let j = 0;
                j < data.chapters[i].frames.features.length;
                j += 1
              ) {
                svc.config.storyframes[i].features[j].id =
                  data.chapters[i].frames.features[j].id;
              }

              for (let j = 0; j < svc.config.chapters[i].pins.length; j += 1) {
                svc.config.chapters[i].pins[j].id =
                  data.chapters[i].pins.features[j].id;
              }
            }
            if (!svc.config.storyID) {
              svc.set("storyID", data.storyID);
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
                svc.updateLocationUsingStoryId(data.storyID)
              );
            }
            svc.config.about.slug = data.about.slug;
            svc.config.removedChapters = [];
            svc.config.removedFrames = [];
            const timestamp = headerSvc.updateSaveStatus("saved");
            svc.config.lastSynced = timestamp;
            svc.generateStoryThumbnail(data.storyID);
            res();
          });
        })
        .catch(() => {
          // handle fail
          headerSvc.updateSaveStatus("failed");
          res();
        });
    });

  svc.generateStoryThumbnail = storyId =>
    fetch(`/story/${storyId}/generate_thumbnail`, {
      method: "POST",
      headers: {
        "X-CSRFToken": window.mapstory.composer.config.csrfToken
      },
      credentials: "same-origin"
    });

  svc.publish = () => {
    const config = svc.getConfig();
    config.isPublished = true;
    svc.save();
  };

  /**
   * Sets the storypins to the config that will be saved.
   * @param storypins [[]] An Array chapters containing an array of Storypins each.
   */
  svc.setStoryPinsToConfig = storypins => {
    svc.config.storypins = storypins;
  };

  svc.saveStoryframes = storyframes => {
    svc.config.storyframes = storyframes;
  };

  return svc;
}

export default stateSvc;
