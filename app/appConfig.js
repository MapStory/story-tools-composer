const appConfig = {
  dimensions: {
    mapWidthEditMode: "70%",
    layerViewerMode: "100%"
  },
  routes: {
    chapter: "/chapter/"
  },
  servers: [
    {
      name: "mapstory",
      path: "/geoserver/",
      absolutePath: "", // 'https://mapstory.org/geoserver/',
      host: "", // 'https://mapstory.org/',
      canStyleWMS: false,
      timeEndpoint(name) {
        return `/maps/time_info.json?layer=${name}`;
      }
    },
    {
      name: "storyscapes",
      path: "/gsstoryscapes/",
      canStyleWMS: true,
      host: "http://storyscapes.geointservices.io/"
    },
    {
      name: "local",
      path: "/gslocal/",
      canStyleWMS: true
    }
  ],
  iconCommonsHost: "http://mapstory.dev.boundlessgeo.com"
};

export default appConfig;
