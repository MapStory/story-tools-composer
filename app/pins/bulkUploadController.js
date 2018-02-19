/**
 * Controls the bulk upload behavior.
 * @param $uibModalInstance
 * @param items
 */
const storyPinController = ($uibModalInstance, items) => {
  var $ctrl = this;
  $ctrl.items = items;
  $ctrl.selected = {
    item: $ctrl.items[0]
  };

  $ctrl.ok = function () {
    $uibModalInstance.close($ctrl.selected.item);
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
};

module.export = storyPinController;
