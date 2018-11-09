import PubSub from "pubsub-js";

function layerSvc($http, appConfig, MapManager, stateSvc) {
  const layerStyleTimeStamps = {};
  const svc = {};

  svc.server = {
    active: appConfig.servers[0]
  };
  svc.servers = appConfig.servers;

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
    // TODO: Is this an OpenLayers internal attribute that we shouldn't be depending on?
    // eslint-disable-next-line no-underscore-dangle
    stateSvc.removeLayer(lyr.values_.uuid);
    window.storyMap.removeStoryLayer(lyr);
    PubSub.publish("layerRemoved");
  };

  svc.toggleVisibleLayer = lyr => {
    window.storyMap.toggleStoryLayer(lyr);
  };

  /*
     Get the results from Elastic Search based on a query of the layer name
     and then add the layer to the map. This is useful for adding a layer
     given only the name, regardless of whether or not it's remote.
  */

  svc.getApiResultsThenAddLayer = layerName => {
    svc.getSearchBarResultsIndex(layerName).then(data => {
      svc.addLayerFromApiResults({
        searchObjects: data,
        searchValue: layerName
      });
    });
  };

  svc.addLayerFromApiResults = args => {
    const searchObjects = args.searchObjects;
    const searchValue = args.searchValue;
    const settings = args.settings || {
      asVector: false,
      allowZoom: true,
      allowPan: true
    };
    const name = svc.getNameFromSearchResult(searchValue, searchObjects);
    const layerInfo = svc.getLayerInfoFromIndex(searchValue, searchObjects);
    const title = layerInfo.title;
    const remote = layerInfo.remote;
    if (remote) {
      svc.getRemoteServiceUrl(name).then(res => {
        const server = {
          absolutePath: res.url,
          canStyleWMS: false,
          name: "remote",
          type: "remote",
          path: ""
        };
        settings.params = res.params;
        MapManager.addLayer({ name, settings, server, title});
      });
    } else {
      MapManager.addLayer({ name, settings, server: svc.server.active, title});
    }
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
  getNameFromSearchResult
    The name of the layer may differ from the title, which is what appears
    in the search bar. Use the name of the layer to make the WMS request
    if the name value is not empty; else use the title.
  */
  svc.getNameFromSearchResult = (searchValue, layerIndex) => {
    const layerInfo = svc.getLayerInfoFromIndex(searchValue, layerIndex);
    return layerInfo.typename || layerInfo.title;
  };

  /*
  getLayerInfoFromIndex
    Search the nameObjects array for the search value provided and return an object
    containing relevant data
  */
  svc.getLayerInfoFromIndex = (searchValue, layerIndex) => {
    for (let i = 0; i < layerIndex.length; i += 1) {
      if (
        (layerIndex[i].title &&
          layerIndex[i].title.trim() === searchValue.trim()) ||
        layerIndex[i].typename === searchValue
      ) {
        return layerIndex[i];
      }
    }
    return false;
  };

  // Compile search bar results into an array of objects containing the name,
  // title, and whether or not it's a remote service
  svc.getSearchBarResultsIndex = searchValue => {
    const url = `${
      appConfig.servers[0].host
    }/api/layers/?name__icontains=${searchValue}`;
    return new Promise(resolve => {
      $http.get(url).then(response => {
        const searchObjects = [];
        const objects = response.data.objects;

        for (let i = 0; i < objects.length; i += 1) {
          if (objects[i].alternate) {
            const typename =
              objects[i].alternate.indexOf("geonode") > -1
                ? objects[i].alternate.split("geonode:")[1]
                : objects[i].alternate;
            searchObjects.push({
              title: objects[i].title,
              typename,
              remote: objects[i].subtype
                ? objects[i].subtype === "remote"
                : false
            });
          }
        }
        resolve(searchObjects);
      });
    });
  };

  svc.getLayerParam = (query, param) => {
    const urlJson = (() => {
      const result = {};
      query.split("&").forEach(part => {
        const item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
      });
      return result;
    })();
    return urlJson[param];
  };

  svc.getRemoteServiceUrl = name =>
    new Promise(res => {
      $http.get(`/layers/${name}/remote`).then(r => {
        const containsQuery = r.data.indexOf("?") > -1;
        const url = containsQuery ? r.data.split("?")[0] : r.data;
        const query = containsQuery ? r.data.split("?")[1] : false;
        const params = {
          map: svc.getLayerParam(query, "map")
        };
        res({ url, params });
      });
    });

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
      `${server}?request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=${layerName}&transparent=true&legend_options=fontColor:0x000000;` +
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
