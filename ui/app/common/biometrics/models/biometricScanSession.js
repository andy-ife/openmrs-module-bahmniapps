'use strict';

angular.module('bahmni.common.biometrics')
    .factory('biometricScanSession', [function () {
        var create = function (uuid, fingerprints, maxCount) {
            return {
                uuid: uuid,
                fingerprints: fingerprints,
                maxCount: maxCount
            };
        };

        var fromJSON = function (json) {
            if (!json) return null;
            return create(json.uuid, json.fingerprints, json.maxCount);
        };

        return {
            create: create,
            fromJSON: fromJSON
        };
    }]);
