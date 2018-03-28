function legendDirective(layerSvc) {
  return {
    restrict: "E",
    templateUrl: "./app/ui/templates/legend.html",
    link : function(scope,element,attrs){

      scope.$on('layer-ready',(ev,name)=>{
        console.log('[legend directive] layer is redy',name);
        scope.legend_url = layerSvc.get_legend_url(name);
        console.log('so scope.legend_url is',scope.legend_url);
      });

    }
  };
}

module.exports = legendDirective;
