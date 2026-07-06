'use strict';

angular.module("bahmni.common.biometrics")
    .directive("fingerprintBox", function () {
        var link = function (scope) {
            var computeFingerprintImgSrc = function (newImgSrc) {
                if (!newImgSrc) return '';
                var mime = 'image/png';
                if (newImgSrc.startsWith('SUkq') || newImgSrc.startsWith('TU0A')) {
                    mime = 'image/tif';
                } else if (newImgSrc.startsWith('/9j/')) {
                    mime = 'image/jpeg';
                }
                if (mime !== 'image/png') {
                    // for non-png images, return the original base64 string with the correct mime type
                    return 'data:' + mime + ';charset=utf-8;base64,' + newImgSrc;
                }
                // decode raw bytes
                var binaryString = atob(newImgSrc);
                var rawBytes = new Uint8Array(binaryString.length);
                for (var i = 0; i < binaryString.length; i++) {
                    rawBytes[i] = binaryString.charCodeAt(i);
                }

                // create off-screen canvas
                var canvas = document.createElement('canvas');
                canvas.width = scope.imgWidth || 500;
                canvas.height = scope.imgHeight || 500;
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

            // this helps with the heavy image rendering task
            // angular only executes it when imgSrc changes
            // instead of repeatedly on every digest cycle
            scope.computedImgSrc = '';
            scope.$watch('imgSrc', function (newVal) {
                if (newVal) {
                    scope.computedImgSrc = computeFingerprintImgSrc(newVal);
                } else {
                    scope.computedImgSrc = '';
                }
            });

            scope.getImgSrc = function () {
                if (scope.error) {
                    return '../images/biometrics/fp-error.png';
                }
                if (scope.computedImgSrc) {
                    return scope.computedImgSrc;
                }
                if (scope.success || scope.fingerprintCount) {
                    return '../images/biometrics/fp-success.png';
                }
                if (scope.lowImage) {
                    return '../images/biometrics/fp-default-light.png';
                }
                return '../images/biometrics/fp-default.png';
            };

            scope.overlaySrc = '../images/biometrics/fp-scanning.svg';
        };

        return {
            restrict: 'E',
            link: link,
            scope: {
                scanning: '=',
                error: '=',
                imgSrc: '=',
                success: '=',
                fingerprintCount: '=',
                lowImage: '=' // use low contrast img
            },
            templateUrl: '../common/biometrics/views/fingerprintBox.html'
        };
    });
