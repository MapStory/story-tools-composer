
const stBaseLayerBuilder = () => ({
  buildLayer(data) {
    if (data.type === "MapQuest") {
      return new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background",
        source: new ol.source.MapQuest({ layer: data.layer })
      });
    }
    if (data.type === "ESRI") {
      return new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background",
        source: new ol.source.XYZ({
          attributions: [
            new ol.Attribution({
              html:
                'Tiles &copy; <a href="//services.arcgisonline.com/ArcGIS/' +
                'rest/services/NatGeo_World_Map/MapServer">ArcGIS</a>'
            })
          ],
          url:
            "//server.arcgisonline.com/ArcGIS/rest/services/" +
            "NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
        })
      });
    }
    if (data.type === "HOT") {
      return new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background",
        source: new ol.source.OSM({
          attributions: [
            new ol.Attribution({
              html:
                'Tiles courtesy of <a href="//hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
            }),
            ol.source.OSM.ATTRIBUTION
          ],
          crossOrigin: null,
          url: "//{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        })
      });
    }
    if (data.type === "OSM") {
      return new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background",
        source: new ol.source.OSM()
      });
    }
    if (data.type === "MapBox") {
      const layer = new ol.layer.Tile({
        state: data,
        name: data.title,
        title: data.title,
        group: "background"
      });
      const name = data.name;
      const urls = [
        "//a.tiles.mapbox.com/v1/mapbox.",
        "//b.tiles.mapbox.com/v1/mapbox.",
        "//c.tiles.mapbox.com/v1/mapbox.",
        "//d.tiles.mapbox.com/v1/mapbox."
      ];
      const tileUrlFunction = function tileUrl(tileCoord) {
        const zxy = tileCoord;
        if (zxy[1] < 0 || zxy[2] < 0) {
          return "";
        }
        return (
          `${urls[Math.round(Math.random() * 3)] +
          name
          }/${
            zxy[0].toString()
          }/${
            zxy[1].toString()
          }/${
            zxy[2].toString()
          }.png`
        );
      };
      layer.setSource(
        new ol.source.TileImage({
          wrapX: true,
          crossOrigin: null,
          attributions: [
            new ol.Attribution({
              html: /^world/.test(name) ? "<a href='//mapbox.com'>MapBox</a> | Some Data &copy; OSM CC-BY-SA | <a href='//mapbox.com/tos'>Terms of Service</a>": "<a href='//mapbox.com'>MapBox</a> | <a href='//mapbox.com/tos'>Terms of Service</a>"
            })
          ],
          tileGrid: new ol.tilegrid.TileGrid({
            origin: [-128 * 156543.03390625, -128 * 156543.03390625],
            resolutions: [
              156543.03390625,
              78271.516953125,
              39135.7584765625,
              19567.87923828125,
              9783.939619140625,
              4891.9698095703125,
              2445.9849047851562,
              1222.9924523925781,
              611.4962261962891,
              305.74811309814453,
              152.87405654907226,
              76.43702827453613,
              38.218514137268066,
              19.109257068634033,
              9.554628534317017,
              4.777314267158508,
              2.388657133579254,
              1.194328566789627,
              0.5971642833948135
            ]
          }),
          tileUrlFunction
        })
      );
      return layer;
    }
    if (data.type === "WMS") {
      return new ol.layer.Tile({
        group: "background",
        source: new ol.source.TileWMS({
          url: data.url,
          params: data.params
        })
      });
    }
    throw new Error(`no type for : ${  JSON.stringify(data)}`);
  }
});

export default stBaseLayerBuilder;