var directive = function($rootScope, $translate) {
  return {
    restrict: "E",
    templateUrl: "./app/time/templates/date-time-picker.html",
    replace: true,
    scope: {
      dateObject: "=dateObject",
      editable: "@editable",
      defaultDate: "=defaultDate"
    },
    link: function(scope, element, attrs) {
      if (!goog.isDefAndNotNull(scope.editable)) {
        scope.editable = "true";
      }
      if (!goog.isDefAndNotNull(attrs.time)) {
        scope.time = "true";
      } else {
        scope.time = attrs.time;
      }
      if (!goog.isDefAndNotNull(attrs.date)) {
        scope.date = "true";
      } else {
        scope.date = attrs.date;
      }
      if (!goog.isDefAndNotNull(attrs.seperateTime)) {
        scope.seperateTime = "true";
      } else {
        scope.seperateTime = attrs.seperateTime;
      }

      var hasValidDate = false;

      var updateDateTime = function() {
        if (!hasValidDate) {
          scope.dateObject = "";
          return;
        }

        var newDate = new Date();
        var picker = element.find(".datepicker").data("DateTimePicker");
        var date = null;
        if (
          goog.isDefAndNotNull(picker) &&
          goog.isDefAndNotNull(picker.date())
        ) {
          date = picker.date();
          newDate.setFullYear(date.year(), date.month(), date.date());
          newDate.setHours(
            date.hour(),
            date.minute(),
            date.second(),
            date.millisecond()
          );
        }
        var time = element.find(".timepicker").data("DateTimePicker");
        if (goog.isDefAndNotNull(time) && goog.isDefAndNotNull(time.date())) {
          time = time.date();
          newDate.setHours(
            time.hour(),
            time.minute(),
            time.second(),
            time.millisecond()
          );
        }

        var applyDate = function() {
          var momentDate = moment(new Date(dateOptions.defaultDate));
          momentDate.locale($translate.use());
          if (scope.time === "true" && scope.date === "true") {
            scope.dateObject = newDate.toISOString();
            scope.disabledText =
              momentDate.format("L") + " " + momentDate.format("LT");
          } else if (scope.time === "true") {
            scope.dateObject = newDate.toISOString().split("T")[1];
            scope.disabledText = momentDate.format("LT");
          } else if (scope.date === "true") {
            scope.dateObject = newDate.toISOString().split("T")[0];
            scope.disabledText = momentDate.format("L");
          }
        };

        if (!scope.$$phase && !$rootScope.$$phase) {
          scope.$apply(function() {
            applyDate();
          });
        } else {
          applyDate();
        }
      };

      var dateOptions = {
        defaultDate: moment("12-25-1995", "MM-DD-YYYY"),
        format:
          scope.time === "true" && scope.seperateTime === "false"
            ? "DD/MM/YYYY HH:MM"
            : "DD/MM/YYYY" /*,
        language: $translate.use()*/
      };

      var timeOptions = {
        defaultDate: moment("00:00", "HH:mm"),
        format: "HH:mm" /*,
        language: $translate.use()*/
      };

      if (scope.defaultDate) {
        var defaultDate = new Date();
        dateOptions.defaultDate = defaultDate;
        timeOptions.defaultDate = defaultDate;
      }

      var updateDate = function() {
        if (goog.isDefAndNotNull(scope.dateObject) && scope.dateObject !== "") {
          hasValidDate = true;
          if (scope.date === "false") {
            var testDate = new Utils.Date(scope.dateObject);
            if ("Invalid Date" == testDate) {
              timeOptions.defaultDate = "2014-03-10T" + scope.dateObject;
            } else {
              timeOptions.defaultDate = scope.dateObject;
            }
            if (scope.seperateTime === "false") {
              dateOptions.defaultDate = timeOptions.defaultDate;
            }
          } else if (scope.time === "false") {
            dateOptions.defaultDate = scope.dateObject.replace("Z", "");
          } else {
            dateOptions.defaultDate = scope.dateObject;
            timeOptions.defaultDate = scope.dateObject;
          }
        } else {
          hasValidDate = false;
          element.find(".form-control").val("");
        }
      };
      updateDate();

      var handleInvalidDate = function(e) {
        e.stopPropagation();

        if (e.date._i === "") {
          element.find(".form-control").val("");
        }
      };
      var onChange = function(e) {
        if (!goog.isDefAndNotNull(e.date)) {
          return;
        }
        if (e.date.isSame(e.oldDate)) {
          hasValidDate = false;
        } else {
          hasValidDate = true;
        }
        updateDateTime();
      };
      var setUpPickers = function() {
        if (scope.date === "true") {
          element.find(".datepicker").datetimepicker(dateOptions);
          element.find(".datepicker").on("change.dp", onChange);
          element.find(".datepicker").on("error.dp", handleInvalidDate);
        }
        if (
          scope.time === "true" &&
          (scope.seperateTime === "true" || scope.date === "false")
        ) {
          console.log("TIME PICKER --- > ", element.find(".timepicker"));
          element.find(".timepicker").datetimepicker(timeOptions);
          element.find(".timepicker").on("change.dp", onChange);
          element.find(".timepicker").on("error.dp", handleInvalidDate);
        }
        if (
          goog.isDefAndNotNull(dateOptions.defaultDate) ||
          goog.isDefAndNotNull(timeOptions.defaultDate)
        ) {
          hasValidDate = true;
          updateDateTime();
          var date;
          if (scope.date === "true" && scope.time === "true") {
            date = moment(dateOptions.defaultDate);
            date.locale($translate.use());
            scope.disabledText = date.format("L") + " " + date.format("LT");
          } else if (scope.time === "true") {
            date = moment(new Date(timeOptions.defaultDate));
            date.locale($translate.use());
            scope.disabledText = date.format("LT");
          } else if (scope.date === "true") {
            date = moment.utc(dateOptions.defaultDate);
            date.locale($translate.use());
            scope.disabledText = date.format("L");
          }
        } else {
          hasValidDate = false;
          scope.disabledText = "";
        }
      };
      setUpPickers();

      var dateObjectChanged = function() {
        updateDate();
        if (scope.date === "true" && hasValidDate) {
          element
            .find(".datepicker")
            .data("DateTimePicker")
            .date(dateOptions.defaultDate);
        }
        if (
          scope.time === "true" &&
          (scope.seperateTime === "true" || scope.date === "false") &&
          hasValidDate
        ) {
          element
            .find(".timepicker")
            .data("DateTimePicker")
            .date(dateOptions.defaultDate);
        }
        updateDateTime();
      };

      scope.$watch("dateObject", dateObjectChanged);

      scope.$on("translation_change", function(event, lang) {
        dateOptions.language = lang;
        timeOptions.language = lang;
      });
    }
  };
};

module.exports = directive;
