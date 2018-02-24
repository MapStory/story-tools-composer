/**
 * Controls the bulk upload behavior.
 * @param $scope
 * @param $uibModal
 */

function bulkUploadModalController($scope, pinSvc) {

  $scope.testb = "Hi it works!";

  $scope.processCSVFile = () => {
    console.log("invoking processCSVFile()");
    pinSvc.processCSVFile();
  };

}

bulkUploadModalController.$inject = ["$scope", "pinSvc"];

module.exports = bulkUploadModalController;
