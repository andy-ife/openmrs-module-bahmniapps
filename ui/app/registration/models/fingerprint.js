'use strict';

angular.module('bahmni.registration')
    .factory('fingerprint', [function () {
        var create = function (type, format, template, image) {
            return {
                type: type,
                format: format,
                template: template,
                image: image
            };
        };

        var fromJSON = function (json) {
            if (!json) return null;
            return create(json.type, json.format, json.template, json.image);
        };

        return {
            create: create,
            fromJSON: fromJSON
        };
    }]);
