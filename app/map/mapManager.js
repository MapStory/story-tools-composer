function MapManager($http, $q, $log, $rootScope, $location, $compile,
                    StoryPinLayerManager, stStoryMapBuilder, stLocalStorageSvc,
                    stAnnotationsStore, stEditableLayerBuilder, TimeControlsManager,
                    EditableStoryMap, stStoryMapBaseBuilder, stateSvc,
                    stEditableStoryMapBuilder) {
    this.storyMap = new EditableStoryMap({target: 'map'});
    window.storyMap = this.storyMap;
    StoryPinLayerManager.map = this.storyMap;
    //StoryBoxLayerManager.map = this.storyMap;
    this._config = {};
    this.title = "";
    this.owner = "";
    this.storyChapter = 1;
    this.chapterCount = 1;
    var self = this;
    StoryPinLayerManager.storyPinsLayer = this.storyMap.storyPinsLayer;

    this.loadMap = function(options) {
        options = options || {};
        if (options.id) {
            stStoryMapBuilder.modifyStoryMap(self.storyMap, options);

            var annotationsLoad = $http.get("/maps/" + options.id + "/annotations");
            var boxesLoad = $http.get("/maps/" + options.id + "/boxes");
            $q.all([annotationsLoad, boxesLoad]).then(function(values) {
                StoryPinLayerManager.loadFromGeoJSON(values[0].data, self.storyMap.getMap().getView().getProjection(), true);
            });
        } else if (options.url) {
            var mapLoad = $http.get(options.url).then(function(response) {
                stEditableStoryMapBuilder.modifyStoryMap(self.storyMap, response.data);
            }).catch(function(data, status) {
                if (status === 401) {
                    window.console.warn('Not authorized to see map ' + mapId);
                    stStoryMapBaseBuilder.defaultMap(self.storyMap);
                }
            });
            var annotationsURL = options.url.replace('/data','/annotations');
            if (annotationsURL.slice(-1) === '/') {
                annotationsURL = annotationsURL.slice(0, -1);
            }
            var annotationsLoad = $http.get(annotationsURL);
            $q.all([mapLoad, annotationsLoad]).then(function(values) {
                var geojson = values[1].data;
                StoryPinLayerManager.loadFromGeoJSON(geojson, self.storyMap.getMap().getView().getProjection());
            });
        } else {
            stStoryMapBaseBuilder.defaultMap(this.storyMap);
        }
        this.currentMapOptions = options;
    };

    this.initMapLoad = function() {
      var config = stateSvc.getChapterConfig();
      if (!config) { return; }
      self.title = config.about.title;
      self.username = config.about.username;
      self.owner = config.about.owner;
      self.loadMap(config);
    };

    // add locationchange listener to composerCtrl and affect necessary changes in stateSvc

    this.addLayer = function(name, settings, server, fitExtent, styleName, title) {
        self.storyMap.setAllowZoom(settings.allowZoom);
        self.storyMap.setAllowPan(settings.allowPan);
        if (fitExtent === undefined) {
            fitExtent = true;
        }
        if (angular.isString(server)) {
            server = getServer(server);
        }
        var workspace = 'geonode';
        var parts = name.split(':');
        if (parts.length > 1) {
            workspace = parts[0];
            name = parts[1];
        }
        var url = server.path + workspace + '/' + name + '/wms';
        var id = workspace + ":" + name;
        var options = {
            id: id,
            name: name,
            title: title || name,
            url: url,
            path: server.path,
            canStyleWMS: server.canStyleWMS,
            timeEndpoint: server.timeEndpoint ? server.timeEndpoint(name): undefined,
            type: (settings.asVector === true) ? 'VECTOR': 'WMS'
        };
        return stEditableLayerBuilder.buildEditableLayer(options, self.storyMap.getMap()).then(function(a) {
            self.storyMap.addStoryLayer(a);
            if (fitExtent === true) {
                a.get('latlonBBOX');
                var extent = ol.proj.transformExtent(
                      a.get('latlonBBOX'),
                      'EPSG:4326',
                      self.storyMap.getMap().getView().getProjection()
                );
                // prevent getting off the earth
                extent[1] = Math.max(-20037508.34, Math.min(extent[1], 20037508.34));
                extent[3] = Math.max(-20037508.34, Math.min(extent[3], 20037508.34));
                self.storyMap.getMap().getView().fitExtent(extent, self.storyMap.getMap().getSize());
            }
        });
    };
}

module.exports = MapManager;
