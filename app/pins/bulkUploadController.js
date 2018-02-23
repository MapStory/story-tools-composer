/**
 * Controls the bulk upload behavior.
 * @param $uibModalInstance
 * @param items
 */
function bulkUploadCtrl($scope, $uibModal) {
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
    alert("Hi");
    // Open modal and start the upload wizard
    $scope.$uibModalInstance = $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: 'myModalContent.html',
      controller: this,
      controllerAs: '$ctrl',
      resolve: {
        items: function () {
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
};
bulkUploadCtrl.$inject = ["$uibModal"];

// TODO: Use es6
module.exports = bulkUploadCtrl;
