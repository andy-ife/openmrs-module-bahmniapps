'use strict';

angular.module('bahmni.common.biometrics')
    .factory('biometricStatus', [function () {
        var create = function (enabled, numberEnrolled, statusMessage) {
            return {
                enabled: enabled || false,
                numberEnrolled: numberEnrolled || 0,
                statusMessage: statusMessage
            };
        };

        var fromJSON = function (json) {
            if (!json) return null;
            return create(json.enabled, json.numberEnrolled, json.statusMessage);
        };

        return {
            create: create,
            fromJSON: fromJSON
        };
    }]);
