'use strict';

angular.module('bahmni.common.biometrics')
    .factory('biometricMatch', [function () {
        var create = function (subjectId, matchScore) {
            return {
                subjectId: subjectId,
                matchScore: matchScore
            };
        };

        var fromJSON = function (json) {
            if (!json) return null;
            return create(json.subjectId, json.matchScore);
        };

        return {
            create: create,
            fromJSON: fromJSON
        };
    }]);
