'use strict';

angular.module('bahmni.common.fingerprintButton')
    .directive('fingerprintBtn', ['appService', 'biometricService', 'messagingService', 'spinner', '$parse', '$translate', 'confirmBox',
        function (appService, biometricService, messagingService, spinner, $parse, $translate, confirmBox) {
            /**
         * @param {angular.IAugmentedJQuery} iElement
         * @param {angular.IAttributes} iAttrs
         */
            var link = function (scope, iElement, iAttrs) {
                var getConfig = function () {
                    var biometricsConfig = appService.getAppDescriptor().getConfigValue('biometrics') || {};
                    return {
                        enabled: biometricsConfig.enabled !== undefined ? biometricsConfig.enabled : true,
                        serverUrl: biometricsConfig.serverUrl || 'http://127.0.0.1:8081'
                    };
                };

                var ngModelValue = $parse(iAttrs.ngModel)(scope) || {};
                var patientFingerprints = ngModelValue.fingerprints || [];
                var scanType = $parse(iAttrs.scanType)(scope);
                var onSave = $parse(iAttrs.onSave)(scope, { fingerprints: scannedFingerprints });

                var allFingerprints = [
                    { type: 1 }, { type: 2 }, { type: 3 }, { type: 4 },
                    { type: 5 }, { type: 6 }, { type: 7 }, { type: 8 },
                    { type: 9 }, { type: 10 }].map(function (e) {
                        for (var i = 0; i < patientFingerprints.length; i++) {
                            if (e.type === patientFingerprints[i].type) {
                                e.image = patientFingerprints[i].image;
                                e.template = patientFingerprints[i].template;
                                e.format = patientFingerprints[i].format;
                            }
                        }
                    });

                scope.rightFingerprints = allFingerprints.splice(0, 5);
                scope.leftFingerprints = allFingerprints.splice(5);

                var fingerprintListDialogElement = iElement.find(".fingerprintListDialog");
                var fpListDialogOpen = false;

                var fingerprintScannerDialogElement = iElement.find("fingerprint-scanner-dialog");
                var fpScanDialogOpen = false;
                var scanSessionCache = {};

                var isEnrolled = function (fingerprint) {
                    return fingerprint.template !== null && fingerprint.template !== undefined;
                };

                scope.getFingerprintTitle = function (type) {
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

                scope.launchFingerprintListPopup = function () {
                    if (fpListDialogOpen) {
                        return;
                    }
                    fpListDialogOpen = true;
                    fingerprintListDialogElement.dialog('open');
                };

                scope.showScannerDialog = function (fingerprint) {
                    if (fpScanDialogOpen) {
                        return;
                    }
                    if (fingerprint.template != null && fingerprint.template != undefined) {
                        return;
                    }
                    fpScanDialogOpen = true;
                    var cachedSession = scanSessionCache[fingerprint.type] || {};

                    return spinner.forPromise(
                        biometricService.getStatus()
                            .then(function (_) { return biometricService.fetchScanSession(cachedSession.uuid); })
                    ).then(function (response) {
                        var scanSession = response.data || response;
                        var hasFingerprints = scanSession && scanSession.fingerprints && scanSession.fingerprints.length > 0;

                        var openDialogWithSession = function (sessionToPass) {
                            scope.currentScanSession = sessionToPass;
                            scope.currentScanType = scanType;
                            scope.currentType = fingerprint.type;
                            fingerprintScannerDialogElement.dialog('open');
                        };

                        if (hasFingerprints) {
                            var dialogScope = {};
                            dialogScope.message = "There are already fingerprints in this session. Do you want to resume or start a new scanning session?";
                            dialogScope.newSession = function (closeConfirmBox) {
                                closeConfirmBox();
                                openDialogWithSession({ uuid: null, fingerprints: [] });
                            };
                            dialogScope.resume = function (closeConfirmBox) {
                                closeConfirmBox();
                                openDialogWithSession(scanSession);
                            };

                            confirmBox({
                                scope: dialogScope,
                                actions: [{ name: 'newSession', display: 'New Session' }, { name: 'resume', display: 'Resume' }],
                                className: "ngdialog-theme-default"
                            });
                        } else {
                            openDialogWithSession({ uuid: null, fingerprints: [] });
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
                    if (iAttrs.onSave) {
                        $parse(iAttrs.onSave)(scope, { fingerprints: scannedFingerprints });
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
                });
            };

            return {
                templateUrl: '../common/biometrics/views/fingerprintListDialog.html',
                restrict: 'A',
                scope: true,
                link: link
            };
        }]);
