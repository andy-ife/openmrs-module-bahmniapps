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

            var getScanSession = function (uuid) {
                var config = getConfig();
                if (!config.enabled) return $q.when(null);

                return $http.get(config.serverUrl + '/fingerprint/session', { params: { uuid: uuid } })
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
                    }
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
