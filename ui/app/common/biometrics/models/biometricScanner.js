'use strict';

angular.module('bahmni.common.biometrics')
    .factory('biometricScanner', [function () {
        var create = function (id, displayName, firmwareVersion, brightness, imageDpi, imageHeight, imageWidth) {
            return {
                id: id,
                displayName: displayName,
                firmwareVersion: firmwareVersion,
                brightness: brightness,
                imageDpi: imageDpi,
                imageHeight: imageHeight,
                imageWidth: imageWidth
            };
        };

        var fromJSON = function (json) {
            if (!json) return null;
            return create(json.id, json.displayName, json.firmwareVersion, json.brightness, json.imageDpi, json.imageHeight, json.imageWidth);
        };

        return {
            create: create,
            fromJSON: fromJSON
        };
    }]);
