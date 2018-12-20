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

/**
 * @module device;
 *
 * Namespace for the current device. Determines what device we're running using
 * navigator.userAgent. This namespace exposes various properties about the
 * current device, such as screen size, mobile/browser, pixel ratios, etc.
 *
 * Using device.get('...') imports device-specific implementations from
 *   timestep.env.* by default, or from packages registered using
 *   registerDevice().
 * Using device.importUI('...') imports rendering classes for DOM or canvas.
 *
 * @doc http://doc.gameclosure.com/api/device.html
 * @docsrc https://github.com/gameclosure/doc/blob/master/api/device.md
 */

import userAgent;
import util.setProperty;
import event.Emitter as Emitter;
import platforms.browser.initialize as initialize;

if (typeof navigator === 'undefined' || !navigator.userAgent) {
  logger.warn('Timestep was unable to determine your device! Please check that navigator.userAgent is defined.');
  exports = { isUnknown: true };
}

var ua = navigator.userAgent;

var xdpi = navigator.displayMetrics ? navigator.displayMetrics.xdpi : null,
  ydpi = navigator.displayMetrics ? navigator.displayMetrics.ydpi : null,
  x_inch2, y_inch2, screen_inches;

if (xdpi && ydpi) {
  x_inch2 = Math.pow(navigator.width/xdpi, 2);
  y_inch2 = Math.pow(navigator.height/ydpi, 2);
  screen_inches = Math.sqrt(x_inch2 + y_inch2);
}

exports.get = function () {
  console.error('noooo!');
  // deprecated: InputPrompt used to be platform-specific
  if (module == 'InputPrompt') { return jsio('import ui.InputPrompt'); }

  var path = 'platforms.browser';
  return jsio('import ' + path + '.' + module, {dontExport: true, suppressErrors: true});
}

exports.importUI = function (module) {
  var domOrCanvas = exports.useDOM ? 'dom' : 'canvas';
  var importString = 'import ui.backend.' + domOrCanvas + '.' + module;
  var importOpts = {dontExport: true, suppressErrors: true};
  return jsio(importString, importOpts);
};

logger.log(exports.isMobile ? 'on mobile device' : 'in web browser');

exports.screen = new Emitter();

var devicePixelRatio = window.devicePixelRatio || 1;

// @deprecated
exports.devicePixelRatio = devicePixelRatio;

exports.screen.defaultDevicePixelRatio = devicePixelRatio;
exports.screen.devicePixelRatio = devicePixelRatio;
exports.screen.width = window.innerWidth * devicePixelRatio;
exports.screen.height = window.innerHeight * devicePixelRatio;

exports.setDevicePixelRatio = function (value) {
  if (userAgent.APP_RUNTIME !== 'browser') {
    logger.warn('device.setDevicePixelRatio is only supported in browsers!');
    return;
  }

  exports.devicePixelRatio = exports.screen.devicePixelRatio = value;

  var width = Math.floor(window.innerWidth * value);
  var height = Math.floor(window.innerHeight * value);
  exports.width = exports.screen.width = width;
  exports.height = exports.screen.height = height;
  exports.screen.publish('Resize', width, height);
};

// This is stubbed out unless available on the current device.
exports.hideAddressBar = function () {};

util.setProperty(exports, 'defaultFontFamily', {
  cb: function (value) {
    import ui.resource.Font;
    ui.resource.Font.setDefaultFontFamily(value);
  },
  value: 'Helvetica'
});
exports.defaultFontWeight = "";

if ('ontouchstart' in window && (!/BlackBerry/.test(ua))) {
  exports.events = {
    start: 'touchstart',
    move: 'touchmove',
    end: 'touchend'
  };
} else {
  exports.events = {
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup'
  };
}

/*
 * All userAgent flags in this file are now DEPRECATED.
 * Please use "src/userAgent.js" for a more accurate description of your device.
 */
exports.isMobileBrowser = false;
exports.isUIWebView = false;
exports.isSafari = /Safari/.test(ua);

exports.isSimulator = GLOBAL.CONFIG && !!CONFIG.simulator;
if (exports.isSimulator) {
  exports.isIOSSimulator = /iphone|ipod|ipad/i.test(CONFIG.simulator.deviceType);

  // Until we support more platforms, if it's not
  // iOS then it's assumed to be an Android device
  exports.isAndroidSimulator = !exports.isIOSSimulator;
} else {
  exports.isAndroidSimulator = false;
  exports.isIOSSimulator = false;
}

if (exports.isMobile) {
  exports.name = 'tealeaf';
  exports.width = navigator.width;
  exports.height = navigator.height;
  exports.screenInches = screen_inches;
  exports.isAndroid = /Android/.test(ua);
  exports.isMiniTablet = false;

  if (exports.isAndroid) {
    exports.isTablet = navigator.width/devicePixelRatio >= 600;
    if (exports.isTablet) {
      exports.isMiniTablet = screen_inches < 8;
    }
  } else {
    exports.isIPad = exports.isTablet = /iPad/.test(ua);
    exports.isIPhone = /iPhone/.test(ua);

    // Until we support more platforms, if it's not
    // Android then it's assumed to be an iOS device
    exports.isIOS = true;
  }
} else {
  if (/(iPod|iPhone|iPad)/i.test(ua)) {
    exports.name = 'browser';
    exports.isMobileBrowser = true;
    exports.isIOS = true;
    exports.isIpad = /iPad/i.test(ua);
    exports.isStandalone = !!window.navigator.standalone; // full-screen

    var match = ua.match(/iPhone OS ([0-9]+)/);
    exports.iosVersion = match && parseInt(match[1]);
    exports.isUIWebView = !exports.isSafari;

    exports.screen.defaultOrientation = 'portrait';
    exports.screen.browserChrome = {
      portrait: {top: 20 * devicePixelRatio, bottom: 44 * devicePixelRatio},
      landscape: {top: 20 * devicePixelRatio, bottom: 32 * devicePixelRatio}
    };

  } else if (/Mobile Safari/.test(ua) || /Android/.test(ua) || /BlackBerry/.test(ua)) {
    exports.name = 'browser';
    exports.isMobileBrowser = true;
    exports.isAndroid = true;

    exports.screen.width = window.outerWidth;
    exports.screen.height = window.outerHeight - 1;

    exports.screen.defaultOrientation = 'portrait';
    exports.screen.browserChrome = {
      portrait: {top: 0, bottom: 0},
      landscape: {top: 0, bottom: 0}
    };
  } else {
    // All other browsers
    exports.screen.width = window.innerWidth;
    exports.screen.height = window.innerHeight;
    exports.name = 'browser';
    exports.canResize = false;
  }

  // Set up device.width and device.height for browser case
  exports.width = exports.screen.width;
  exports.height = exports.screen.height;

  if (exports.name === 'browser') {
    exports.isTablet = exports.width / devicePixelRatio >= 600;
  }
}

exports.useDOM = false;
exports.setUseDOM = function (useDOM) {
  console.warn("Attempting to set 'useDom' property, which is no longer supported.")
  return;
};

exports.getDimensions = function (isLandscape) {
  var dMin = Math.min(exports.width, exports.height),
    dMax = Math.max(exports.width, exports.height);

  return isLandscape
    ? {height: dMin, width: dMax}
    : {height: dMax, width: dMin};
};

/**
 * Initialize the device. Called from somewhere else.
 */

exports.init = function () {
  initialize.init(exports);
  exports.screen.width = exports.width;
  exports.screen.height = exports.height;
};
