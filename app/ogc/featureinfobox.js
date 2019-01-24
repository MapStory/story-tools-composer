export default function featureinfobox(MapManager, $rootScope, stFeatureInfoService) {
  return {
    replace: false,
    restrict: "A",
    templateUrl: "app/ogc/templates/featureinfobox.tpl.html",
    link(scope) {
      scope.mapManager = MapManager;
      scope.featureInfoService = stFeatureInfoService;

      scope.isUrl = (str) => /^(f|ht)tps?:\/\//i.test(str);

      // This doesn't actually do any check, so I simplified it to always return true
      scope.isShowingAttributes = () => true;

      // This doesn't actually do any check, so I simplified it to always return true
      scope.isAttributeVisible = () => true;
    }
  };
}
