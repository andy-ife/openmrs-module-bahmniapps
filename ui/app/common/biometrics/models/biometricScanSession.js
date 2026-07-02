'use strict';

angular.module('bahmni.common.biometrics')
    .factory('biometricScanSession', [function () {
        var create = function (uuid, fingerprints) {
            return {
                uuid: uuid,
                fingerprints: fingerprints,
            };
        }

        var fromJSON = function (json) {
            if (!json) return null;
            return create(json.uuid, json.fingerprints);
        }

        return {
            create: create,
            fromJSON: fromJSON
        }
    }]);