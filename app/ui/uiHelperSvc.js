'use strict';

function uiHelperSvc($location, $rootScope, $log, stateSvc, appConfig) {
  var svc = {};

  svc.togglePinForm = function($index) {
    var i = $index.$index;
    var $pins = $('[id^="pin-form-"]');
    var $pin = $('#pin-form-' + i);
    if ($pin.css('display') === 'none') {
      $pins.css('display', 'none');
      $('#pin-form-' + i).css('display', 'block');
    } else {
      $('#pin-form-' + i).css('display', 'none');
    }
  };

  return svc;

}

module.exports = uiHelperSvc;
