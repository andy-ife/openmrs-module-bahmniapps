'use strict';

angular.module('bahmni.common.fingerprintButton')
    .directive('fingerprintBtn',
        function factory(appService, biometricService, messagingService, spinner, $parse, $translate, confirmBox) {
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

                var patientFingerprints = $parse(iAttrs.ngModel).fingerprints;

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

                var rightFingerprints = allFingerprints.splice(5);
                var leftFingerprints = allFingerprints.splice(0, 5);

                var fingerprintListDialogElement = iElement.find(".fingerprintListDialog");
                var fpListDialogOpen = false;

                var fingerprintScannerDialogElement = iElement.find("fingerprint-scanner-dialog");
                var fpScanDialogOpen = false;
                var scanSessionCache = {};

                var isEnrolled = function (fingerprint) {
                    return fingerprint.template !== null && fingerprint.template !== undefined;
                };

                var getFingerprintTitle = function (type) {
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

                var getFingerprintLabelImg = function (type) {
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
                    }
                    return "../images/biometrics/" + images[type] || '';
                }

                var launchFingerprintListPopup = function () {
                    if (fpListDialogOpen) {
                        return;
                    }
                    fpListDialogOpen = true;
                    fingerprintListDialogElement.dialog('open');
                }

                var showScannerDialog = function (type) {
                    if (fpScanDialogOpen) {
                        return;
                    }
                    fpScanDialogOpen = true;
                    var cachedSession = scanSessionCache[type] || {};

                    return spinner.forPromise(
                        biometricService.fetchScanSession(cachedSession.uuid))
                        .then(function (response) {
                            var scanSession = response.data || response;
                            var hasFingerprints = scanSession && scanSession.fingerprints && scanSession.fingerprints.length > 0;

                            var openDialogWithSession = function (sessionToPass) {
                                fingerprintScannerDialogElement.attr('scanSession', sessionToPass);
                                fingerprintScannerDialogElement.dialog('open');
                            };

                            if (hasFingerprints) {
                                var scope = {};
                                scope.message = "There are already fingerprints in this session. Do you want to resume or start a new scanning session?";
                                scope.newSession = function (closeConfirmBox) {
                                    closeConfirmBox();
                                    openDialogWithSession({ uuid: null, fingerprints: [] });
                                };
                                scope.resume = function (closeConfirmBox) {
                                    closeConfirmBox();
                                    openDialogWithSession(scanSession);
                                };

                                confirmBox({
                                    scope: scope,
                                    actions: [{name: 'newSession', display: 'New Session'}, {name: 'resume', display: 'Resume'}],
                                    className: "ngdialog-theme-default"
                                });
                            } else {
                                openDialogWithSession({ uuid: null, fingerprints: [] });
                            }
                        }).catch(function (e) {
                            console.log(e);
                            alert($translate.instant("FETCH_SCAN_SESSION_ERROR"));
                        });
                }

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
            }

            return {
                templateUrl: '../common/biometrics/views/fingerprintListDialog.html',
                restrict: 'A',
                scope: true,
                link: link
            }
        });