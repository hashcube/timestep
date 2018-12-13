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
 * @package ui.backend.canvas.ViewStyle;
 *
 * Models the style object of the canvas View.
 */

import ..strPad;
import ..BaseBacking;

var IDENTITY_MATRIX = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
var sin = Math.sin;
var cos = Math.cos;

var ADD_COUNTER = 900000;

var ViewBacking = exports = Class(BaseBacking, function () {
  this.init = function (view) {
    this._globalTransform = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    this._cachedRotation = 0;
    this._cachedSin = 0;
    this._cachedCos = 1;
    this._globalOpacity = 1;
    this._view = view;
    this._superview = null;
    this._subviews = [];
    this._childCount = 0;

    // number of direct or indirect tick methods
    this._hasTick = !!view._tick;
    this._subviewsWithTicks = null;
  };

  this.getSuperview = function () { return this._superview; };
  this.getSubviews = function () {
    if (this._needsSort) { this._needsSort = false; this._subviews.sort(); }
    var subviews = [];
    var backings = this._subviews;
    var n = backings.length;
    for (var i = 0; i < n; ++i) {
      subviews[i] = backings[i]._view;
    }

    return subviews;
  };

  this.onTickAdded = function () {
    if (this._superview) {
      this._superview.__view.addTickingView(this);
    }
  };

  this.onTickRemoved = function () {
    if (this._superview) {
      this._superview.__view.removeTickingView(this);
    }
  };

  this.addTickingView = function (backing) {
    if (this._subviewsWithTicks === null) {
      this._subviewsWithTicks = [];
    }
    var idx = this._subviewsWithTicks.indexOf(backing);
    if (idx === -1) {
      this._subviewsWithTicks.push(backing);
      if (!this._hasTick && this._subviewsWithTicks.length === 1) {
        // first time that this view needs to be registered as ticking
        this.onTickAdded();
      }
    }
  };

  this.removeTickingView = function (backing) {
    if (this._subviewsWithTicks === null) {
      return;
    }
    var idx = this._subviewsWithTicks.indexOf(this);
    if (idx !== -1) {
      this._subviewsWithTicks.splice(idx, 1);
      if (!this._hasTick && this._subviewsWithTicks.length === 0) {
        // no more reason to be registered as ticking
        this.onTickRemoved();
      }
    }
  };

  this.addSubview = function (view) {
    var backing = view.__view;
    var superview = backing._superview;
    if (superview == this._view || this == backing) { return false; }
    if (superview) { superview.__view.removeSubview(view); }

    var n = this._subviews.length;
    this._subviews[n] = backing;

    backing._superview = this._view;
    backing._setAddedAt(++ADD_COUNTER);
    this._childCount++;

    if (n && backing.__sortKey < this._subviews[n - 1].__sortKey) {
      this._needsSort = true;
    }

    if (backing._hasTick || backing._subviewsWithTicks !== null) {
      this.addTickingView(backing);
    }

    return true;
  };

  this.removeSubview = function (view) {
    var backing = view.__view;
    var index = this._subviews.indexOf(backing);
    if (index != -1) {
      if (backing._hasTick || backing._subviewsWithTicks !== null) {
        this.removeTickingView(backing);
      }

      this._subviews.splice(index, 1);
      this._childCount--;
      // this._view.needsRepaint();

      backing._superview = null;
      return true;
    }

    return false;
  };

  this.wrapTick = function (dt, app) {
    if (this._hasTick) {
      this._view.tick(dt, app);
    }

    var backings = this._subviewsWithTicks;
    if (backings !== null) {
      for (var i = 0; i < backings.length; ++i) {
        backings[i].wrapTick(dt, app);
      }
    }
  };

  this.updateGlobalTransform = function () {
    var flipX = this.flipX ? -1 : 1;
    var flipY = this.flipY ? -1 : 1;

    var pgt;
    var parent = this._superview && this._superview.__view;
    if (parent) {
      pgt = parent._globalTransform;
      this._globalOpacity = parent._globalOpacity * this.opacity;
    } else {
      pgt = IDENTITY_MATRIX;
      this._globalOpacity = this.opacity;
    }

    var gt = this._globalTransform;
    var sx = this.scaleX * this.scale * flipX;
    var sy = this.scaleY * this.scale * flipY;
    var ax = this.flipX ? this._width - this.anchorX : this.anchorX;
    var ay = this.flipY ? this._height - this.anchorY : this.anchorY;
    var tx = this.x + this.offsetX + this.anchorX;
    var ty = this.y + this.offsetY + this.anchorY;

    if (this.r === 0) {
      tx -= ax * sx;
      ty -= ay * sy;
      gt.a = pgt.a * sx;
      gt.b = pgt.b * sx;
      gt.c = pgt.c * sy;
      gt.d = pgt.d * sy;
      gt.tx = tx * pgt.a + ty * pgt.c + pgt.tx;
      gt.ty = tx * pgt.b + ty * pgt.d + pgt.ty;
    } else {
      if (this.r !== this._cachedRotation) {
        this._cachedRotation = this.r;
        this._cachedSin = sin(this.r);
        this._cachedCos = cos(this.r);
      }
      var a  =  this._cachedCos * sx;
      var b  =  this._cachedSin * sx;
      var c  = -this._cachedSin * sy;
      var d  =  this._cachedCos * sy;

      if (ax || ay) {
        tx -= a * ax + c * ay;
        ty -= b * ax + d * ay;
      }

      gt.a = a * pgt.a + b * pgt.c;
      gt.b = a * pgt.b + b * pgt.d;
      gt.c = c * pgt.a + d * pgt.c;
      gt.d = c * pgt.b + d * pgt.d;
      gt.tx = tx * pgt.a + ty * pgt.c + pgt.tx;
      gt.ty = tx * pgt.b + ty * pgt.d + pgt.ty;
    }
  };

  this.wrapRender = function (ctx, opts) {
    if (!this.visible) { return; }

    if (this._needsSort) {
      this._needsSort = false;
      this._subviews.sort();
    }

    var width = this._width;
    var height = this._height;
    if (width < 0 || height < 0) { return; }

    var saveContext = this.clip || this.compositeOperation || !this._view.__parent;
    if (saveContext) { ctx.save(); }

    this.updateGlobalTransform();
    var gt = this._globalTransform;
    ctx.setTransform(gt.a, gt.b, gt.c, gt.d, gt.tx, gt.ty);
    ctx.globalAlpha = this._globalOpacity;

    if (this.clip) { ctx.clipRect(0, 0, width, height); }

    var filter = this._view.getFilter();
    if (filter) {
      ctx.setFilter(filter);
    } else {
      ctx.clearFilter();
    }

    if (this.compositeOperation) {
      ctx.globalCompositeOperation = this.compositeOperation;
    }

    if (this.backgroundColor) {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    var viewport = opts.viewport;
    this._view._render && this._view._render(ctx, opts);
    this._renderSubviews(ctx, opts);
    opts.viewport = viewport;
    ctx.clearFilter();

    if (saveContext) { ctx.restore(); }
  };

  this._renderSubviews = function (ctx, opts) {
    var subviews = this._subviews;
    for (var i = 0; i < this._childCount; i++) {
      subviews[i].wrapRender(ctx, opts);
    }
  };

  this._onResize = function (prop, value, prevValue) {
    // child view properties might be invalidated
    this._view.needsReflow();

    // enforce center anchor on width / height change
    var s = this._view.style;
    if (s.centerAnchor) {
      s.anchorX = (s.width || 0) / 2;
      s.anchorY = (s.height || 0) / 2;
    }
  };

  this._sortIndex = strPad.initialValue;
  this._onZIndex = function (_, zIndex) {
    this._sortIndex = strPad.pad(zIndex);

    this._setSortKey();
    this._view.needsRepaint();

    var superview = this._view.getSuperview();
    if (superview) { superview.__view._needsSort = true; }
  };

  this._setAddedAt = function (addedAt) {
    this._addedAt = addedAt;
    this._setSortKey();
  };

  this._setSortKey = function () {
    this.__sortKey = this._sortIndex + this._addedAt;
  };

  //not implemented
  this._onOffsetX = function (n) {
    this.offsetX = n * this.width / 100;
  };

  //not implemented
  this._onOffsetY = function (n) {
    this.offsetY = n * this.height / 100;
  };

  this.toString = function () { return this.__sortKey; };
});
