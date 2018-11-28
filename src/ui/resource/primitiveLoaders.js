'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

import base as _base;

import platforms.browser.webgl.WebGLContext2D as _WebGLContext2D2;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _exports = {};

/**
 * @license
 * This file is part of the Game Closure SDK.
 *
 * The Game Closure SDK is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License v. 2.0 as published by Mozilla.
 * The Game Closure SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Mozilla Public License v. 2.0 for more details.
 * You should have received a copy of the Mozilla Public License v. 2.0
 * along with the Game Closure SDK.  If not, see <http://mozilla.org/MPL/2.0/>.
 */


// TODO: is this file where caches should be initialized and populated?


var FILE_CACHE = _base.CACHE;

var IMAGE_CACHE = {};
var SOUND_CACHE = {};
var JSON_CACHE = {};

var RETRY_MAP = {
  '598': true,
  '599': true,
  '429': true // TODO: handle this error in a better way but should not happen anyway
};

var RETRY_COUNT = 4;
var RETRY_TEMPO = 100; // TODO: 200 and test for error status code
var OFFLINE_RETRY_TEMPO = 200;
var MAX_PARALLEL_LOADINGS = 7;

// TODO: add http2 detection (following piece of code only works in chrome apparently)
// Detection for HTTP2 client support
// We suppose that server will provide assets over HTTP2
// see https://stackoverflow.com/questions/36041204/detect-connection-protocol-http-2-spdy-from-javascript
// var IS_HTTP2 = false;
// if (performance && performance.timing) {
//   IS_HTTP2 = performance.timing.nextHopProtocol === 'h2';
// }
// if (!IS_HTTP2 && chrome && chrome.loadTimes) {
//   IS_HTTP2 = chrome.loadTimes().connectionInfo === 'h2';
// }


var PRIORITY_LOW = 1;
var PRIORITY_MEDIUM = 2;
// TODO: implement high priority assets?
// var PRIORITY_HIGH = 3;

_exports.PRIORITY_LOW = PRIORITY_LOW;
_exports.PRIORITY_MEDIUM = PRIORITY_MEDIUM;
// exports.PRIORITY_HIGH = PRIORITY_HIGH;

var pendingRequests = [];
var pendingRequestsLowPriority = [];
var nbAssetsLoading = 0;

var webglSupported = _WebGLContext2D2.isSupported;

var TextureWrapper = function TextureWrapper(image, texture, width, height) {
  _classCallCheck(this, TextureWrapper);

  this.image = image;
  this.texture = texture;
  this.width = width;
  this.height = height;
  this.__needsUpload = false;
};

function pendRequest(priority, request) {
  if (nbAssetsLoading === MAX_PARALLEL_LOADINGS) {
    pendingRequests.push(request);
    return;
  }

  // TODO: implement mechanism to take advantage of HTTP2
  // if HTTP2:
  // the idea is to always have one (and only one) low priority asset loading
  // if the limit on the number of concurrent assets loading allows it
  // if HTTP1:
  // only load low priority assets if nothing else is loading
  if (priority === PRIORITY_LOW && nbAssetsLoading > 0) {
    pendingRequestsLowPriority.push(request);
    return;
  }

  nbAssetsLoading += 1;
  request();
}

function onRequestComplete(cb, asset) {
  cb(asset);

  if (pendingRequests.length > 0) {
    pendingRequests.shift()();
    return;
  }

  if (nbAssetsLoading === 0 && pendingRequestsLowPriority.length > 0) {
    pendingRequestsLowPriority.shift()();
    return;
  }

  // no request made, one less asset loading
  nbAssetsLoading -= 1;
}

_exports.loadImage = function (url, cb, loader, priority, isExplicit) {
  pendRequest(priority, function () {
    _loadImage(url, cb, loader, priority, isExplicit);
  });
};

function _loadImage(url, cb, loader, priority, isExplicit) {
  var img = new Image();

  // TODO: properly set crossOrigin
  // if (loader._assetCrossOrigins[url]) {
  //   img.crossOrigin = loader._assetCrossOrigins[url];
  // } else if (loader._crossOrigin) {
  //   img.crossOrigin = loader._crossOrigin;
  // } else {
  //   img.crossOrigin = 'use-credentials';
  // }
  img.crossOrigin = 'anonymous';

  var remainingTriesCount = RETRY_COUNT;
  var retryTempo = RETRY_TEMPO;
  img.onload = function () {
    var _this = this;

    // Some browsers fire the load event before the image width is
    // available.
    // Solution: Wait up to 5 frames for the width.
    // Note that an image with zero-width should be considered an error.
    if (!this.width) {
      var failCount = 0;
      var intervalHandle = setInterval(function () {
        if (_this.width) {
          clearInterval(intervalHandle);
          _this.onload();
          return;
        }

        failCount += 1;
        if (failCount === 5) {
          clearInterval(intervalHandle);
          _this.onerror({ reason: 'image has no dimension', status: 200 });
          return;
        }
      }, 0);
      return;
    }

    // Resetting callbacks to avoid memory leaks
    this.onload = null;
    this.onerror = null;

    var image;
    if (webglSupported) {
      var texture = _WebGLContext2D2.createTexture(this);
      image = new TextureWrapper(this, texture, this.width, this.height);
    } else {
      image = this;
    }

    return onRequestComplete(cb, image);
  };

  img.onerror = function (error) {
    var _this2 = this;

    if (!window.navigator.onLine) {
      // Retrying without decreasing retry count
      setTimeout(function () {
        _this2.src = url;
      }, OFFLINE_RETRY_TEMPO);
      return;
    }

    if (RETRY_MAP[error.status] && remainingTriesCount > 0) {
      remainingTriesCount -= 1;
      setTimeout(function () {
        _this2.src = url;
      }, retryTempo);
      retryTempo *= 2;
      return;
    }

    // Resetting callbacks to avoid memory leaks
    this.onload = null;
    this.onerror = null;
    var statusCode = ' Status code: ' + error.status;
    var reason = ' Reason: ' + error.reason;
    var response = ' Response: ' + error.response;
    _base.logger.error('Image not found: ' + url + statusCode + reason + response);
    loader._missingAssets[url] = true;
    return onRequestComplete(cb, null);
  };

  img.src = url;
}
_exports.loadImage.cache = IMAGE_CACHE;

_exports.loadFile = function (url, cb, loader, priority, isExplicit, responseType) {
  pendRequest(priority, function () {
    _loadFile(url, cb, loader, priority, isExplicit, responseType);
  });
};

function _loadFile(url, cb, loader, priority, isExplicit, responseType) {
  var xobj = new XMLHttpRequest();
  if (responseType) {
    xobj.responseType = responseType;
  }

  var remainingTriesCount = RETRY_COUNT;
  var retryTempo = RETRY_TEMPO;
  xobj.onreadystatechange = function () {
    if (~~xobj.readyState !== 4) return;
    if (~~xobj.status !== 200 && ~~xobj.status !== 0) {
      if (!window.navigator.onLine) {
        // Retrying without decreasing retry count
        setTimeout(function () {
          xobj.open('GET', url, true, loader._user, loader._password);
          xobj.send();
        }, OFFLINE_RETRY_TEMPO);
        return;
      }

      if (RETRY_MAP[xobj.status] && remainingTriesCount > 0) {
        remainingTriesCount -= 1;
        // Retrying
        setTimeout(function () {
          xobj.open('GET', url, true, loader._user, loader._password);
          xobj.send();
        }, retryTempo);
        retryTempo *= 2;
        return;
      }

      xobj.onreadystatechange = null;

      var statusCode = ' Status code: ' + xobj.status;
      var reason = ' Reason: ' + xobj.reason;
      var response = ' Response: ' + xobj.response;
      _base.logger.error('Failed to load file: ' + url + statusCode + reason + response);

      if (~~xobj.status === 404) {
        loader._missingAssets[url] = true;
      }

      return onRequestComplete(cb, null);
    }

    xobj.onreadystatechange = null;
    var file = xobj.response;
    return onRequestComplete(cb, file);
  };

  xobj.withCredentials = true;
  xobj.open('GET', url, true, loader._user, loader._password);
  xobj.send();
}
var loadFile = _exports.loadFile;
_exports.loadFile.cache = FILE_CACHE;

_exports.loadJSON = function (url, cb, loader, priority, isExplicit) {
  loadFile(url, function (fileContent) {
    if (fileContent === null) {
      return cb(null);
    }

    var json;
    try {
      json = JSON.parse(fileContent);
    } catch (e) {
      _base.logger.error('JSON file could not be parsed: ' + url);
      json = null;
    }
    return cb(json);
  }, loader, priority, isExplicit);
};
_exports.loadJSON.cache = JSON_CACHE;

_exports.loadSound = function (url, cb, loader, priority, isExplicit) {
  // loadFile(url, function (sound) {
  //   if (sound === null) {
  //     return cb && cb(null);
  //   }

  //   _audioContext2.default.decodeAudioData(sound, function (soundBuffer) {
  //     return cb && cb(soundBuffer);
  //   });
  // }, loader, priority, isExplicit, 'arraybuffer');
};
_exports.loadSound.cache = SOUND_CACHE;

exports = _exports;