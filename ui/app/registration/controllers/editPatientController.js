/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at https://www.bahmni.org/license/mplv2hd.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

'use strict';

angular.module('bahmni.registration')
    .controller('EditPatientController', ['$scope', 'patientService', 'encounterService', '$stateParams', 'openmrsPatientMapper',
        '$window', '$q', 'spinner', 'appService', 'messagingService', '$rootScope', 'auditLogService', 'biometricService', '$translate',
        function ($scope, patientService, encounterService, $stateParams, openmrsPatientMapper, $window, $q, spinner,
            appService, messagingService, $rootScope, auditLogService, biometricService, $translate) {
            var dateUtil = Bahmni.Common.Util.DateUtil;
            var uuid = $stateParams.patientUuid;
            $scope.patient = {};
            $scope.actions = {};
            $scope.addressHierarchyConfigs = appService.getAppDescriptor().getConfigValue("addressHierarchy");
            $scope.disablePhotoCapture = appService.getAppDescriptor().getConfigValue("disablePhotoCapture");
            $scope.today = dateUtil.getDateWithoutTime(dateUtil.now());

            $scope.biometricConfig = biometricService.getConfig();
            $scope.biometricDevices = [];
            $scope.isScanning = false;
            $scope.biometricError = null;

            if ($scope.biometricConfig.enabled) {
                biometricService.getStatus();
                biometricService.getDevices().then(function (devices) {
                    $scope.biometricDevices = devices || [];
                });
            }

            var setReadOnlyFields = function () {
                $scope.readOnlyFields = {};
                var readOnlyFields = appService.getAppDescriptor().getConfigValue("readOnlyFields");
                angular.forEach(readOnlyFields, function (readOnlyField) {
                    if ($scope.patient[readOnlyField]) {
                        $scope.readOnlyFields[readOnlyField] = true;
                    }
                });
            };

            var successCallBack = function (openmrsPatient) {
                $scope.openMRSPatient = openmrsPatient["patient"];
                $scope.patient = openmrsPatientMapper.map(openmrsPatient);

                if ($scope.biometricConfig.enabled && !$scope.disableBiometricCapture && $scope.patient.primaryIdentifier && $scope.patient.fingerprint) {
                    var subjectId = $scope.patient.primaryIdentifier.identifier;
                    biometricService.getSubject(subjectId).then(function (subject) {
                        if (subject && subject.fingerprints && subject.fingerprints.length > 0) {
                            $scope.patient.scannedFingerprint = subject.fingerprints[0];
                        }
                    }).catch(function (error) {
                        console.log("Biometric subject not found or error:", error);
                    });
                }

                setReadOnlyFields();
                expandDataFilledSections();
                $scope.patientLoaded = true;
                $scope.enableWhatsAppButton = (appService.getAppDescriptor().getConfigValue("enableWhatsAppButton") || Bahmni.Registration.Constants.enableWhatsAppButton) && ($scope.patient.phoneNumber != undefined);
                $scope.relatedIdentifierAttribute = appService.getAppDescriptor().getConfigValue('relatedIdentifierAttribute');
                if ($scope.relatedIdentifierAttribute && $scope.relatedIdentifierAttribute.name) {
                    const hideOrDisableAttr = $scope.relatedIdentifierAttribute.hideOrDisable;
                    const hideAttrOnValue = $scope.relatedIdentifierAttribute.hideOnValue;
                    $scope.showRelatedIdentifierOption = !(hideOrDisableAttr === "hide" && $scope.patient[$scope.relatedIdentifierAttribute.name] &&
                        $scope.patient[$scope.relatedIdentifierAttribute.name].toString() === hideAttrOnValue);
                    $scope.showDisabledAttrOption = hideOrDisableAttr === "disable" ? true : false;
                }
            };

            var expandDataFilledSections = function () {
                angular.forEach($rootScope.patientConfiguration && $rootScope.patientConfiguration.getPatientAttributesSections(), function (section) {
                    var notNullAttribute = _.find(section && section.attributes, function (attribute) {
                        return $scope.patient[attribute.name] !== undefined;
                    });
                    section.expand = section.expanded || (notNullAttribute ? true : false);
                });
            };

            (function () {
                var getPatientPromise = patientService.get(uuid).then(successCallBack);

                var isDigitized = encounterService.getDigitized(uuid);

                var identifiers = patientService.getAllPatientIdentifiers(uuid);

                identifiers.then(function (response) {
                    $rootScope.patientIdentifiers = response.data.results;
                });

                isDigitized.then(function (data) {
                    var encountersWithObservations = data.data.results.filter(function (encounter) {
                        return encounter.obs.length > 0;
                    });
                    $scope.isDigitized = encountersWithObservations.length > 0;
                });

                spinner.forPromise($q.all([getPatientPromise, isDigitized, identifiers]));
            })();

            $scope.scanBiometrics = function () {
                $scope.isScanning = true;
                $scope.biometricError = null;
                biometricService.scan('1').then(function (result) {
                    if (result && result.template) {
                        biometricService.match({ fingerprints: [result] }).then(function (matchResult) {
                            if (matchResult.length > 0) {
                                $scope.biometricError = $translate.instant('REGISTRATION_BIOMETRIC_EXISTS') || 'This fingerprint exists!';
                                $scope.patient.scannedFingerprint = null;
                                $scope.patient.fingerprint = null;
                                return;
                            }
                            $scope.patient.scannedFingerprint = result;
                            $scope.patient.fingerprint = result.template;
                        });
                    } else {
                        $scope.biometricError = $translate.instant('REGISTRATION_BIOMETRICS_SCAN_FAILED') || 'Scan failed';
                        $scope.patient.scannedFingerprint = null;
                        $scope.patient.fingerprint = null;
                    }
                }).catch(function () {
                    $scope.biometricError = $translate.instant('REGISTRATION_BIOMETRICS_SCAN_ERROR') || 'Error communicating with biometric device';
                    $scope.patient.scannedFingerprint = null;
                    $scope.patient.fingerprint = null;
                }).finally(function () {
                    $scope.isScanning = false;
                });
            };

            $scope.getFingerprintImageSrc = function () {
                var fp = $scope.patient.scannedFingerprint;
                if (!fp || !fp.image) return '';
                var mime = 'image/png';
                if (fp.image.startsWith('SUkq') || fp.image.startsWith('TU0A')) {
                    mime = 'image/tif';
                } else if (fp.image.startsWith('/9j/')) {
                    mime = 'image/jpeg';
                }

                if (mime !== 'image/png') {
                    // for non-png images, return the original base64 string with the correct mime type
                    return 'data:' + mime + ';charset=utf-8;base64,' + fp.image;
                }
                // decode raw bytes
                var binaryString = atob(fp.image);
                var rawBytes = new Uint8Array(binaryString.length);
                for (var i = 0; i < binaryString.length; i++) {
                    rawBytes[i] = binaryString.charCodeAt(i);
                }

                // create off-screen canvas
                var canvas = document.createElement('canvas');
                canvas.width = $scope.biometricDevices[0].imageWidth;
                canvas.height = $scope.biometricDevices[0].imageHeight;
                var ctx = canvas.getContext('2d');

                // create blank img container
                var imageData = ctx.createImageData(canvas.width, canvas.height);
                var pixels = imageData.data;

                // map raw 8-bit bytes to RGBA pixels (grayscale)
                for (var j = 0; j < rawBytes.length; j++) {
                    var gray = rawBytes[j];
                    var pixelIndex = j * 4;
                    pixels[pixelIndex] = gray; // Red
                    pixels[pixelIndex + 1] = gray; // Green
                    pixels[pixelIndex + 2] = gray;
                    pixels[pixelIndex + 3] = 255; // Alpha
                }

                // paint the pixels to the inmemory canvas
                ctx.putImageData(imageData, 0, 0);

                // generate base64 png string from the canvas
                var dataUrl = canvas.toDataURL(mime);
                return dataUrl;
            };

            $scope.update = function () {
                addNewRelationships();
                var errorMessages = Bahmni.Common.Util.ValidationUtil.validate($scope.patient, $scope.patientConfiguration.attributeTypes);
                if (errorMessages.length > 0) {
                    errorMessages.forEach(function (errorMessage) {
                        messagingService.showMessage('error', errorMessage);
                    });
                    return $q.when({});
                }

                return spinner.forPromise(patientService.update($scope.patient, $scope.openMRSPatient).then(function (result) {
                    var patientProfileData = result.data;
                    if (!patientProfileData.error) {
                        if ($scope.biometricConfig && $scope.biometricConfig.enabled && $scope.patient.scannedFingerprint) {
                            var subjectId = $scope.patient.primaryIdentifier.identifier;
                            biometricService.update({ subjectId: subjectId, fingerprints: [$scope.patient.scannedFingerprint] })
                                .catch(function (error) {
                                    console.error(error);
                                    messagingService.showMessage("error", "Biometric update failed.");
                                })
                                .finally(function () {
                                    successCallBack(patientProfileData);
                                    $scope.actions.followUpAction(patientProfileData);
                                });
                        } else {
                            successCallBack(patientProfileData);
                            $scope.actions.followUpAction(patientProfileData);
                        }
                    }
                }));
            };

            var addNewRelationships = function () {
                var newRelationships = _.filter($scope.patient.newlyAddedRelationships, function (relationship) {
                    return relationship.relationshipType && relationship.relationshipType.uuid;
                });
                newRelationships = _.each(newRelationships, function (relationship) {
                    delete relationship.patientIdentifier;
                    delete relationship.content;
                    delete relationship.providerName;
                });
                $scope.patient.relationships = _.concat(newRelationships, $scope.patient.deletedRelationships);
            };

            $scope.isReadOnly = function (field) {
                return $scope.readOnlyFields ? ($scope.readOnlyFields[field] ? true : false) : undefined;
            };

            $scope.notifyOnWhatsAapp = function () {
                var name = $scope.patient.givenName + " " + $scope.patient.familyName;
                var whatsAppMessage = patientService.getRegistrationMessage($scope.patient.primaryIdentifier.identifier, name, $scope.patient.age.years, $scope.patient.gender);
                var phoneNumber = $scope.patient.phoneNumber.replace("+", "");
                var url = "https://api.whatsapp.com/send?phone=" + phoneNumber + "&text=" + encodeURIComponent(whatsAppMessage);
                window.open(url);
            };

            $scope.afterSave = function () {
                auditLogService.log($scope.patient.uuid, Bahmni.Registration.StateNameEvenTypeMap['patient.edit'], undefined, "MODULE_LABEL_REGISTRATION_KEY");
                messagingService.showMessage("info", "REGISTRATION_LABEL_SAVED");
            };
        }]);

