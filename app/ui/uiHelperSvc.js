'use strict';

function uiHelperSvc($location, $rootScope, $log, stateSvc, pinSvc, appConfig) {
  const svc = {};

  svc.activePin = null;

  svc.togglePinForm = $index => {
    const i = $index.$index;
    if (svc.activePin === i) {
      svc.activePin = null;
    } else {
      svc.activePin = i;
    }
  };

  svc.addNewPin = () => {
    pinSvc.addEmptyPinToCurrentChapter();
    svc.activePin = pinSvc.getPins(stateSvc.getChapterIndex()).length;
  };

  return svc;
}

module.exports = uiHelperSvc;
