'use strict';

angular.module('bahmni.common.biometrics')
    .factory('biometricMatch', [function () {
        var create = function (subjectId, matchScore, confidenceLevel) {
            return {
                subjectId: subjectId,
                matchScore: matchScore,
                confidenceLevel: confidenceLevel
            };
        };

        var fromJSON = function (json) {
            if (!json) return null;
            return create(json.subjectId, json.matchScore, json.confidenceLevel);
        };

        return {
            create: create,
            fromJSON: fromJSON
        };
    }]);
