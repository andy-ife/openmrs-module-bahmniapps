'use strict';


angular.module('bahmni.common.biometrics')
    .factory('biometricService', ['$http', '$q', 'appService', 'biometricStatus', 'biometricScanner', 'biometricScanSession', 'fingerprint', 'biometricSubject', 'biometricMatch',
        /**
         * @param {angular.IHttpService} $http
         * @param {angular.IQService} $q 
         */
        function ($http, $q, appService, biometricStatus, biometricScanner, biometricScanSession, fingerprint, biometricSubject, biometricMatch) {

            var getConfig = function () {
                var biometricsConfig = appService.getAppDescriptor().getConfigValue('biometrics') || {};
                return {
                    enabled: biometricsConfig.enabled !== undefined ? biometricsConfig.enabled : true,
                    serverUrl: biometricsConfig.serverUrl || 'http://127.0.0.1:8081'
                };
            };

            var getStatus = function () {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);
                return $http.get(config.serverUrl + '/status').then(function (response) {
                    return biometricStatus.fromJSON(response.data);
                });
            };

            var getDevices = function () {
                var config = getConfig();
                if (!config.enabled) return $q.when([]);
                return $http.get(config.serverUrl + '/fingerprint/devices')
                    .then(function (response) {
                        if (angular.isArray(response.data)) {
                            return response.data.map(biometricScanner.fromJSON);
                        }
                        return [];
                    });
            };

            var getScanSession = function (uuid) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.get(config.serverUrl + '/fingerprint/session', { uuid: uuid })
                    .then(function (response) {
                        return biometricScanSession.fromJSON(response.data);
                    })
            }

            var destroyScanSession = function (uuid) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.delete(config.serverUrl + '/fingerprint/session', { uuid: uuid })
                    .then(function (response) { })
            }

            var scan = function (type, sessionId, scanType) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                var params = {
                    type: type,
                    sessionId: sessionId,
                    scanType: scanType
                };

                var url = config.serverUrl + '/fingerprint/scan';
                return $http.get(url, {
                    method: "GET",
                    params: params,
                }).then(function (response) {
                    return fingerprint.fromJSON(response.data);
                });
            };

            var enrol = function (subject) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.post(config.serverUrl + '/subject', subject)
                    .then(function (response) {
                        return biometricSubject.fromJSON(response.data);
                    });
            };

            var update = function (subject) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.put(config.serverUrl + '/subject', subject)
                    .then(function (response) {
                        return biometricSubject.fromJSON(response.data);
                    });
            };

            var match = function (request) {
                var config = getConfig();
                if (!config.enabled) return $q.when([]);

                return $http.post(config.serverUrl + '/match', request)
                    .then(function (response) {
                        if (angular.isArray(response.data)) {
                            return response.data.map(biometricMatch.fromJSON);
                        }
                        return [];
                    });
            };

            var getSubject = function (subjectId) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.get(config.serverUrl + '/subject/' + encodeURIComponent(subjectId))
                    .then(function (response) {
                        return biometricSubject.fromJSON(response.data);
                    });
            };

            return {
                getConfig: getConfig,
                getStatus: getStatus,
                getDevices: getDevices,
                getScanSession: getScanSession,
                scan: scan,
                enrol: enrol,
                update: update,
                match: match,
                getSubject: getSubject
            };
        }]);
