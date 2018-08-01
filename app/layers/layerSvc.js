function layerSvc($rootScope, stateSvc) {
  const layerStyleTimeStamps = {};
  const svc = {};

  svc.baseLayers = [
    {
      title: "World Light",
      type: "MapBox",
      name: "world-light"
    },
    {
      title: "World Dark",
      type: "MapBox",
      name: "world-dark"
    },
    {
      title: "Geography Class",
      type: "MapBox",
      name: "geography-class"
    },
    {
      title: "Natural Earth 2",
      type: "MapBox",
      name: "natural-earth-2"
    },
    {
      title: "Natural Earth",
      type: "MapBox",
      name: "natural-earth-1"
    },
    {
      title: "Humanitarian OpenStreetMap",
      type: "HOT",
      name: "hot"
    },
    {
      title: "OpenStreetMap",
      type: "OSM",
      name: "osm"
    },
    {
      title: "World Topo Map",
      type: "ESRI",
      name: "world-topo-map"
    }
  ];

  svc.removeLayer = lyr => {
    stateSvc.removeLayer(lyr.values_.uuid);
    window.storyMap.removeStoryLayer(lyr);
    $rootScope.$broadcast("layerRemoved");
  };

  svc.toggleVisibleLayer = lyr => {
    window.storyMap.toggleStoryLayer(lyr);
  };

  svc.compileLayerNamesFromSearchIndex = searchIndex => {
    const names = [];
    for (let i = 0; i < searchIndex.length; i += 1) {
      if (searchIndex[i].title) {
        names.push(searchIndex[i].title);
      } else {
        names.push(searchIndex[i].typename);
      }
    }
    return names;
  };

  svc.getNameFromIndex = (layerName, nameIndex) => {
    let name;
    for (let i = 0; i < nameIndex.length; i += 1) {
      if (
        nameIndex[i].title.trim() === layerName.trim() ||
        nameIndex[i].typename === layerName
      ) {
        name = nameIndex[i].typename;
      }
    }
    return name;
  };

  svc.getLegendUrl = layer => {
    let url = null;
    const layerName = layer.get("typeName") || layer.get("id");
    const styleName = layer.get("styleName");
    const timestamp = new Date().getTime();
    if (
      !layerStyleTimeStamps[layerName] ||
      timestamp - layerStyleTimeStamps[layerName] > 150
    ) {
      layerStyleTimeStamps[layerName] = timestamp;
    }
    const server = "/geoserver/wms/";
    url =
      `${server}?test=ab&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=${layerName}&transparent=true&legend_options=fontColor:0xFFFFFF;` +
      `fontAntiAliasing:true;fontSize:14;fontStyle:bold;`;
    if (goog.isDefAndNotNull(styleName)) {
      url += `&style=${styleName}`;
      url += `&timestamp=${layerStyleTimeStamps[layerName]}`;
    }
    return url;
  };

  return svc;
}

export default layerSvc;
