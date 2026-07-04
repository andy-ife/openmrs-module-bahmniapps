'use strict';

angular.module('bahmni.common.biometrics')
    .directive('fingerprintScannerDialog', ['appService', 'biometricService', 'messagingService', 'spinner', '$parse', '$translate',
        function (appService, biometricService, messagingService, spinner, $parse, $translate) {
            /**
        * @param {angular.IAugmentedJQuery} iElement
        * @param {angular.IAttributes} iAttrs
        * */
            var link = function (scope, iElement, iAttrs) {
                scope.scanning = false;
                scope.success = false;
                scope.error = false;
                scope.fingerprint = {};
                scope.showSave = false;

                var fingerprints = scope.scanSession.fingerprints;
                var sessionId = scope.scanSession.uuid;
                var maxCount = scope.scanSession.maxCount;

                scope.getFingerprintTitle = function () {
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
                        10: 'FP_LABEL_LEFT_LITTLE'
                    };
                    return titles[scope.type] || 'FP_LABEL_UNKNOWN';
                };

                scope.getFingerprintScanImg = function () {
                    // TODO: Update these images
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
                    return "../images/biometrics/" + images[scope.type] || '';
                };

                scope.getScanStatusTitle = function () {
                    if (scope.scanning) return "FP_SCAN_SCANNING";
                    if (scope.success) {
                        if (fingerprints.length < maxCount) {
                            return "FP_SCANS_LEFT: " + maxCount - fingerprints.length;
                        }
                        else {
                            return "FP_SCAN_FINISHED";
                        }
                    }
                    if (scope.error) return "";
                    return "";
                };

                scope.getScanStatusSubtitle = function () {
                    if (scope.scanning) return "FP_SCAN_SCANNING_SUBTITLE";
                    if (scope.success) {
                        if (fingerprints.length < maxCount) {
                            return "FP_SCANS_LEFT_SUBTITLE";
                        }
                        else {
                            return "FP_SCAN_FINISHED_SUBTITLE";
                        }
                    }
                    if (scope.error) return "";
                    return "FP_SCAN_DEFAULT_SUBTITLE";
                };

                scope.scan = function () {
                    if (scope.scanning || fingerprints.length >= maxCount) { return; }

                    scope.error = scope.success = scope.showSave = false;
                    scope.fingerprint = null;
                    scope.scanning = true;

                    biometricService.scan(scope.type, sessionId, scope.scanType)
                        .then(function (result) {
                            scope.success = true;
                            scope.scanning = false;

                            scope.fingerprint = result;
                            fingerprints.push(result);

                            if (fingerprints.length >= maxCount) {
                                scope.showSave = true;
                            }
                            messagingService.showMessage("info", "FP_SCAN_SUCCESS");
                        })
                        .catch(function (e) {
                            console.log(e);
                            scope.error = true;
                            scope.scanning = false;
                            messagingService.showMessage("error", e);
                        });
                };

                scope.save = function () {
                    if (scope.onsave) {
                        scope.onSave({ scannedFingerprints: fingerprints });
                    }
                };

                scope.cancel = function () {
                    biometricService.destroyScanSession(sessionId).then(function (_) {
                        scope.error = scope.success = scope.showSave = scope.scanning = false;
                        scope.fingerprint = null;
                        fingerprints.length = 0;

                        if (iElement.dialog && iElement.hasClass('ui-dialog-content')) {
                            iElement.dialog("close");
                        } else if (iElement.closest('.ui-dialog-content').length) {
                            iElement.closest('.ui-dialog-content').dialog("close");
                        }

                        if (scope.onCancel) {
                            scope.onCancel();
                        }
                    });
                };

                scope.restart = function () {
                    biometricService.destroyScanSession(sessionId).then(function (_) {
                        scope.error = scope.success = scope.showSave = scope.scanning = false;
                        scope.fingerprint = null;
                        fingerprints.length = 0;
                        // get a new session
                        biometricService.getScanSession().then(function (newSession) {
                            sessionId = newSession.uuid;
                        });
                    });
                };

                scope.retry = function () {
                    scope.error = scope.success = scope.showSave = scope.scanning = false;
                    scope.fingerprint = null;
                };
            };
            return {
                templateUrl: '../common/biometrics/views/fingerprintScannerDialog.html',
                restrict: 'E',
                scope: {
                    scanSession: '=',
                    type: '=', // finger position
                    scanType: '=', // registration or search
                    onSave: '&',
                    onCancel: '&' // optional
                },
                link: link
            };
        }
    ]);
