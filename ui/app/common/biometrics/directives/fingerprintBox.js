'use strict';

angular.module("bahmni.common.biometrics")
    .directive("fingerprintBox", function () {
        var link = function ($scope) {
            var getFingerprintImgSrc = function () {
                if (!$scope.imgSrc) return '';
                var mime = 'image/png';
                if ($scope.imgSrc.startsWith('SUkq') || $scope.imgSrc.startsWith('TU0A')) {
                    mime = 'image/tif';
                } else if ($scope.imgSrc.startsWith('/9j/')) {
                    mime = 'image/jpeg';
                }
                if (mime !== 'image/png') {
                    // for non-png images, return the original base64 string with the correct mime type
                    return 'data:' + mime + ';charset=utf-8;base64,' + $scope.imgSrc;
                }
                // decode raw bytes
                var binaryString = atob($scope.imgSrc);
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

            $scope.getImgSrc = function () {
                if ($scope.error) {
                    return '../images/biometrics/fp-error.png';
                }
                if ($scope.imgSrc) {
                    return getFingerprintImgSrc();
                }
                if ($scope.success) {
                    return '../images/biometrics/fp-success.png';
                }
                return '../images/biometrics/fp-default.png';
            };

            $scope.overlaySrc = '../images/biometrics/fp-scanning.svg';
        };

        return {
            restrict: 'E',
            link: link,
            scope: {
                scanning: '=',
                error: '=',
                imgSrc: '=',
                success: '=',
                fingerprintCount: '='
            },
            templateUrl: '../common/biometrics/views/fingerprintBox.html'
        };
    });
