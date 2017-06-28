function composerHeader() {
  return {
    restrict: 'EA',
    scope: false,
    link: function(scope) {
    },
    templateUrl: "app/ui/templates/header.html"
  };
}

module.exports = composerHeader;
