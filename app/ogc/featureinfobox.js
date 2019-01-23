
export default function featureinfobox(MapManager, $rootScope, stFeatureInfoService) {

  return {
    replace: false,
    restrict: "A",
    templateUrl: "app/ogc/templates/featureinfobox.tpl.html",
    link(scope, el, atts) {
      scope.mapManager = MapManager;
      scope.featureInfoService = stFeatureInfoService;

      scope.isUrl = function(str) {
        if (!/^(f|ht)tps?:\/\//i.test(str)) {
          return false;
        }
        return true;
      };

      scope.isShowingAttributes = function() {
        const schema = null;// featureManagerService.getSelectedLayer().get('metadata').schema;

        // if there is no schema, do not hide attributes
        if (!goog.isDefAndNotNull(schema)) {
          return true;
        }

        const properties = stFeatureInfoService.getSelectedItemProperties();
        for (let index = 0; index < properties.length; index++) {
          if (goog.isDefAndNotNull(schema[properties[index][0]]) && schema[properties[index][0]].visible) {
            return true;
          }
        }
        return false;
      };

      scope.isAttributeVisible = function(property) {
        const schema = null;// featureManagerService.getSelectedLayer().get('metadata').schema;

        // if there is no schema, show the attribute. only filter out if there is schema and attr is set to hidden
        if (!goog.isDefAndNotNull(schema) || !schema.hasOwnProperty(property)) {
          return true;
        }

        return schema[property].visible;
      };
    }
  };
}
