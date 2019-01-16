import utils from "app/utils/utils";
import appConfig from "app/appConfig";
import layerOptionsSvc from "app/layers/layerOptionsSvc";

const newConfigSvc = {
  compareSources: (a,b) => a.name === b.name && a.ptype === b.ptype && a.restUrl === b.restUrl && a.url === b.url,

  createBasemaps: (layers, sources) =>
    layers.map(layer => (
      {
        opacity: layer.opacity,
        group: layer.group,
        name: layer.name,
        title: layer.title,
        visibility: false,
        selected: false,
        source: String(sources.findIndex(source => newConfigSvc.compareSources(source, layer.source))),
        fixed: layer.fixed
      })),

  createSources: (sourcesObject, layers) => {
    const sources = [];
    layers.forEach(layer => {
      const found = sources.find(source => newConfigSvc.compareSources(layer.source, source));
      if (!found) {
        sources.push(layer.source);
        sourcesObject[sources.length - 1] = layer.source;
      }
    });
    return sources;
  },
  defaultBasemap: "",
  sourcesObject: {},
  sourcesArray: [],
  basemaps: [],
  
  getBasemapArrayWithActiveBasemap: layers => {
    let activeBasemap = null;
    const basemapCopy = angular.copy(newConfigSvc.basemaps);
    if (layers && layers[0]) {
      activeBasemap = layers[0].split("?layers=")[1];
    }
    const baseMapArray = basemapCopy.map(basemap => {
      if (activeBasemap && basemap.name === activeBasemap) {
        basemap.visibility = true;
        basemap.selected = true;
      } else if (!activeBasemap && basemap.name === newConfigSvc.defaultBasemap) {
        basemap.visibility = true;
        basemap.selected = true;
      } else {
        basemap.visibility = false;
        basemap.selected = false;
      }
      return basemap;
    });
    // Return baseMapArray with the selected basemap first.
    for (let i = 0; i < baseMapArray.length; i++) {
      if (baseMapArray[i].selected === true) {
        const selectedBaseMap = baseMapArray.splice(i, 1);
        baseMapArray.unshift(selectedBaseMap[0]);
        break;
      }
    }
    return baseMapArray;
  },

  getLayerListFromServerData: layers => {
    if (!layers) {
      return [];
    }
    const newLayers = [];
    for (let i = 0; i < layers.length; i += 1) {
      if (layers[i].indexOf("/geoserver") > -1) {
        const name = layers[i].split("/geoserver/wms?layers=")[1];
        const options = layerOptionsSvc.getLayerOptions(
          name,
          {},
          appConfig.servers[0]
        );
        newLayers.push(options);
      }
    }
    return newLayers;
  },

  getMapstoryConfig: data => {
    const brandingCfg = window.mapstory.composer.config.branding;
    const classificationBannerCfg =
      window.mapstory.composer.config.classificationBanner;
    if (!data) {
      data = {
        abstract: `${brandingCfg.storyName} description`,
        owner: "",
        username: "",
        title: `${brandingCfg.storyName} title`,
        category: "",
        id: 0,
        uuid: utils.generateUUID(),
        chapters: [{}],
        isPublished: false
      };
    }

    const cfg = {
      about: {
        owner: data.owner,
        username: data.owner.username,
        abstract: data.abstract,
        title: data.title,
        category: data.category || "",
        slug: data.slug
      },
      branding: brandingCfg,
      classificationBanner: classificationBannerCfg,
      uuid: data.uuid,
      isPublished: data.is_published || false,
      removedChapters: [],
      removedFrames: [],
      viewerPlaybackMode: "instant",
      thumbnailUrl: data.thumbnail_url,
      id: data.id || 0,
      storyID: data.id || 0,
      chapters: data.chapters
    };

    window.storyUUID = data.uuid;

    for (let i = 0; i < data.chapters.length; i += 1) {
      cfg.chapters[i].owner = data.owner;
      cfg.chapters[i] = newConfigSvc.generateChapterConfig(i + 1, data.chapters[i]);
    }
    if (data.chapters.length === 0) {
      cfg.chapters[0] = newConfigSvc.generateChapterConfig();
      cfg.chapters[0].owner = data.owner;
    }

    return cfg;
  },

  generateChapterConfig: (index, data) => {
    if (!data) {
      data = {
        abstract: "",
        owner: "",
        title: `New Chapter`
      };
    }

    data.layersConfig = data.layers_config
      ? JSON.parse(data.layers_config)
      : [];

    const cfg = {
      index,
      id: index,
      pins: [],
      frames: [],
      removedPins: [],
      mapId: data.map_id || 0,
      about: {
        abstract: data.abstract || "",
        owner: data.owner,
        title: data.title || `New Chapter`
      },
      layers: data.layersConfig,
      viewerPlaybackMode: "instant",
      storyID: data.story_id || null,
      sources: newConfigSvc.sourcesObject,
      map: {
        id: index,
        center: [-11046067.8315474, 4153282.36890334],
        units: "m",
        maxResolution: 156543.03390625,
        maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
        zoom: 5,
        storyID: data.story_id || null,
        projection: "EPSG:900913",
        layers: newConfigSvc
          .getBasemapArrayWithActiveBasemap(data.layers)
          .concat(data.layersConfig),
        keywords: []
      }
    };
    return cfg;
  },
}

export default newConfigSvc;

if (window.mapstory.composer.config.baselayersConfig) {
  window.mapstory.composer.config.baselayersConfig.layers = window.mapstory.composer.config.baselayersConfig.layers.filter(layer => layer.name !== null);
  newConfigSvc.sourcesArray = newConfigSvc.createSources(newConfigSvc.sourcesObject, window.mapstory.composer.config.baselayersConfig.layers);
  newConfigSvc.basemaps = newConfigSvc.createBasemaps(window.mapstory.composer.config.baselayersConfig.layers, newConfigSvc.sourcesArray);
  newConfigSvc.defaultBasemap = window.mapstory.composer.config.baselayersConfig.defaultLayer;
}

