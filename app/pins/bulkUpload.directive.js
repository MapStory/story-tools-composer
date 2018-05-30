function bulkUploadDirective() {
  return {
    restrict: "E",
    templateUrl: "myModalContent.html",
    controller: "bulkUploadCtrl",
    controllerAs: "$ctrl",
    scope: {}
  };
}

module.exports = bulkUploadDirective;
