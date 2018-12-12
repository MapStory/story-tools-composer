import utils from "app/utils/utils";



function newConfigSvc(layerOptionsSvc, appConfig) {
  console.log("Calling new config service");
  const svc = {};

  const compareSources = (a,b) => a.name === b.name && a.ptype === b.ptype && a.restUrl === b.restUrl && a.url === b.url;

  const createBasemaps = (layers, sources) => {
    return layers.map(layer => (
      {
        opacity: layer.opacity,
        group: layer.group,
        name: layer.name,
        title: layer.title,
        visibility: layer.visibility,
        selected: false,
        source: String(sources.findIndex(source => compareSources(source, layer.source))),
        fixed: layer.fixed
      }));
  };

  const createSources = (sourcesObject, layers) => {
    const sources = [];
    layers.forEach(layer => {
      const found = sources.find(source => compareSources(layer.source, source));
      if (!found) {
        sources.push(layer.source);
        sourcesObject[sources.length - 1] = layer.source;
      }
    });
    return sources;
  };

  svc.isLoaded = fetch("/baselayers").then(
    resp => resp.json()
  ).then(resp => {
    console.log("Setting default:", resp);
    svc.defaultBasemap = resp.defaultLayer;
    const sourcesObject = {};
    const sourcesArray = createSources(sourcesObject, resp.layers);
    const basemaps = createBasemaps(resp.layers, sourcesArray);

    console.log(sourcesArray);
    console.log(sourcesObject);
    console.log(basemaps);

    svc.getBasemapArrayWithActiveBasemap = layers => {
      let activeBasemap = null;
      const basemapCopy = angular.copy(basemaps);
      if (layers && layers[0]) {
        activeBasemap = layers[0].split("?layers=")[1];
      }
      const baseMapArray = basemapCopy.map(basemap => {
        if (activeBasemap && basemap.name === activeBasemap) {
          basemap.visibility = true;
          basemap.selected = true;
        } else if (!activeBasemap && basemap.name === svc.defaultBasemap) {
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
    };

    svc.generateChapterConfig = (index, data) => {
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

      return {
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
        sources: sourcesObject,
        map: {
          id: index,
          center: [-11046067.8315474, 4153282.36890334],
          units: "m",
          maxResolution: 156543.03390625,
          maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
          zoom: 5,
          storyID: data.story_id || null,
          projection: "EPSG:900913",
          layers: svc
            .getBasemapArrayWithActiveBasemap(data.layers)
            .concat(data.layersConfig),
          keywords: []
        }
      };
    };

    svc.getMapstoryConfig = data => {
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
        cfg.chapters[i] = svc.generateChapterConfig(i + 1, data.chapters[i]);
      }
      if (data.chapters.length === 0) {
        cfg.chapters[0] = svc.generateChapterConfig();
        cfg.chapters[0].owner = data.owner;
      }

      return cfg;
    };

    svc.getLayerListFromServerData = layers => {
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
    };

    return true;
  });

  // svc.defaultBasemap = "world-dark";

  /*
  const basemaps = [
    {
      opacity: 1.0,
      group: "background",
      name: "world-dark",
      title: "World Dark",
      visibility: false,
      selected: false,
      source: "1",
      fixed: false
    },
    {
      opacity: 1.0,
      group: "background",
      name: "natural-earth-1",
      title: "Natural Earth",
      visibility: false,
      source: "1",
      fixed: false
    },
    {
      opacity: 1.0,
      group: "background",
      name: "natural-earth-2",
      title: "Natural Earth 2",
      visibility: false,
      source: "1",
      fixed: false
    },
    {
      opacity: 1.0,
      group: "background",
      name: "geography-class",
      title: "Geography Class",
      visibility: false,
      source: "1",
      fixed: false
    },
    {
      opacity: 1.0,
      group: "background",
      name: "control-room",
      title: "MapBoxControlRoom",
      visibility: false,
      source: "1",
      fixed: false
    },
    {
      opacity: 1.0,
      group: "background",
      name: "world-light",
      title: "World Light",
      visibility: false,
      source: "1",
      fixed: false
    },
    {
      opacity: 1.0,
      group: "background",
      name: "hot",
      title: "Humanitarian OpenStreetMap",
      args: [
        "Humanitarian OpenStreetMap",
        [
          "//a.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png",
          "//b.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png",
          "//c.tile.openstreetmap.fr/hot/${z}/${x}/${y}.png"
        ],
        { tileOptions: { crossOriginKeyword: null } }
      ],
      visibility: false,
      source: "3",
      fixed: true,
      type: "OpenLayers.Layer.OSM"
    },
    {
      opacity: 1.0,
      group: "background",
      name: "osm",
      title: "OpenStreetMap",
      args: ["OpenStreetMap"],
      visibility: false,
      source: "3",
      fixed: true,
      type: "OpenLayers.Layer.OSM"
    },
    {
      opacity: 1.0,
      group: "background",
      name: "world-topo-map",
      title: "Eri NGS",
      args: [
        "Worldmap",
        "https://services.arcgisonline.com/arcgis/rest/services/NGS_Topo_US_2D/MapServer/",
        { layers: "basic" }
      ],
      visibility: false,
      source: "2",
      fixed: true,
      type: "OpenLayers.Layer"
    }
  ];*/








  return svc;
}

export default newConfigSvc;
