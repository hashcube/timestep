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
import ..View as View;
import ..backend.strPad as strPad;
import ..backend.canvas.ViewBacking as ViewBacking;
import .Padding as Padding;

exports = Class(ViewBacking, function (supr) {

  this.init = function (view) {
    supr(this, 'init', [view]);
    this._order = 0;
    this._direction = 'vertical';
    this._flex = 0;
    this._justifyContent = 'start';
    this._centerX = false;
    this._centerY = false;
    this._top = undefined;
    this._right = undefined;
    this._bottom = undefined;
    this._left = undefined;
    this._minWidth = undefined;
    this._minHeight = undefined;
    this._maxWidth = undefined;
    this._maxHeight = undefined;
    this._layoutWidth = undefined;
    this._layoutHeight = undefined;
    this._margin = null;
    this._padding = undefined;
    this._sortOrder = strPad.initialValue;
    this._layoutWidthValue = 0;
    this._layoutWidthIsPercent = false;
    this._layoutHeightValue = 0;
    this._layoutHeightIsPercent = false;
  };

  Object.defineProperty(this, 'direction', {
    get: function () {
      return this._direction;
    },
    set: function (direction) {
      if (this._direction === direction) {
        return;
      }
      this._direction = direction;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'flex', {
    get: function () {
      return this._flex;
    },
    set: function (flex) {
      if (flex === this._flex) {
        return;
      }
      this._flex = flex;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'justifyContent', {
    get: function () {
      return this._justifyContent;
    },
    set: function (justifyContent) {
      if (justifyContent === this._justifyContent) {
        return;
      }
      this._justifyContent = justifyContent;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'centerX', {
    get: function () {
      return this._centerX;
    },
    set: function (centerX) {
      if (centerX === this._centerX) {
        return;
      }
      this._centerX = centerX;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'centerY', {
    get: function () {
      return this._centerY;
    },
    set: function (centerY) {
      if (centerY === this._centerY) {
        return;
      }
      this._centerY = centerY;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'top', {
    get: function () {
      return this._top;
    },
    set: function (top) {
      if (top === this._top) {
        return;
      }
      this._top = top;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'right', {
    get: function () {
      return this._right;
    },
    set: function (right) {
      if (right === this._right) {
        return;
      }
      this._right = right;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'bottom', {
    get: function () {
      return this._bottom;
    },
    set: function (bottom) {
      if (bottom === this._bottom) {
        return;
      }
      this._bottom = bottom;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'left', {
    get: function () {
      return this._left;
    },
    set: function (left) {
      if (left === this._left) {
        return;
      }
      this._left = left;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'minWidth', {
    get: function () {
      return this._minWidth;
    },
    set: function (minWidth) {
      if (minWidth === this._minWidth) {
        return;
      }
      this._minWidth = minWidth;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'minHeight', {
    get: function () {
      return this._minHeight;
    },
    set: function (minHeight) {
      if (minHeight === this._minHeight) {
        return;
      }
      this._minHeight = minHeight;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'maxWidth', {
    get: function () {
      return this._maxWidth;
    },
    set: function (maxWidth) {
      if (maxWidth === this._maxWidth) {
        return;
      }
      this._maxWidth = maxWidth;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'maxHeight', {
    get: function () {
      return this._maxHeight;
    },
    set: function (maxHeight) {
      if (maxHeight === this._maxHeight) {
        return;
      }
      this._maxHeight = maxHeight;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'layoutWidth', {
    get: function () {
      return this._layoutWidth;
    },
    set: function (layoutWidth) {
      if (layoutWidth === this._layoutWidth) {
        return;
      }
      this._layoutWidth = layoutWidth;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'layoutHeight', {
    get: function () {
      return this._layoutHeight;
    },
    set: function (layoutHeight) {
      if (layoutHeight === this._layoutHeight) {
        return;
      }
      this._layoutHeight = layoutHeight;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'margin', {
    get: function () {
      return this._margin;
    },
    set: function (margin) {
      if (margin === this._margin) {
        return;
      }
      this._margin = margin;
      this._onLayoutChange();
    }
  });

  Object.defineProperty(this, 'padding', {
    get: function () {
      return this._padding || (this._padding = new Padding());
    },
    set: function (padding) {
      if (this._padding) {
        this._padding.update(padding);
      } else {
        this._padding = new Padding(padding);
      }
      this._onLayoutChange();
    }
  });

  this.copy = function () {
    var copy = supr(this, 'copy');
    copy.order = this._order;
    copy.direction = this._direction;
    copy.flex = this._flex;
    copy.justifyContent = this._justifyContent;
    copy.centerX = this._centerX;
    copy.centerY = this._centerY;
    copy.top = this._top;
    copy.right = this._right;
    copy.bottom = this._bottom;
    copy.left = this._left;
    copy.minWidth = this._minWidth;
    copy.minHeight = this._minHeight;
    copy.maxWidth = this._maxWidth;
    copy.maxHeight = this._maxHeight;
    copy.layoutWidth = this._layoutWidth;
    copy.layoutHeight = this._layoutHeight;
    copy.margin = this._margin;
    copy.padding = this._padding;
    copy._sortOrder = this._sortOrder.initialValue;
    copy.layoutWidthValue = this._layoutWidthValue;
    copy.layoutWidthIsPercent = this._layoutWidthIsPercent;
    copy.layoutHeightValue = this._layoutHeightValue;
    copy.layoutHeightIsPercent = this._layoutHeightIsPercent;
    return copy;
  };

  this.update = function (style) {
    supr(this, 'update', [style]);

    // updating properties that are initialized as undefined
    // they need to be checked manually
    if (style.top !== undefined) { this.top = style.top; }
    if (style.right !== undefined) { this.right = style.right; }
    if (style.bottom !== undefined) { this.bottom = style.bottom; }
    if (style.left !== undefined) { this.left = style.left; }

    if (style.minWidth !== undefined) { this.minWidth = style.minWidth; }
    if (style.minHeight !== undefined) { this.minHeight = style.minHeight; }
    if (style.maxWidth !== undefined) { this.maxWidth = style.maxWidth; }
    if (style.maxHeight !== undefined) { this.maxHeight = style.maxHeight; }

    if (style.layoutWidth !== undefined) { this.layoutWidth = style.layoutWidth; }
    if (style.layoutHeight !== undefined) { this.layoutHeight = style.layoutHeight; }

    if (style.padding !== undefined) { this.padding = style.padding; }

    return this;
  }

  this._onOrder = function () {
    this._sortOrder = strPad.pad(this._order);
    this._onLayoutChange();
  };

  this._onMarginChange = function () {
    if (this._cachedMargin) {
      this._cachedMargin.update(this._margin);
    } else {
      this._cachedMargin = new Padding(this._margin);
    }
    this.top = this._cachedMargin.top;
    this.bottom = this._cachedMargin.bottom;
    this.left = this._cachedMargin.left;
    this.right = this._cachedMargin.right;
    this._onLayoutChange();
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
      if (this.layoutWidth && parent.style.width) {
        iw = parent.style.width * parseFloat(this.layoutWidth) / 100;
        ih = iw / this.aspectRatio;
      } else if (this.layoutHeight && parent.style.height) {
        ih = parent.style.height * parseFloat(this.layoutHeight) / 100;
        iw = ih * this.aspectRatio;
      } else if (this.flex && parent.style.direction === 'horizontal' && this.width) {
        iw = this.width;
        ih = iw / this.aspectRatio;
      } else if (this.flex && parent.style.direction === 'vertical' && this.height) {
        ih = this.height;
        iw = ih * this.aspectRatio;
      } else if (!isTimeout) {
        setTimeout(bind(this, 'enforceAspectRatio', iw, ih, true), 0);
      }
    }
    this.width = iw;
    this.height = ih;
  };

  this._onResize = function () {
    if (this._maxWidth !== undefined) { this._width = Math.min(this._maxWidth, this._width); }
    if (this._minWidth !== undefined) { this._width = Math.max(this._minWidth, this._width); }
    if (this._maxHeight !== undefined) { this._height = Math.min(this._maxHeight, this._height); }
    if (this._minHeight !== undefined) { this._height = Math.max(this._minHeight, this._height); }
    supr(this,'_onResize', arguments);
  };

  this._onLayoutWidth = function() {
    if (this._layoutWidth.charAt(this._layoutWidth.length - 1) === '%') {
      this._layoutWidthValue = parseFloat(this._layoutWidth) / 100;
      this._layoutWidthIsPercent = true;
    } else {
      this._layoutWidthValue = 0;
      this._layoutWidthIsPercent = false;
    }
    this._onLayoutChange();
  };

  this._onLayoutHeight = function () {
    if (this._layoutHeight.charAt(this._layoutHeight.length - 1) === '%') {
      this._layoutHeightValue = parseFloat(this._layoutHeight) / 100;
      this._layoutHeightIsPercent = true;
    } else {
      this._layoutHeightValue = 0;
      this._layoutHeightIsPercent = false;
    }
    this._onLayoutChange();
  };
});
