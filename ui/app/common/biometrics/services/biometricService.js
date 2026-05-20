'use strict';

angular.module('bahmni.common.biometrics')
    .factory('biometricService', ['$http', '$q', 'appService', 'biometricStatus', 'biometricScanner', 'fingerprint', 'biometricSubject', 'biometricMatch',
        function ($http, $q, appService, biometricStatus, biometricScanner, fingerprint, biometricSubject, biometricMatch) {
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
                return $http.get(config.serverUrl + '/status')
                    .then(function (response) {
                        return biometricStatus.fromJSON(response.data);
                    })
                    .catch(function (error) {
                        console.error('Biometric server not reachable:', error);
                        return null;
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
                    })
                    .catch(function (error) {
                        console.error('Failed to get fingerprint devices:', error);
                        return [];
                    });
            };

            var scan = function (type) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                var url = config.serverUrl + '/fingerprint/scan';
                if (type) {
                    url += '?type=' + encodeURIComponent(type);
                }

                return $http.get(url)
                    .then(function (response) {
                        return fingerprint.fromJSON(response.data);
                    })
                    .catch(function (error) {
                        console.error('Failed to scan fingerprint:', error);
                        return null;
                    });
            };

            var enrol = function (subject) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.post(config.serverUrl + '/subject', subject)
                    .then(function (response) {
                        return biometricSubject.fromJSON(response.data);
                    })
                    .catch(function (error) {
                        console.error('Failed to enrol subject:', error);
                        throw error;
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
                    })
                    .catch(function (error) {
                        console.error('Failed to match fingerprint:', error);
                        throw error;
                    });
            };

            var getSubject = function (subjectId) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.get(config.serverUrl + '/subject/' + encodeURIComponent(subjectId))
                    .then(function (response) {
                        return biometricSubject.fromJSON(response.data);
                    })
                    .catch(function (error) {
                        console.error('Failed to get subject:', error);
                        throw error;
                    });
            };

            return {
                getConfig: getConfig,
                getStatus: getStatus,
                getDevices: getDevices,
                scan: scan,
                enrol: enrol,
                match: match,
                getSubject: getSubject
            };
        }]);
