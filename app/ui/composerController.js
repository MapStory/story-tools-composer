function composerController(
    $scope,
    $rootScope,
    $log,
    $compile,
    $http,
    $injector,
    MapManager,
    styleUpdater,
    stFeatureInfoService,
    appConfig,
    TimeControlsManager,
    stateSvc,
    navigationSvc,
    pinSvc,
    uiHelperSvc,
    searchSvc,
    $location
) {
    $scope.mapManager = MapManager;
    $scope.stateSvc = stateSvc;
    $scope.pinSvc = pinSvc;
    $scope.uiHelperSvc = uiHelperSvc;
    $scope.searchSvc = searchSvc;
    $scope.pin = {};


    $rootScope.$on("$locationChangeSuccess", () => {
        $scope.mapManager.initMapLoad();
        $scope.stateSvc.updateCurrentChapterConfig();
    });

    $rootScope.$on("configInitialized", () => $scope.mapManager.initMapLoad());

    $rootScope.$on("pin-added", (event, chapter_index) => $log.log($scope.pinSvc.getPins(0)));

    $rootScope.$on("chapter-added", (event, config) => pinSvc.addChapter());

    $rootScope.$on("chapter-removed", (event, chapter_index) => pinSvc.removeChapter(chapter_index));

    $rootScope.$on("showPin", (event, pin) => {
        self.displayPinInfo(null, pin);
    });

    $rootScope.$on("rangeChange", (event, range) => {
        // StoryPinLayerManager.autoDisplayPins(range);
     });

    $rootScope.$on("hidePinOverlay", (event, pin) => {
        self.hidePinOverlay(pin);
    });

    $rootScope.$on("hidePinOverlay", (event, pin) => {
        self.hidePinOverlay(pin);
    });

    MapManager.storyMap.getMap().on("click", evt => {
        // popupSvc.displayInfo(evt.pixel);
    });

    $scope.mode = {
        preview: false
    };
    $scope.timeControlsManager = $injector.instantiate(TimeControlsManager);
    $scope.mapWidth = appConfig.dimensions.mapWidthEditMode;
    $scope.playbackOptions = {
        mode: "instant",
        fixed: false
    };

    $scope.saveMap = () => {
        $log.log("STORY MAP LAYERS ---- > ", window.storyMap.getStoryLayers());
        stateSvc.save();
    };

    $scope.newMap = () => $location.path("/new");

    $scope.styleChanged = (layer) => {
        layer.on("change:type", (evt) => {
            styleUpdater.updateStyle(evt.target);
        });
        styleUpdater.updateStyle(layer);
    };

    $scope.showLoadMapDialog = () => {
        const promise = loadMapDialog.show();
        promise.then((result) => {
            if (result.mapstoryMapId) {
                $location.path("/maps/" + result.mapstoryMapId + "/data/");
            } else if (result.localMapId) {
                $location.path("/local/" + result.localMapId);
            }
        });
    };

    $scope.getMapWidth = (preview) => {
        if (preview === true) {
            return appConfig.dimensions.mapWidthPreviewMode;
        } else {
            return appConfig.dimensions.mapWidthEditMode;
        }
    };

    $scope.togglePreviewMode = () => {
        $scope.mapWidth = $scope.getMapWidth($scope.mode.preview);
        $rootScope.mapWidth = $scope.mapWidth;
        if ($scope.mode.preview) {
            $("[data-target='#playback-settings']").css("display", "inline-block");
        } else {
            $("[data-target='#playback-settings']").css("display", "none");
        }
        $rootScope.$broadcast("toggleMode", {
            mapWidth: $scope.mapWidth
        });
        setTimeout(() => {
            window.storyMap.getMap().updateSize();
        });
    };

    $scope.layerProperties = (lyr) => {
        const props = lyr.getProperties();
        const features = delete props.features;
        props.featureCount = (features || []).length;
        return props;
    };

    $scope.updateSelected = (selected) => {
        $scope.selected = { selected: true };
    };

    $scope.nextChapter = navigationSvc.nextChapter;
    $scope.previousChapter = navigationSvc.previousChapter;

    $scope.frameSettings = [];

    $scope.isDefault = ($event, index) => {
        const elem = document.querySelectorAll('.isDefault')
        for (let i = 0; i < elem.length; i++) {
            elem[i].classList.remove('isDefault');
        }
        $event.currentTarget.parentNode.classList.add('isDefault');
    };

    $scope.clearLayers = () => {
        MapManager.storyMap.getMap().getLayers().forEach((layer) => {
            if(layer instanceof ol.layer.Vector) {
                MapManager.storyMap.getMap().removeLayer(layer);
            }
        });
    };

    $scope.drawBoundingBox = () => {
        const bbVector = new ol.source.Vector({wrapX: false});
        const vector = new ol.layer.Vector({
            source: bbVector
        });
        bbVector.on('addfeature', (evt) => {
            const feature = evt.feature;
            $scope.coords = feature.getGeometry().getCoordinates();
        });
        const geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
        const draw = new ol.interaction.Draw({
            source: bbVector,
            type: 'Circle',
            geometryFunction: geometryFunction
        });
        vector.set('name', 'boundingBox');
        MapManager.storyMap.getMap().addLayer(vector);
        MapManager.storyMap.getMap().addInteraction(draw);
    };

    function transformCoords(loc) {
        return ol.proj.transform(loc, 'EPSG:3857', 'EPSG:4326');
    }

    $scope.storyDetails = (frameSettings) => {
        frameSettings.id = Date.now();

        $scope.frameSettings.push({
            id: frameSettings.id,
            title: frameSettings.title,
            startDate: frameSettings.startDate,
            startTime: frameSettings.startTime,
            endDate: frameSettings.endDate,
            endTime: frameSettings.endTime,
            radius: frameSettings.radius,
            bb1: transformCoords([$scope.coords[0][0][0], $scope.coords[0][0][1]]),
            bb2: transformCoords([$scope.coords[0][1][0], $scope.coords[0][1][1]]),
            bb3: transformCoords([$scope.coords[0][2][0], $scope.coords[0][2][1]]),
            bb4: transformCoords([$scope.coords[0][3][0], $scope.coords[0][3][1]])
        });
    };

    $scope.editStoryframe = (index) => {
        $scope.frameSettings.title = $scope.frameSettings[index].title;
        $scope.frameSettings.startDate = $scope.frameSettings[index].startDate;
        $scope.frameSettings.startTime = $scope.frameSettings[index].startTime;
        $scope.frameSettings.endDate = $scope.frameSettings[index].endDate;
        $scope.frameSettings.endTime = $scope.frameSettings[index].endTime;
        $scope.frameSettings.radius = $scope.frameSettings[index].radius;
        $scope.currentIndex = index;
        $scope.disableButton = false;
        $scope.disableButton = !$scope.disableButton;
    };

    $scope.updateStoryframeRecord = () => {
        $scope.frameSettings[$scope.currentIndex].title = $scope.frameSettings.title;
        $scope.frameSettings[$scope.currentIndex].startDate = $scope.frameSettings.startDate;
        $scope.frameSettings[$scope.currentIndex].startTime = $scope.frameSettings.startTime;
        $scope.frameSettings[$scope.currentIndex].endDate = $scope.frameSettings.endDate;
        $scope.frameSettings[$scope.currentIndex].endTime = $scope.frameSettings.endTime;
        $scope.frameSettings[$scope.currentIndex].radius = $scope.frameSettings.radius;
        $scope.disableButton = true;
        $scope.disableButton = !$scope.disableButton;
    }

    $scope.deleteStoryframe = (index) => {
        $scope.frameSettings.splice(index, 1);
    };
}

module.exports = composerController;