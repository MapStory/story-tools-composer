import moment from "moment";

function dateValidatorDirective() {
  return {
    restrict: "A",
    require: "ngModel",
    link: ($scope, element, attr, ngModel) => {
      ngModel.$validators.validTime = (modelValue, viewValue) => {
        console.log("Valid?", modelValue, viewValue);
        if ($scope.frameSettings.length === 0) {
          return true;
        }

        const setDate = viewValue;

        if (setDate === undefined) {
          return false;
        }

        const momentSetDate = moment(setDate, $scope.momentFormat);
        if (momentSetDate.isAfter($scope.maxMoment)) {
          console.log("Invalid", $scope.storyFrameDetails);
          // $scope.frameSettings[0][varName] = maxMoment.toDate();
          return false;
        } else if (momentSetDate.isBefore($scope.minMoment)) {
          console.log("Invalid", $scope.storyFrameDetails);
          // $scope.frameSettings[0][varName] = minMoment.toDate();
          return false;
        }
        return true;
      };
    }
  };
}

module.exports = dateValidatorDirective;
