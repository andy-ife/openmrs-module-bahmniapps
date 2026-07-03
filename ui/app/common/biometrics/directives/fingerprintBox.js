'use strict';

angular.module("bahmni.common.biometrics")
    .directive("fingerprintBox", function () {
        var link = function ($scope) {
            $scope.getImgSrc = function () {
                if ($scope.error) {
                    return '../images/fp-error.png';
                }
                if ($scope.imgSrc) {
                    return $scope.imgSrc;
                }
                if ($scope.success) {
                    return '../images/fp-success.png';
                }
                return '../images/fp-default.png';
            };

            $scope.overlaySrc = '../images/fp-scanning.png';
        };

        return {
            restrict: 'E',
            link: link,
            scope: {
                scanning: '=',
                error: '=',
                imgSrc: '=',
                success: '=',
                canEdit: '=',
                fingerprintCount: '='
            },
            template:
                "  <img class=\"fp-overlay\"ng-hide=\"!scanning\"ng-src= \"{{ overlaySrc }}\"/>" +
                "  <img ng-src=\"{{ getImgSrc() }}\" " +
                "       class=\"fp-img\" />" +
                "  <span ng-hide=\"scanning || imgSrc\" " +
                "        ng-class=\"{" +
                "          'fp-error-text': error," +
                "          'fp-success-text': success && !imgSrc" +
                "        }\">" +
                "    <span ng-if=\"error\">{{ error }}</span>" +
                "    <span ng-if=\"!error && success && fingerprintCount != null\">" +
                "      {{ fingerprintCount }} fingerprints enrolled" +
                "    </span>" +
                "  </span>"
        };
    });