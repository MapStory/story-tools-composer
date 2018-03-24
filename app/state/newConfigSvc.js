function newConfigSvc(layerOptionsSvc, appConfig) {
  const svc = {};

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

  svc.getMapstoryConfig = data => {
    if (!data) {
      data = {
        abstract: "Mapstory description",
        owner: "",
        username: "",
        title: "Mapstory title",
        id: 1,
        chapters: [{}]
      };
    }

    const cfg = {
      about: {
        owner: data.owner,
        username: data.owner.username,
        abstract: data.abstract,
        title: data.title,
        slug: data.slug
      },
      thumbnail_url: data.thumbnail_url,
      id: data.id || 1,
      chapters: data.chapters
    };

    for (let i = 0; i < data.chapters.length; i++) {
      data.chapters[i].owner = data.owner;
      cfg.chapters[i] = svc.getChapterConfig(i, data.chapters[i]);
    }
    if (data.chapters.length === 0) {
      cfg.chapters[0] = svc.getChapterConfig();
      config.chapters[0].owner = data.owner;
    }

    return cfg;
  };

  svc.getChapterConfig = (id, data) => {
    if (!id) {
      id = 1;
    }
    if (!data) {
      data = {
        abstract: "",
        owner: "",
        title: `Chapter ${id}`
      };
    }
    const cfg = {
      id,
      map_id: data.map_id,
      about: {
        abstract: data.abstract,
        owner: data.owner,
        title: data.title || `Chapter ${id}`
      },
      layers: svc.getLayerListFromServerData(data.layers),
      sources: {
        "0": {
          lazy: true,
          name: "local geoserver",
          title: "Local Geoserver",
          restUrl: "/gs/rest",
          ptype: "gxp_wmscsource",
          url: "https://mapstory.org/geoserver/wms",
          isVirtualService: false
        },
        "1": { hidden: true, ptype: "gxp_mapboxsource" },
        "3": { ptype: "gxp_osmsource" },
        "2": {
          ptype: "gxp_arcrestsource",
          url:
            "https://services.arcgisonline.com/arcgis/rest/services/NGS_Topo_US_2D/MapServer/",
          isVirtualService: false,
          alwaysAnonymous: true,
          proj: "EPSG:4326"
        },
        "5": { ptype: "gxp_olsource" },
        "4": {
          lazy: true,
          name: "local geoserver",
          title: "Local Geoserver",
          url: "https://mapstory.org/geoserver/wms",
          ptype: "gxp_wmscsource",
          restUrl: "/gs/rest"
        },
        "6": {
          url:
            "https://services.arcgisonline.com/arcgis/rest/services/NGS_Topo_US_2D/MapServer/",
          proj: "EPSG:4326",
          ptype: "gxp_arcrestsource",
          alwaysAnonymous: true
        }
      },
      map: {
        id,
        center: [-11046067.8315474, 4153282.36890334],
        units: "m",
        maxResolution: 156543.03390625,
        maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
        zoom: 5,
        projection: "EPSG:900913",
        layers: [
          {
            opacity: 1.0,
            group: "background",
            name: "mapnik",
            title: "OpenStreetMap",
            args: ["OpenStreetMap"],
            visibility: false,
            source: "0",
            fixed: true,
            type: "OpenLayers.Layer.OSM"
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
            source: "0",
            fixed: true,
            type: "OpenLayers.Layer.OSM"
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
            name: "world-dark",
            title: "World Dark",
            visibility: true,
            source: "1",
            fixed: false
          },
          {
            opacity: 1.0,
            group: "background",
            name: "world-light",
            title: "World Light",
            selected: true,
            visibility: false,
            source: "1",
            fixed: false
          },
          {
            opacity: 1.0,
            group: "background",
            name: "NGS_Topo_US_2D",
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
        ],
        keywords: []
      }
    };
    return cfg;
  };

  return svc;
}

module.exports = newConfigSvc;
