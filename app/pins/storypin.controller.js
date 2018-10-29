/**
 * Controller for the StoryPin Tab.
 * @param $scope The current Scope.
 * @param pinSvc StoryPin Service.
 * @param stateSvc State Service.
 */
function storypinController($scope, pinSvc, stateSvc) {
  // Services
  $scope.pinSvc = pinSvc;
  $scope.stateSvc = stateSvc;

  $scope.isOpen = {
    editor: false,
    chooser: false
  };

  /**
   * When the user presses the 'Add a StoryPin' button
   */
  $scope.onAddStoryPin = () => {
    $scope.isOpen.editor = true;
    const pin = pinSvc.onNewStoryPin(stateSvc.getChapterIndex());
    // Add a property for keeping track of the accordion state.
    pin.isOpen = true;
    // Save the new pin to the config.
    pinSvc.onStoryPinSave();
  };

  /**
   * Exports the current chapter's pins.
   */
  $scope.onExportPins = () => {
    pinSvc.downloadCSV(pinSvc.getCurrentPins());
  };
}

module.exports = storypinController;
