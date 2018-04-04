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

  // Properties
  $scope.selected_pin = null;
  $scope.pin_array = [];
  $scope.is_open = {
    editor: false,
    chooser: false
  };


  /**
   * When the user presses the 'Add a StoryPin' button
   */
  $scope.on_add_storypin = () => {
    $scope.is_open.editor = true;
    const pin = pinSvc.onNewStoryPin(stateSvc.getChapterIndex());
    // Add a property for keeping track of the accordion state.
    pin.is_open = true;
  };

  /**
   * Exports the current chapter's pins.
   */
  $scope.on_export_pins = () => {
    pinSvc.downloadCSV(stateSvc.config.storypins[stateSvc.getChapterIndex()])
  };

  /**
   * Returns the given chapter's pins.
   * @returns {Array|*} An array of StoryPins.
   */
  $scope.get_chapter_pins = () => {
    return pinSvc.getPins(stateSvc.getChapterIndex());
  };
}

module.exports = storypinController;