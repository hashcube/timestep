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


import util.setProperty as setProperty;


var BaseBacking = exports = Class(function () {

  // required methods:
  //
  // this._onResize = function () {};
  // this._onZIndex = function () {};

  this.x = 0;
  this.y = 0;
  this.offsetX = 0;
  this.offsetY = 0;
  this.anchorX = 0;
  this.anchorY = 0;
  this.centerAnchor = false;
  this._width = 0;
  this._height = 0;
  this.r = 0;
  this.opacity = 1;
  this._zIndex = 0;
  this.scale = 1;
  this.scaleX = 1;
  this.scaleY = 1;
  this.flipX = false;
  this.flipY = false;
  this._visible = true;
  this.clip = false;
  this.backgroundColor = '';
  this.compositeOperation = '';
  this._inLayout = true;
  this._aspectRatio = 1;
  this._fixedAspectRatio = false;

  this.localizePoint = function (pt) {
    pt.x -= this.x + this.anchorX + this.offsetX;
    pt.y -= this.y + this.anchorY + this.offsetY;
    if (this.r) { pt.rotate(-this.r); }
    pt.scale(1 / this.scale);
    pt.x += this.anchorX;
    pt.y += this.anchorY;
    return pt;
  }

  Object.defineProperty(this, 'visible', {
    get: function () {
      return this._visible;
    },
    set: function (visible) {
      if (this._visible === visible) {
        return;
      }
      this._visible = visible;
      this._onVisible;
    }
  });

  Object.defineProperty(this, 'width', {
    get: function () {
      return this._width;
    },
    set: function (width) {
      if (this._width === width) {
        return;
      }
      this._width = width;
      this._onResize();
    }
  });

  Object.defineProperty(this, 'height', {
    get: function () {
      return this._height;
    },
    set: function (height) {
      if (this._height === height) {
        return;
      }
      this._height = height;
      this._onResize();
    }
  });

  Object.defineProperty(this, 'zIndex', {
    get: function () {
      return this._zIndex;
    },
    set: function (zIndex) {
      if (this._zIndex === zIndex) {
        return;
      }
      this._zIndex = zIndex;
      this._onZIndex();
    }
  });

  Object.defineProperty(this, 'inLayout', {
    get: function () {
      return this._inLayout;
    },
    set: function (inLayout) {
      if (this._inLayout === inLayout) {
        return;
      }
      this._inLayout = inLayout;
      this._onInLayout();
    }
  });

  Object.defineProperty(this, 'aspectRatio', {
    get: function () {
      return this._aspectRatio;
    },
    set: function (aspectRatio) {
      if (this._aspectRatio === aspectRatio) {
        return;
      }
      this._aspectRatio = aspectRatio;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'fixedAspectRatio', {
    get: function () {
      return this._fixedAspectRatio;
    },
    set: function (fixedAspectRatio) {
      if (fixedAspectRatio === this._fixedAspectRatio) {
        return;
      }
      this._fixedAspectRatio = fixedAspectRatio;
      this._onFixedAspectRatio()
    }
  });

    // Abstract methods
  this._onVisible = function () {};
  this._onResize = function () {};
  this._onZIndex = function () {};
  this._onInLayout = function () {};
  this._onLayoutChange = function () {};
  this._onFixedAspectRatio = function () {};

  this.copy = function () {
    var copy = {
      x: this.x,
      y: this.y,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      anchorX: this.anchorX,
      anchorY: this.anchorY,
      centerAnchor: this.centerAnchor,
      width: this._width,
      height: this._height,
      r: this.r,
      opacity: this.opacity,
      zIndex: this._zIndex,
      scale: this.scale,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      flipX: this.flipX,
      flipY: this.flipY,
      visible: this._visible,
      clip: this.clip,
      backgroundColor: this.backgroundColor,
      compositeOperation: this.compositeOperation,
      inLayout: this._inLayout,
      fixedAspectRatio: this._fixedAspectRatio,
      aspectRatio: this._aspectRatio
    };

    return copy;
  }

  this.update = function (style) {
    for (var i in style) {
      if(this[i] !== void 0) {
        this[i] = style[i];
      }
    }

    return this;
  }
});
