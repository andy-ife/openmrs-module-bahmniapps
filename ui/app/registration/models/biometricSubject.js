'use strict';

angular.module('bahmni.registration')
    .factory('biometricSubject', ['fingerprint', function (fingerprint) {
        var create = function (subjectId, fingerprints) {
            return {
                subjectId: subjectId,
                fingerprints: fingerprints || []
            };
        };

        var fromJSON = function (json) {
            if (!json) return null;
            var fps = [];
            if (json.fingerprints && json.fingerprints.length > 0) {
                fps = json.fingerprints.map(function (fpJson) {
                    return fingerprint.fromJSON(fpJson);
                });
            }
            return create(json.subjectId, fps);
        };

        return {
            create: create,
            fromJSON: fromJSON
        };
    }]);
