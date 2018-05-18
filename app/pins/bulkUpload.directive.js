function bulkUploadDirective() {
  return {
    restrict: "E",
    templateUrl: "myModalContent.html",
    controller: "bulkUploadCtrl",
    controllerAs: "$ctrl",
    scope: {
      test_me: () => {
        alert("huevo");
      }
    }
  };
}

module.exports = bulkUploadDirective;
