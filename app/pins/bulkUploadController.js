/**
 * Controls the bulk upload behavior.
 * @param $scope
 * @param $uibModal
 */

function bulkUploadCtrl($scope, $uibModal) {

  $scope.testb = "yes it works";
  // const $ctrl = {};
  $scope.items = [];
  $scope.selected = {
    item: $scope.items[0]
  };

  $scope.test_me = "hiiiii";

  $scope.ok = () => {
    $scope.$uibModalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $scope.$uibModalInstance.dismiss("cancel");
  };

  $scope.onBulkPinAdd = () => {
    // Open modal and start the upload wizard
    $scope.$uibModalInstance = $uibModal.open({
      animation: true,
      ariaLabelledBy: "modal-title",
      ariaDescribedBy: "modal-body",
      templateUrl: "myModalContent.html",
      controller: "bulkUploadModalController",
      resolve: {
        items : function () {
          return "hello";
        }
      }
    });

    $scope.$uibModalInstance.result.then(
      resolved => {
        $scope.selected = resolved;
      }, function () {
        let x = 3;
      });
  };
}
bulkUploadCtrl.$inject = ["$scope", "$uibModal"];

// TODO: Use es6
module.exports = bulkUploadCtrl;
