function bulkUploadModalController($scope, pinSvc) {
  $scope.processCSVFile = () => {
    pinSvc.processCSVFile();
  };

  $scope.cancel = () => {
    pinSvc.$uibModalInstance.close();
  };
}

bulkUploadModalController.$inject = ["$scope", "pinSvc"];
module.exports = bulkUploadModalController;
