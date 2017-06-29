function sidebar() {
  return {
    restrict: 'EA',
    scope: false,
    link: function($scope) {
    },
    templateUrl: "app/ui/templates/sidebar.html"
  };
}

module.exports = sidebar;
