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

import ..View;
import ..backend.strPad as strPad;
import .BoxLayout;
import .LinearLayout;
import .Padding;
import ..backend.canvas.ViewBacking as ViewBacking;

import util.setProperty;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
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


exports = Class(ViewBacking, function (_ViewBacking) {
  _inherits(LayoutViewBacking, _ViewBacking);

  function LayoutViewBacking(view) {
    _classCallCheck(this, LayoutViewBacking);

    var _this = _possibleConstructorReturn(this, (LayoutViewBacking.__proto__ || Object.getPrototypeOf(LayoutViewBacking)).call(this, view));

    _this._order = 0;
    _this._direction = 'vertical';
    _this._flex = 0;
    _this._justifyContent = 'start';
    _this._centerX = false;
    _this._centerY = false;

    _this._top = undefined;
    _this._right = undefined;
    _this._bottom = undefined;
    _this._left = undefined;

    _this._minWidth = undefined;
    _this._minHeight = undefined;
    _this._maxWidth = undefined;
    _this._maxHeight = undefined;

    _this._layoutWidth = undefined;
    _this._layoutHeight = undefined;

    _this._padding = undefined;
    _this._margin = null;

    _this._sortOrder = _strPad2.default.initialValue;

    _this._layoutWidthValue = 0;
    _this._layoutWidthIsPercent = false;

    _this._layoutHeightValue = 0;
    _this._layoutHeightIsPercent = false;
    return _this;
  }

  _createClass(LayoutViewBacking, [{
    key: 'copy',
    value: function copy() {
      var copy = _get(LayoutViewBacking.prototype.__proto__ || Object.getPrototypeOf(LayoutViewBacking.prototype), 'copy', this).call(this);

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
    }
  }, {
    key: 'update',
    value: function update(style) {
      _get(LayoutViewBacking.prototype.__proto__ || Object.getPrototypeOf(LayoutViewBacking.prototype), 'update', this).call(this, style);

      // updating properties that are initialized as undefined
      // they need to be checked manually
      if (style.top !== undefined) {
        this.top = style.top;
      }
      if (style.right !== undefined) {
        this.right = style.right;
      }
      if (style.bottom !== undefined) {
        this.bottom = style.bottom;
      }
      if (style.left !== undefined) {
        this.left = style.left;
      }

      if (style.minWidth !== undefined) {
        this.minWidth = style.minWidth;
      }
      if (style.minHeight !== undefined) {
        this.minHeight = style.minHeight;
      }
      if (style.maxWidth !== undefined) {
        this.maxWidth = style.maxWidth;
      }
      if (style.maxHeight !== undefined) {
        this.maxHeight = style.maxHeight;
      }

      if (style.layoutWidth !== undefined) {
        this.layoutWidth = style.layoutWidth;
      }
      if (style.layoutHeight !== undefined) {
        this.layoutHeight = style.layoutHeight;
      }

      if (style.padding !== undefined) {
        this.padding = style.padding;
      }

      return this;
    }
  }, {
    key: '_onOrder',
    value: function _onOrder() {
      this._sortOrder = _strPad2.default.pad(this._order);
      this._onLayoutChange();
    }
  }, {
    key: '_onMarginChange',
    value: function _onMarginChange() {
      if (this._cachedMargin) {
        this._cachedMargin.update(this._margin);
      } else {
        this._cachedMargin = new _Padding2.default(this._margin);
      }

      this.top = this._cachedMargin.top;
      this.bottom = this._cachedMargin.bottom;
      this.left = this._cachedMargin.left;
      this.right = this._cachedMargin.right;

      this._onLayoutChange();
    }
  }, {
    key: 'enforceAspectRatio',
    value: function enforceAspectRatio(iw, ih, isTimeout) {
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
          setTimeout((0, _base.bind)(this, 'enforceAspectRatio', iw, ih, true), 0);
        }
      }
      this.width = iw;
      this.height = ih;
    }
  }, {
    key: '_onResize',
    value: function _onResize() {
      if (this._maxWidth !== undefined) {
        this._width = Math.min(this._maxWidth, this._width);
      }
      if (this._minWidth !== undefined) {
        this._width = Math.max(this._minWidth, this._width);
      }
      if (this._maxHeight !== undefined) {
        this._height = Math.min(this._maxHeight, this._height);
      }
      if (this._minHeight !== undefined) {
        this._height = Math.max(this._minHeight, this._height);
      }

      _get(LayoutViewBacking.prototype.__proto__ || Object.getPrototypeOf(LayoutViewBacking.prototype), '_onResize', this).call(this);
    }
  }, {
    key: '_onLayoutWidth',
    value: function _onLayoutWidth() {
      if (this._layoutWidth.charAt(this._layoutWidth.length - 1) === '%') {
        this._layoutWidthValue = parseFloat(this._layoutWidth) / 100;
        this._layoutWidthIsPercent = true;
      } else {
        this._layoutWidthValue = 0;
        this._layoutWidthIsPercent = false;
      }

      this._onLayoutChange();
    }
  }, {
    key: '_onLayoutHeight',
    value: function _onLayoutHeight() {
      if (this._layoutHeight.charAt(this._layoutHeight.length - 1) === '%') {
        this._layoutHeightValue = parseFloat(this._layoutHeight) / 100;
        this._layoutHeightIsPercent = true;
      } else {
        this._layoutHeightValue = 0;
        this._layoutHeightIsPercent = false;
      }

      this._onLayoutChange();
    }
  }, {
    key: 'direction',
    get: function get() {
      return this._direction;
    },
    set: function set(direction) {
      if (direction === this._direction) {
        return;
      }
      this._direction = direction;
      this._onLayoutChange();
    }
  }, {
    key: 'flex',
    get: function get() {
      return this._flex;
    },
    set: function set(flex) {
      if (flex === this._flex) {
        return;
      }
      this._flex = flex;
      this._onLayoutChange();
    }
  }, {
    key: 'justifyContent',
    get: function get() {
      return this._justifyContent;
    },
    set: function set(justifyContent) {
      if (justifyContent === this._justifyContent) {
        return;
      }
      this._justifyContent = justifyContent;
      this._onLayoutChange();
    }
  }, {
    key: 'centerX',
    get: function get() {
      return this._centerX;
    },
    set: function set(centerX) {
      if (centerX === this._centerX) {
        return;
      }
      this._centerX = centerX;
      this._onLayoutChange();
    }
  }, {
    key: 'centerY',
    get: function get() {
      return this._centerY;
    },
    set: function set(centerY) {
      if (centerY === this._centerY) {
        return;
      }
      this._centerY = centerY;
      this._onLayoutChange();
    }
  }, {
    key: 'top',
    get: function get() {
      return this._top;
    },
    set: function set(top) {
      if (top === this._top) {
        return;
      }
      this._top = top;
      this._onLayoutChange();
    }
  }, {
    key: 'right',
    get: function get() {
      return this._right;
    },
    set: function set(right) {
      if (right === this._right) {
        return;
      }
      this._right = right;
      this._onLayoutChange();
    }
  }, {
    key: 'bottom',
    get: function get() {
      return this._bottom;
    },
    set: function set(bottom) {
      if (bottom === this._bottom) {
        return;
      }
      this._bottom = bottom;
      this._onLayoutChange();
    }
  }, {
    key: 'left',
    get: function get() {
      return this._left;
    },
    set: function set(left) {
      if (left === this._left) {
        return;
      }
      this._left = left;
      this._onLayoutChange();
    }
  }, {
    key: 'minWidth',
    get: function get() {
      return this._minWidth;
    },
    set: function set(minWidth) {
      if (minWidth === this._minWidth) {
        return;
      }
      this._minWidth = minWidth;
      this._onLayoutChange();
    }
  }, {
    key: 'minHeight',
    get: function get() {
      return this._minHeight;
    },
    set: function set(minHeight) {
      if (minHeight === this._minHeight) {
        return;
      }
      this._minHeight = minHeight;
      this._onLayoutChange();
    }
  }, {
    key: 'maxWidth',
    get: function get() {
      return this._maxWidth;
    },
    set: function set(maxWidth) {
      if (maxWidth === this._maxWidth) {
        return;
      }
      this._maxWidth = maxWidth;
      this._onLayoutChange();
    }
  }, {
    key: 'maxHeight',
    get: function get() {
      return this._maxHeight;
    },
    set: function set(maxHeight) {
      if (maxHeight === this._maxHeight) {
        return;
      }
      this._maxHeight = maxHeight;
      this._onLayoutChange();
    }
  }, {
    key: 'layoutWidth',
    get: function get() {
      return this._layoutWidth;
    },
    set: function set(layoutWidth) {
      if (layoutWidth === this._layoutWidth) {
        return;
      }
      this._layoutWidth = layoutWidth;
      this._onLayoutWidth();
    }
  }, {
    key: 'layoutHeight',
    get: function get() {
      return this._layoutHeight;
    },
    set: function set(layoutHeight) {
      if (layoutHeight === this._layoutHeight) {
        return;
      }
      this._layoutHeight = layoutHeight;
      this._onLayoutHeight();
    }
  }, {
    key: 'margin',
    get: function get() {
      return this._margin;
    },
    set: function set(margin) {
      if (margin === this._margin) {
        return;
      }
      this._margin = margin;
      this._onMarginChange();
    }
  }, {
    key: 'padding',
    get: function get() {
      return this._padding || (this._padding = new _Padding2.default());
    },
    set: function set(padding) {
      if (this._padding) {
        this._padding.update(padding);
      } else {
        this._padding = new _Padding2.default(padding);
      }

      this._onLayoutChange();
    }
  }]);
});
