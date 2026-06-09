'use strict';

angular.module('bahmni.registration')
    .controller('CreatePatientController', ['$scope', '$rootScope', '$state', 'patientService', 'patient', 'spinner', 'appService', 'messagingService', 'ngDialog', '$q', '$translate', 'biometricService',
        function ($scope, $rootScope, $state, patientService, patient, spinner, appService, messagingService, ngDialog, $q, $translate, biometricService) {
            var dateUtil = Bahmni.Common.Util.DateUtil;
            $scope.actions = {};
            var errorMessage;
            var configValueForEnterId = appService.getAppDescriptor().getConfigValue('showEnterID');
            $scope.addressHierarchyConfigs = appService.getAppDescriptor().getConfigValue("addressHierarchy");
            $scope.disablePhotoCapture = appService.getAppDescriptor().getConfigValue("disablePhotoCapture");
            $scope.showEnterID = configValueForEnterId === null ? true : configValueForEnterId;
            $scope.relatedIdentifierAttribute = appService.getAppDescriptor().getConfigValue('relatedIdentifierAttribute');
            $scope.today = Bahmni.Common.Util.DateTimeFormatter.getDateWithoutTime(dateUtil.now());
            $scope.moduleName = appService.getAppDescriptor().getConfigValue('registrationModuleName');
            var patientId;
            var getPersonAttributeTypes = function () {
                return $rootScope.patientConfiguration.attributeTypes;
            };
            $scope.getTranslatedPatientIdentifier = function (patientIdentifier) {
                var translatedName = Bahmni.Common.Util.TranslationUtil.translateAttribute(patientIdentifier, Bahmni.Common.Constants.registration, $translate);
                return translatedName;
            };
            var prepopulateDefaultsInFields = function () {
                var personAttributeTypes = getPersonAttributeTypes();
                var patientInformation = appService.getAppDescriptor().getConfigValue("patientInformation");
                if (!patientInformation || !patientInformation.defaults) {
                    return;
                }
                var defaults = patientInformation.defaults;
                var defaultVariableNames = _.keys(defaults);

                var hasDefaultAnswer = function (personAttributeType) {
                    return _.includes(defaultVariableNames, personAttributeType.name);
                };

                var isConcept = function (personAttributeType) {
                    return personAttributeType.format === "org.openmrs.Concept";
                };

                var setDefaultAnswer = function (personAttributeType) {
                    $scope.patient[personAttributeType.name] = defaults[personAttributeType.name];
                };

                var setDefaultConcept = function (personAttributeType) {
                    var defaultAnswer = defaults[personAttributeType.name];
                    var isDefaultAnswer = function (answer) {
                        return answer.fullySpecifiedName === defaultAnswer;
                    };

                    _.chain(personAttributeType.answers).filter(isDefaultAnswer).each(function (answer) {
                        $scope.patient[personAttributeType.name] = {
                            conceptUuid: answer.conceptId,
                            value: answer.fullySpecifiedName
                        };
                    }).value();
                };

                var isDateType = function (personAttributeType) {
                    return personAttributeType.format === "org.openmrs.util.AttributableDate";
                };

                var isDefaultValueToday = function (personAttributeType) {
                    if (defaults[personAttributeType.name].toLowerCase() === "today") {
                        return true;
                    }
                    return false;
                };

                var setDefaultValue = function (personAttributeType) {
                    if (isDefaultValueToday(personAttributeType)) {
                        $scope.patient[personAttributeType.name] = new Date();
                    }
                    else {
                        $scope.patient[personAttributeType.name] = '';
                    }
                };

                var defaultsWithAnswers = _.chain(personAttributeTypes)
                    .filter(hasDefaultAnswer)
                    .each(setDefaultAnswer).value();

                _.chain(defaultsWithAnswers).filter(isConcept).each(setDefaultConcept).value();
                _.chain(defaultsWithAnswers).filter(isDateType).each(setDefaultValue).value();
                if ($scope.relatedIdentifierAttribute && $scope.relatedIdentifierAttribute.name) {
                    $scope.patient[$scope.relatedIdentifierAttribute.name] = false;
                }
            };

            var expandSectionsWithDefaultValue = function () {
                angular.forEach($rootScope.patientConfiguration && $rootScope.patientConfiguration.getPatientAttributesSections(), function (section) {
                    var notNullAttribute = _.find(section && section.attributes, function (attribute) {
                        return $scope.patient[attribute.name] !== undefined;
                    });
                    section.expand = section.expanded || (notNullAttribute ? true : false);
                });
            };

            var init = function () {
                $scope.patient = patient.create();
                prepopulateDefaultsInFields();
                expandSectionsWithDefaultValue();
                $scope.patientLoaded = true;
                $scope.createPatient = true;

                // Biometrics Initialization
                $scope.biometricConfig = biometricService.getConfig();
                $scope.biometricDevices = [];
                $scope.isScanning = false;
                $scope.biometricError = null;

                if ($scope.biometricConfig.enabled) {
                    biometricService.getStatus(); // Warm up or check status
                    biometricService.getDevices().then(function (devices) {
                        $scope.biometricDevices = devices || [];
                    });
                }
            };

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
                const binaryString = atob(fp.image);
                const rawBytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    rawBytes[i] = binaryString.charCodeAt(i);
                }

                // create off-screen canvas
                const canvas = document.createElement('canvas');
                canvas.width = $scope.biometricDevices[0].imageWidth;
                canvas.height = $scope.biometricDevices[0].imageHeight;
                const ctx = canvas.getContext('2d');

                // create blank img container
                const imageData = ctx.createImageData(canvas.width, canvas.height);
                const pixels = imageData.data;

                // map raw 8-bit bytes to RGBA pixels (grayscale)
                for (let i = 0; i < rawBytes.length; i++) {
                    const gray = rawBytes[i];
                    const pixelIndex = i * 4;
                    pixels[pixelIndex] = gray; // Red
                    pixels[pixelIndex + 1] = gray; // Green
                    pixels[pixelIndex + 2] = gray;
                    pixels[pixelIndex + 3] = 255; // Alpha
                }

                // paint the pixels to the inmemory canvas
                ctx.putImageData(imageData, 0, 0);

                // generate base64 png string from the canvas
                const dataUrl = canvas.toDataURL(mime);
                return dataUrl;
            };

            init();

            var prepopulateFields = function () {
                var fieldsToPopulate = appService.getAppDescriptor().getConfigValue("prepopulateFields");
                if (fieldsToPopulate) {
                    _.each(fieldsToPopulate, function (field) {
                        var addressLevel = _.find($scope.addressLevels, function (level) {
                            return level.name === field;
                        });
                        if (addressLevel) {
                            $scope.patient.address[addressLevel.addressField] = $rootScope.loggedInLocation[addressLevel.addressField];
                        }
                    });
                }
            };
            prepopulateFields();

            var addNewRelationships = function () {
                var newRelationships = _.filter($scope.patient.newlyAddedRelationships, function (relationship) {
                    return relationship.relationshipType && relationship.relationshipType.uuid;
                });
                newRelationships = _.each(newRelationships, function (relationship) {
                    delete relationship.patientIdentifier;
                    delete relationship.content;
                    delete relationship.providerName;
                });
                $scope.patient.relationships = newRelationships;
            };

            var getConfirmationViaNgDialog = function (config) {
                var ngDialogLocalScope = config.scope.$new();
                ngDialogLocalScope.yes = function () {
                    ngDialog.close();
                    config.yesCallback();
                };
                ngDialogLocalScope.no = function () {
                    ngDialog.close();
                };
                ngDialog.open({
                    template: config.template,
                    data: config.data,
                    scope: ngDialogLocalScope
                });
            };

            var copyPatientProfileDataToScope = function (response) {
                var patientProfileData = response.data;
                $scope.patient.uuid = patientProfileData.patient.uuid;
                $scope.patient.name = patientProfileData.patient.person.names[0].display;
                $scope.patient.isNew = true;
                $scope.patient.registrationDate = dateUtil.now();
                $scope.patient.newlyAddedRelationships = [{}];
                patientId = patientProfileData.patient.identifiers[0].identifier;

                if ($scope.biometricConfig && $scope.biometricConfig.enabled && $scope.patient.scannedFingerprint) {
                    biometricService.enrol({ subjectId: patientId, fingerprints: [$scope.patient.scannedFingerprint] })
                        .catch(function (error) {
                            console.error(error);
                            messagingService.showMessage("error", "Biometric enrollment failed.");
                        })
                        .finally(function () {
                            $scope.actions.followUpAction(patientProfileData);
                        });
                } else {
                    $scope.actions.followUpAction(patientProfileData);
                }
            };

            var createPatient = function (jumpAccepted) {
                return patientService.create($scope.patient, jumpAccepted).then(function (response) {
                    copyPatientProfileDataToScope(response);
                }, function (response) {
                    if (response.status === 412) {
                        var data = _.map(response.data, function (data) {
                            return {
                                sizeOfTheJump: data.sizeOfJump,
                                identifierName: _.find($rootScope.patientConfiguration.identifierTypes, { uuid: data.identifierType }).name
                            };
                        });
                        getConfirmationViaNgDialog({
                            template: 'views/customIdentifierConfirmation.html',
                            data: data,
                            scope: $scope,
                            yesCallback: function () {
                                return createPatient(true);
                            }
                        });
                    }
                    if (response.isIdentifierDuplicate) {
                        errorMessage = response.message;
                    }
                });
            };

            var createPromise = function () {
                var deferred = $q.defer();
                createPatient().finally(function () {
                    return deferred.resolve({});
                });
                return deferred.promise;
            };

            $scope.create = function () {
                addNewRelationships();
                var errorMessages = Bahmni.Common.Util.ValidationUtil.validate($scope.patient, $scope.patientConfiguration.attributeTypes);
                if (errorMessages.length > 0) {
                    errorMessages.forEach(function (errorMessage) {
                        messagingService.showMessage('error', errorMessage);
                    });
                    return $q.when({});
                }
                return spinner.forPromise(createPromise()).then(function (response) {
                    if (errorMessage) {
                        messagingService.showMessage("error", errorMessage);
                        errorMessage = undefined;
                    }
                });
            };

            $scope.afterSave = function () {
                messagingService.showMessage("info", "REGISTRATION_LABEL_SAVED");
                $state.go("patient.edit", {
                    patientUuid: $scope.patient.uuid
                });
            };
        }
    ]);
