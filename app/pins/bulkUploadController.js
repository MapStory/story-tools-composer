/**
 * Controls the bulk upload behavior.
 * @param $scope
 *
 *
 * fdsafds
 * afdsa
 * fdsa
 * fds
 * afdsa
 * fdsa
 * fdsa
 * @param $uibModal
 */

function bulkUploadCtrl($scope, $uibModal, pinSvc) {
  $scope.items = [];
  $scope.selected = {
    item: $scope.items[0]
  };

  $scope.onBulkPinAdd = () => {
    // Open modal and start the upload wizard
    pinSvc.$uibModalInstance = $uibModal.open({
      animation: true,
      ariaLabelledBy: "modal-title",
      ariaDescribedBy: "modal-body",
      templateUrl: "myModalContent.html",
      controller: "bulkUploadModalController",
      resolve: {
        items: () => "hello"
      }
    });

    pinSvc.$uibModalInstance.result.then(
      resolved => {
        pinSvc.selected = resolved;
      },() => {
        let x = 3;
      });
  };
}
bulkUploadCtrl.$inject = ["$scope", "$uibModal"];

// TODO: Use es6
module.exports = bulkUploadCtrl;
