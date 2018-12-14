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
import platforms.browser.webgl.Matrix2D as Matrix2D;

var IDENTITY_MATRIX = new Matrix2D();
var sin = Math.sin;
var cos = Math.cos;

var ADD_COUNTER = 900000;

function compareZOrder (a, b) {
  var zIndexCmp = a._zIndex - b._zIndex;
  if (zIndexCmp !== 0) {
    return zIndexCmp;
  }
  return a._addedAt - b._addedAt;
}

var ViewBacking = exports = Class(BaseBacking, function () {
  this.init = function (view) {
    this._globalTransform = new Matrix2D();
    this._cachedRotation = 0;
    this._cachedSin = 0;
    this._cachedCos = 1;
    this.__cachedWidth = null;
    this.__cachedHeight = null;
    this._view = view;
    this._superview = null;

    this._shouldSort = false;
    this._shouldSortVisibleSubviews = false;

    this._subviews = [];
    this._visibleSubviews = [];

    // number of direct or indirect tick methods
    this._hasTick = !!view._tick;
    this._hasRender = !!view._render;
    this._subviewsWithTicks = null;

    this._addedAt = 0;
  };

  Object.defineProperty(this, 'layout', {
    get: function () { return this._view._layoutName; },
    set: function (layoutName) {
      this._view._setLayout(layoutName);
    }
  });

  this.getSuperview = function () { return this._superview; };
  this.getSubviews = function () {
    if (this._shouldSort) {
      this._shouldSort = false;
      this._subviews.sort(compareZOrder);
    }
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
    backing._addedAt = ++ADD_COUNTER;

    if (n && compareZOrder(backing, this._subviews[n - 1]) < 0) {
      this._shouldSort = true;
    }

    if (backing._hasTick || backing._subviewsWithTicks !== null) {
      this.addTickingView(backing);
    }

    if (backing._visible) {
      this.addVisibleSubview(backing);
    }

    if (backing._hasTick || backing._subviewsWithTicks !== null) {
      this.addTickingView(backing);
    }

    return true;
  };

  this.removeSubview = function (view) {
    var backing = view.__view;
    if (backing._visible) {
      this.removeVisibleSubview(backing);
    }

    var index = this._subviews.indexOf(view.__view);
    if (index != -1) {
      if (backing._hasTick || backing._subviewsWithTicks !== null) {
        this.removeTickingView(backing);
      }

      this._subviews.splice(index, 1);
      // this._view.needsRepaint();

      backing._superview = null;
      return true;
    }

    return false;
  };

  this._replaceSubview = function (subview, newSubview) {
    var subviewIdx = this._subviews.indexOf(subview);
    this._subviews[subviewIdx] = newSubview;
    var visibleSubviewIdx = this._visibleSubviews.indexOf(subview);
    if (visibleSubviewIdx !== -1) {
      this._visibleSubviews[visibleSubviewIdx] = newSubview;
    }
  };

  this.addVisibleSubview = function (backing) {
    this._visibleSubviews.push(backing);
    this._shouldSortVisibleSubviews = true;
  };

  this.removeVisibleSubview = function (backing) {
    var index = this._visibleSubviews.indexOf(backing);
    if (index !== -1) {
      this._visibleSubviews.splice(index, 1);
    }
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

  this.updateGlobalTransform = function (pgt) {
    var flipX = this.flipX ? -1 : 1;
    var flipY = this.flipY ? -1 : 1;

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

  this.wrapRender = function (ctx, parentTransform, parentOpacity) {
    if (this._shouldSortVisibleSubviews) {
      this._shouldSortVisibleSubviews = false;
      this._visibleSubviews.sort(compareZOrder);
    }

    var width = this._width;
    var height = this._height;
    if (width < 0 || height < 0) { return; }

    var saveContext = this.clip || this.compositeOperation || !this._view.__parent;
    if (saveContext) { ctx.save(); }

    this.updateGlobalTransform(parentTransform);
    var gt = this._globalTransform;
    ctx.setTransform(gt.a, gt.b, gt.c, gt.d, gt.tx, gt.ty);

    var globalAlpha = this.opacity * parentOpacity;
    ctx.globalAlpha = globalAlpha;
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

    if (this._hasRender) {
      this._view._render(ctx);
    }

    var subviews = this._visibleSubviews;
    for (var i = 0; i < subviews.length; i++) {
      subviews[i].wrapRender(ctx, gt, globalAlpha);
    }

    ctx.clearFilter();

    if (saveContext) { ctx.restore(); }
  };

  this._onResize = function (prop, value, prevValue) {
    this._onLayoutChange();

    // enforce center anchor on width / height change
    var s = this._view.style;
    if (s.centerAnchor) {
      s.anchorX = (s._width || 0) / 2;
      s.anchorY = (s._height || 0) / 2;
    }
  };

  this._sortIndex = strPad.initialValue;
  this._onZIndex = function () {
    this._view.needsRepaint();

    var superview = this._view.getSuperview();
    if (superview) {
      superview.__view._shouldSort = true;
      superview.__view._shouldSortVisibleSubviews = true;
    }
  };

  this._onVisible = function () {
    if (this._superview === null) {
      return;
    }

    if (this._visible) {
      this._superview.__view.addVisibleSubview(this);
    } else {
      this._superview.__view.removeVisibleSubview(this);
    }
  };

  this._setSortKey = function () {
    this.__sortKey = this._sortIndex + this._addedAt;
  };

  this._onInLayout = function () {
    var layout = this._superview && this._superview._layout;
    if (layout) {
      if (this._inLayout) {
        layout.add(this._view);
      } else {
        layout.remove(this._view);
        this._view.needsReflow();
      }
    }
  };

  // trigger a reflow, optionally of the parent if the parent has layout too
  this._onLayoutChange = function () {
    if (this._inLayout) {
      var superview = this.getSuperview();
      if (superview && superview._layout) {
        superview.needsReflow();
      }
    }
    // child view properties might be invalidated
    this._view.needsReflow();
  };

  //not implemented
  this._onOffsetX = function (n) {
    this.offsetX = n * this.width / 100;
  };

  //not implemented
  this._onOffsetY = function (n) {
    this.offsetY = n * this.height / 100;
  };

  this.updateAspectRatio = function (width, height) {
    this.aspectRatio = (width || this.width) / (height || this.height);
  };

  this._onFixedAspectRatio = function () {
    if (this._fixedAspectRatio) {
      this.updateAspectRatio();
    }
  };

  this.enforceAspectRatio = function (iw, ih, isTimeout) {
    if (iw && ih) {
      this.updateAspectRatio(iw, ih);
    }
    var parent = this._view.getSuperview();
    var opts = this._view._opts;
    iw = iw || opts.width;
    ih = ih || opts.height;
    if (opts.width) {
      iw = opts.width;
      ih = opts.width / this.aspectRatio;
    } else if (opts.height) {
      ih = opts.height;
      iw = opts.height * this.aspectRatio;
    } else if (parent) {
      if (parent.style.width) {
        iw = parent.style.width;
        ih = iw / this.aspectRatio;
      } else if (parent.style.height) {
        ih = parent.style.height;
        iw = ih * this.aspectRatio;
      } else if (!isTimeout) {
        setTimeout(bind(this, 'enforceAspectRatio', iw, ih, true), 0);
      }
    }
    this.width = iw;
    this.height = ih;
  };

});
