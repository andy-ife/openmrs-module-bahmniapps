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
                scope.imgSrc = null;
                scope.showSave = false;

                scope.$watch('scanSession', function (newSession) {
                    if (newSession && newSession.fingerprints && newSession.fingerprints.length > 0) {
                        scope.success = true;
                        scope.fingerprint = newSession.fingerprints[newSession.fingerprints.length - 1];
                        scope.imgSrc = scope.fingerprint.image;
                        scope.showSave = (newSession.fingerprints.length >= newSession.maxCount);
                    }
                });

                scope.getScanHelperImg = function () {
                    var images = {
                        1: "fp-helper-1.png",
                        2: "fp-helper-2.png",
                        3: "fp-helper-3.png",
                        4: "fp-helper-4.png",
                        5: "fp-helper-5.png",
                        6: "fp-helper-6.png",
                        7: "fp-helper-7.png",
                        8: "fp-helper-8.png",
                        9: "fp-helper-9.png",
                        10: "fp-helper-10.png",
                        11: "fp-helper-2.png"
                    };
                    return "../images/biometrics/" + images[scope.type] || '';
                };

                scope.getScanStatusTitle = function () {
                    if (scope.scanning) return $translate.instant("FP_SCAN_SCANNING");
                    if (scope.success) {
                        var fingerprints = scope.scanSession.fingerprints || [];
                        var maxCount = scope.scanSession.maxCount;
                        if (fingerprints.length < maxCount) {
                            return $translate.instant("FP_SCANS_LEFT") + ": " + (maxCount - fingerprints.length);
                        }
                        else {
                            return $translate.instant("FP_SCAN_FINISHED");
                        }
                    }
                    if (scope.error) return "";
                    return "";
                };

                scope.getScanStatusSubtitle = function () {
                    if (scope.scanning) return $translate.instant("FP_SCAN_SCANNING_SUBTITLE");
                    if (scope.success) {
                        var fingerprints = scope.scanSession.fingerprints || [];
                        var maxCount = scope.scanSession.maxCount;
                        if (fingerprints.length < maxCount) {
                            return $translate.instant("FP_SCANS_LEFT_SUBTITLE");
                        }
                        else {
                            return $translate.instant("FP_SCAN_FINISHED_SUBTITLE");
                        }
                    }
                    if (scope.error) return "";
                    return $translate.instant("FP_SCAN_DEFAULT_SUBTITLE");
                };

                scope.getScanInstructions = function () {
                    if (scope.scanType == 'registration') {
                        return $translate.instant("FP_SCAN_INSTRUCTIONS");
                    } else {
                        return $translate.instant("FP_SCAN_INSTRUCTIONS_SEARCH");
                    }
                };

                scope.getConfirmBtnText = function () {
                    if (scope.scanType == 'registration') {
                        return $translate.instant("REGISTRATION_LABEL_SAVE");
                    } else {
                        return $translate.instant("REGISTRATION_LABEL_SEARCH");
                    }
                };

                scope.scan = function () {
                    var fingerprints = scope.scanSession.fingerprints || [];
                    var maxCount = scope.scanSession.maxCount;
                    var sessionId = scope.scanSession.uuid;

                    if (scope.scanning || fingerprints.length >= maxCount) { return; }

                    scope.error = scope.success = scope.showSave = false;
                    scope.imgSrc = null;
                    scope.scanning = true;

                    biometricService.scan(scope.type, sessionId, scope.scanType)
                        .then(function (result) {
                            scope.success = true;
                            scope.scanning = false;
                            scope.imgSrc = result.image;
                            fingerprints.push(result);
                            scope.scanSession.fingerprints = fingerprints;

                            biometricService.cacheScanSession(scope.type, scope.scanSession);

                            if (fingerprints.length >= maxCount) {
                                scope.showSave = true;
                            }
                            messagingService.showMessage("info", "FP_SCAN_SUCCESS");
                        })
                        .catch(function (e) {
                            console.log(e);
                            scope.error = true;
                            scope.scanning = false;
                            messagingService.showMessage("error", "FP_SCAN_FAIL");
                        });
                };

                scope.save = function () {
                    if (scope.onSave) {
                        biometricService.destroyScanSession(scope.scanSession.uuid).then(function (_) {
                            var fingerprints = scope.scanSession.fingerprints || [];
                            scope.onSave({ scannedFingerprints: fingerprints.splice(0, 1) });
                        });
                    }
                    scope.error = scope.success = scope.showSave = scope.scanning = false;
                    scope.imgSrc = null;
                };

                scope.cancel = function () {
                    var sessionId = scope.scanSession.uuid;
                    biometricService.destroyScanSession(sessionId).then(function (_) {
                        scope.error = scope.success = scope.showSave = scope.scanning = false;
                        scope.imgSrc = null;
                        if (scope.scanSession.fingerprints) {
                            scope.scanSession.fingerprints.length = 0;
                        }

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
                    var sessionId = scope.scanSession.uuid;
                    biometricService.destroyScanSession(sessionId).then(function (_) {
                        scope.error = scope.success = scope.showSave = scope.scanning = false;
                        scope.imgSrc = null;
                        if (scope.scanSession.fingerprints) {
                            scope.scanSession.fingerprints.length = 0;
                        }
                        // get a new session
                        biometricService.getScanSession(null, scope.scanType).then(function (newSession) {
                            scope.scanSession.uuid = newSession.uuid;
                        });
                    });
                };

                scope.retry = function () {
                    scope.error = scope.success = scope.showSave = scope.scanning = false;
                    scope.imgSrc = null;
                };

                iElement.on("dialogclose", function () {
                    scope.$evalAsync(function () {
                        scope.error = scope.success = scope.showSave = scope.scanning = false;
                        scope.imgSrc = null;
                    });
                });
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
