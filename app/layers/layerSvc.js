function layerSvc($rootScope, $http, appConfig, stateSvc) {
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

  // Display a layer's title if it has one; else display its name.
  svc.compileLayerTitlesFromSearchIndex = searchIndex => {
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

  /*
  getNameFromIndex
    The name of the layer may differ from the title, which is what appears
    in the search bar. Use the name of the layer to make the server request
    if the name value is not empty; else use the title.
  */
  svc.getNameFromIndex = (searchValue, nameIndex) => {
    let name;
    for (let i = 0; i < nameIndex.length; i += 1) {
      if (
        nameIndex[i].title.trim() === searchValue.trim() ||
        nameIndex[i].typename === searchValue
      ) {
        name = nameIndex[i].typename || nameIndex[i].title;
      }
    }
    return name;
  };

  // Compile search bar results into an array of objects containing both the
  // name and the title of the layer
  svc.getSearchBarResultsIndex = searchValue => {
    const url = `${
      appConfig.servers[0].host
    }/api/base/search/?type__in=layer&limit=15&df=typename&q=${searchValue}`;
    return new Promise(resolve => {
      $http.get(url).then(response => {
        const nameIndex = [];
        const objects = response.data.objects;

        for (let i = 0; i < objects.length; i += 1) {
          if (objects[i].alternate) {
            nameIndex.push({
              title: objects[i].title,
              typename: objects[i].alternate.split("geonode:")[1],
              remote: objects[i].subtype
                ? objects[i].subtype === "remote"
                : false
            });
          }
        }
        resolve(nameIndex);
      });
    });
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
