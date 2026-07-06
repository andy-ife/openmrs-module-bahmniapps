'use strict';

angular.module('bahmni.common.biometrics')
    .directive('fingerprintBtn', ['appService', 'biometricService', 'messagingService', 'spinner', '$parse', '$translate', 'confirmBox',
        function (appService, biometricService, messagingService, spinner, $parse, $translate, confirmBox) {
            /**
         * @param {angular.IAugmentedJQuery} iElement
         * @param {angular.IAttributes} iAttrs
         */
            var link = function (scope, iElement, iAttrs) {
                var patientFingerprints = [];

                var getConfig = function () {
                    var biometricsConfig = appService.getAppDescriptor().getConfigValue('biometrics') || {};
                    return {
                        enabled: biometricsConfig.enabled !== undefined ? biometricsConfig.enabled : true,
                        serverUrl: biometricsConfig.serverUrl || 'http://127.0.0.1:8081'
                    };
                };

                var getPatientFingerprints = function () {
                    var patientId = scope.patientId;
                    if (!patientId || angular.isObject(patientId) && angular.equals(patientId, {})) {
                        return Promise.resolve({ fingerprints: [] });
                    }
                    if (getConfig().enabled) {
                        return biometricService.getSubject(patientId)
                            .then(function (response) {
                                return response;
                            }).catch(function (e) {
                                return {};
                            });
                    } else {
                        return Promise.resolve();
                    }
                };

                scope.$watch('patientId', function (newVal, oldVal) {
                    getPatientFingerprints().then(function (response) {
                        var fetchedFingerprints = (response && response.fingerprints) ? response.fingerprints : [];

                        var allFingerprints = [
                            { type: 1 }, { type: 2 }, { type: 3 }, { type: 4 },
                            { type: 5 }, { type: 6 }, { type: 7 }, { type: 8 },
                            { type: 9 }, { type: 10 }].map(function (e) {
                                if (fetchedFingerprints.length == 0) {
                                    return e;
                                }
                                for (var i = 0; i < fetchedFingerprints.length; i++) {
                                    if (e.type === fetchedFingerprints[i].type) {
                                        return {
                                            type: e.type,
                                            image: fetchedFingerprints[i].image,
                                            template: fetchedFingerprints[i].template,
                                            format: fetchedFingerprints[i].format
                                        };
                                    }
                                }
                                return e;
                            });

                        scope.$evalAsync(function () {
                            scope.rightFingerprints = allFingerprints.splice(0, 5);
                            scope.leftFingerprints = allFingerprints;
                        })

                    }).catch(function (e) {
                        // do nothing
                    });
                });

                scope.currentScanSession = { uuid: '', fingerprints: [] };
                scope.currentType = 1;

                var fingerprintListDialogElement = iElement.find(".fingerprintListDialog");
                var fpListDialogOpen = false;

                var fingerprintScannerDialogElement = iElement.find(".fp-scanner-dialog-container");
                var fpScanDialogOpen = false;

                var isEnrolled = function (fingerprint) {
                    return fingerprint.template !== null && fingerprint.template !== undefined;
                };

                scope.getFingerprintTitle = function (type) {
                    var titles = {
                        1: 'FP_LABEL_THUMB',
                        2: 'FP_LABEL_INDEX',
                        3: 'FP_LABEL_MIDDLE',
                        4: 'FP_LABEL_RING',
                        5: 'FP_LABEL_LITTLE',
                        6: 'FP_LABEL_THUMB',
                        7: 'FP_LABEL_INDEX',
                        8: 'FP_LABEL_MIDDLE',
                        9: 'FP_LABEL_RING',
                        10: 'FP_LABEL_LITTLE'
                    };
                    return titles[type] || 'FP_LABEL_UNKNOWN';
                };

                scope.getFingerprintLabelImg = function (type) {
                    var images = {
                        1: "fp-label-1.png",
                        2: "fp-label-2.png",
                        3: "fp-label-3.png",
                        4: "fp-label-4.png",
                        5: "fp-label-5.png",
                        6: "fp-label-6.png",
                        7: "fp-label-7.png",
                        8: "fp-label-8.png",
                        9: "fp-label-9.png",
                        10: "fp-label-10.png"
                    };
                    return "../images/biometrics/" + images[type] || '';
                };

                scope.launchPopup = function () {
                    if (scope.scanType === 'registration') {
                        scope.launchFingerprintListPopup();
                    } else {
                        scope.launchFingerprintScannerPopup({ type: 11 });
                    }
                }

                scope.launchFingerprintListPopup = function () {
                    if (fpListDialogOpen) {
                        return;
                    }
                    fpListDialogOpen = true;
                    fingerprintListDialogElement.dialog('open');
                };

                scope.launchFingerprintScannerPopup = function (fingerprint) {
                    if (fpScanDialogOpen) {
                        return;
                    }
                    if (fingerprint.template != null && fingerprint.template != undefined) {
                        // no editing saved prints for now
                        return;
                    }
                    fpScanDialogOpen = true;
                    var cachedSession = scope.scanType === "registration" ? biometricService.getCachedScanSession(fingerprint.type) || {} : {};

                    return spinner.forPromise(
                        biometricService.getStatus()
                            .then(function (_) { return biometricService.getScanSession(cachedSession.uuid || null, scope.scanType); })
                    ).then(function (result) {
                        var scanSession = result.data || result;
                        var hasFingerprints = scanSession && scanSession.fingerprints && scanSession.fingerprints.length > 0;

                        var openDialogWithSession = function (sessionToPass) {
                            scope.currentScanSession = sessionToPass;
                            scope.currentScanType = scope.scanType;
                            scope.currentType = fingerprint.type || null;
                            var titles = {
                                1: 'FP_LABEL_RIGHT_THUMB',
                                2: 'FP_LABEL_RIGHT_INDEX',
                                3: 'FP_LABEL_RIGHT_MIDDLE',
                                4: 'FP_LABEL_RIGHT_RING',
                                5: 'FP_LABEL_RIGHT_LITTLE',
                                6: 'FP_LABEL_LEFT_THUMB',
                                7: 'FP_LABEL_LEFT_INDEX',
                                8: 'FP_LABEL_LEFT_MIDDLE',
                                9: 'FP_LABEL_LEFT_RING',
                                10: 'FP_LABEL_LEFT_LITTLE',
                                11: 'REGISTRATION_LABEL_SEARCH_FINGERPRINT',

                            };
                            var scanTitle = titles[fingerprint.type] || 'FP_LABEL_UNKNOWN';
                            fingerprintScannerDialogElement.dialog('option', 'title', $translate.instant(scanTitle));
                            fingerprintScannerDialogElement.dialog('open');
                        };

                        if (hasFingerprints) {
                            biometricService.cacheScanSession(fingerprint.type, scanSession);
                            var dialogScope = {};
                            dialogScope.message = $translate.instant('REGISTRATION_LABEL_SESSION_FOUND');
                            dialogScope.newSession = function (closeConfirmBox) {
                                closeConfirmBox();
                                // destroy old session
                                biometricService.destroyScanSession(scanSession.uuid).then(function () {
                                    // get a new session
                                    biometricService.getScanSession(null, scope.scanType).then(function (result) {
                                        openDialogWithSession(result.data || result);
                                    })
                                });
                            };
                            dialogScope.resume = function (closeConfirmBox) {
                                closeConfirmBox();
                                openDialogWithSession(biometricService.secure(scanSession));
                            };

                            confirmBox({
                                scope: dialogScope,
                                actions: [{ name: 'newSession', display: 'New Session' }, { name: 'resume', display: 'Resume' }],
                                className: "ngdialog-theme-default"
                            });
                        } else {
                            openDialogWithSession(scanSession);
                        }
                    }).catch(function (e) {
                        fpScanDialogOpen = false;
                        console.log(e);
                        if (e == "Biometric device not found or fingerprint app not running") {
                            messagingService.showMessage("error", "BIOMETRIC_DEVICE_NOT_FOUND");
                        }
                        else {
                            messagingService.showMessage("error", "FETCH_SCAN_SESSION_ERROR");
                        }
                    });
                };

                scope.handleSaveFromScanner = function (scannedFingerprints) {
                    if (scope.onSave) {
                        scope.onSave({ fingerprints: scannedFingerprints });
                    }
                    fingerprintScannerDialogElement.dialog('close');
                    fingerprintListDialogElement.dialog('close');
                };

                scope.handleCancelFromScanner = function () {
                    fingerprintScannerDialogElement.dialog('close');
                    fingerprintListDialogElement.dialog('close');
                };

                fingerprintListDialogElement.dialog({
                    autoOpen: false,
                    height: "auto",
                    width: "auto",
                    modal: true,
                    title: $translate.instant('SCAN_AND_ENROLL_FINGERPRINTS_TITLE'),
                    close: function () {
                        fpListDialogOpen = false;
                    }
                });

                fingerprintScannerDialogElement.dialog({
                    autoOpen: false,
                    height: "auto",
                    width: "auto",
                    modal: true,
                    close: function () {
                        fpScanDialogOpen = false;
                    }
                });

                iElement.bind("$destroy", function () {
                    fingerprintListDialogElement.dialog("destroy");
                    fingerprintScannerDialogElement.dialog("destroy");
                    fpScanDialogOpen = false;
                    fpListDialogOpen = false;
                });
            };

            return {
                templateUrl: '../common/biometrics/views/fingerprintButtonDialog.html',
                restrict: 'A',
                scope: {
                    patientId: "=",
                    scanType: "=",
                    onSave: "&"
                },
                link: link
            };
        }]);
