'use strict';

angular.module('bahmni.common.biometrics')
    .factory('biometricService', ['$http', '$q', 'appService', 'biometricStatus', 'biometricScanner', 'biometricScanSession', 'fingerprint', 'biometricSubject', 'biometricMatch',
        /**
         * @param {angular.IHttpService} $http
         * @param {angular.IQService} $q */
        function ($http, $q, appService, biometricStatus, biometricScanner, biometricScanSession, fingerprint, biometricSubject, biometricMatch) {
            // inmemory cache
            // fingerType -> session
            var cachedSessions = {};

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
                    if (response.status < 200 || response.status > 299) {
                        throw new Error("Biometric device not found or fingerprint app not running");
                    }
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

            var getScanSession = function (uuid, scanType) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.get(config.serverUrl + '/fingerprint/session', { params: { uuid: uuid, scanType: scanType } })
                    .then(function (response) {
                        return biometricScanSession.fromJSON(response.data);
                    });
            };

            var destroyScanSession = function (uuid) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.delete(config.serverUrl + '/fingerprint/session', { params: { uuid: uuid } })
                    .then(function (response) {
                        // clear cache
                        for (var key in cachedSessions) {
                            if (Object.prototype.hasOwnProperty.call(cachedSessions, key)) {
                                if (cachedSessions[key].uuid === uuid) {
                                    delete cachedSessions[key];
                                }
                            }
                        }
                    });
            };

            var getCachedScanSession = function (fingerType) {
                return cachedSessions[fingerType];
            };

            var cacheScanSession = function (fingerType, session) {
                cachedSessions[fingerType] = session;
            };

            var secure = function (session) {
                session.fingerprints = session.fingerprints.map(function (e) {
                    return {
                        type: e.type,
                        format: e.format,
                        template: e.template,
                        // secure img
                        image: "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"
                    };
                });
                return session;
            };

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
                    params: params
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

            var match = function (subject) {
                var config = getConfig();
                if (!config.enabled) return $q.when([]);

                return $http.post(config.serverUrl + '/match', subject)
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
                    }).catch(function (e) {
                        return {};
                    });
            };

            return {
                getConfig: getConfig,
                getStatus: getStatus,
                getDevices: getDevices,
                getScanSession: getScanSession,
                destroyScanSession: destroyScanSession,
                scan: scan,
                enrol: enrol,
                update: update,
                match: match,
                getSubject: getSubject,
                getCachedScanSession: getCachedScanSession,
                cacheScanSession: cacheScanSession,
                secure: secure
            };
        }]);
