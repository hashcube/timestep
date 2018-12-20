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
 * @class ui.View;
 * The View base class.
 *
 * @doc http://doc.gameclosure.com/api/ui-view.html
 * @docsrc https://github.com/gameclosure/doc/blob/master/api/ui/view.md
 */

import device;
import .IView as IView;
import event.Emitter as Emitter;

import math.geom.Point as Point;
import math.geom.Rect as Rect;

import .layout.BoxLayout as BoxLayout;
import .layout.LinearLayout as LinearLayout;

import .backend.canvas.ViewBacking;
import .layout.LayoutViewBacking as LayoutViewBacking;

import ui.backend.ReflowManager as ReflowManager;
var _reflowMgr = ReflowManager.get();

import event.input.dispatch as dispatch;
import event.input.InputHandler as InputHandler;

import animate;

import util.setProperty as setProperty;

var EventScheduler = Class(function () {
  this.init = function () {
    // TODO: remove this eventually
    // Things like TextView will fail if it is not present
    this._opts = this._opts || {};
    this._queue = [];
  }

  this.add = function (f) {
    this._queue.push(f);

    if (!this._running) {
      this._running = true;
      while ((f = this._queue.shift())) {
        f();
      }
      this._running = false;
    }
  }
});

var scheduler = new EventScheduler();

/**
 * This singleton class controls the focus of the current application. Only one
 * view can be focused at a given time.
 *
 * This doesn't correspond to native and isn't being used.
 */
var FocusMgr = new (Class(function () {
  this.init = function (opts) {
    this._target = null;
    this._canChange = true;
  };

  /**
   * Focus the target, unfocusing the last target with focus.
   */
  this.focus = function (target) {
    if (this._target != target && this._canChange) {
      if (this._target && this._target.onBlur) {
        this._target.onBlur(this);
      }

      this._target = target;
      if (target && target.onFocus) {
        this._target.onFocus(this);
      }
    }
  };

  this.blur = function (target) {
    target.onBlur && target.onBlur(this);
    this._target = false;
  };

  this.get = function () {
    return this;
  };
}));

/**
 * Unique ID counter for all views.
 */
var UID = 0;

var _BackingCtor = null;


function compareSubscription(args, sub) {
  // note that args and sub may not be the same length
  // return true if all items in args match items in sub
  // (we don't care if sub has extra arguments)
  for (var i = 0, n = args.length; i < n; ++i) {
    if (args[i] != sub[i]) {
      return false;
    }
  }


  return true;
}


var layoutConstructors = {
  'linear': LinearLayout,
  'box': BoxLayout
};

var View = exports = Class(IView, function () {
  /**
   * infinite: boolean, default false - if true, no bounding shape at all (e.g. infinite scroll plane)
   * clip: boolean, default false - if true, always clip to the region
   * canHandleEvents: boolean, default true - if false, this view is ignored for event handling
   * parent: object, if provided, sets the initial superview
   */
  this.init = function (opts) {
    if (!opts) { opts = {}; }

    this.uid = ++UID;

    // Maintain pointers to children to keep native views from being garbage collected
    this.__parent = null;
    this.__children = null;
    this.__leftSibling = null;
    this.__rightSibling = null;

    this.__input = new InputHandler(this, opts);

    this._CustomBacking = opts.Backing || null;

    var layoutName = opts.layout;
    this._layoutName = layoutName || '';
    this._layout = null;

    var Backing = this._CustomBacking || (layoutName ? LayoutViewBacking : _BackingCtor);
    this.__view = this.style = new Backing(this, opts);

    if (layoutName) {
      var LayoutCtor = layoutConstructors[layoutName];
      this._layout = new LayoutCtor(this);
    }

    this._autoSize = false;

    this._filter = null;

    this.__view._view = this;

    this._tick = null;

    this.updateOpts(opts);
  };

  Object.defineProperty(this, 'tick', {
    get: function () {
      // this._tick can be null while "_tick" can exist on the protoype
      return this._tick || this.__proto__._tick;
    },
    set: function (tick) {
      // for some reason "this" can refer to the prototype
      // of an inherited class, therefore it is necessary
      // to test for the existence of a view
      if (tick) {
        if (this.__view) {
          this.__view.onTickAdded();
          this.__view._hasTick = true;
        }
        this._tick = tick;
      } else if (this._tick) {
        this._tick = null;
        if (this.__view) {
          this.__view._hasTick = false;
          this.__view.onTickRemoved();
        }
      }
    }
  });

  this._setLayout = function (layoutName) {
    if (layoutName && this._layout === null) {
      if (layoutName !== this._layoutName) {
        if (this._CustomBacking === null) {
          this._layoutName = layoutName;
          // setting layout will make the view change its backing
          // to a LayoutViewBacking (if no custom backing is specified)
          var backing = this.style;
          var newBacking = new LayoutViewBacking(this);
          // not only copying but replacing old backing by new backing
          // this implies transferring all the unique properties (including subviews)
          // copy
          var copy = backing.copy();
          newBacking.update(copy);
          // transferring unique properties
          newBacking._globalTransform = backing._globalTransform;
          newBacking._cachedRotation = backing._cachedRotation;
          newBacking._cachedSin = backing._cachedSin;
          newBacking._cachedCos = backing._cachedCos;
          newBacking.__cachedWidth = backing.__cachedWidth;
          newBacking.__cachedHeight = backing.__cachedHeight;
          newBacking._view = backing._view;
          newBacking._superview = backing._superview;
          newBacking._shouldSort = backing._shouldSort;
          newBacking._shouldSortVisibleSubviews = backing._shouldSortVisibleSubviews;
          newBacking._subviews = backing._subviews;
          newBacking._visibleSubviews = backing._visibleSubviews;
          newBacking._hasTick = backing._hasTick;
          newBacking._hasRender = backing._hasRender;
          newBacking._subviewsWithTicks = backing._subviewsWithTicks;
          newBacking._addedAt = backing._addedAt;
          this.__view = this.style = newBacking;
          var superview = newBacking._superview;
          if (superview) {
            superview.__view._replaceSubview(backing, newBacking);
          }
        }
        var LayoutCtor = layoutConstructors[layoutName];
        this._layout = new LayoutCtor(this);
      }
    }
  };

  this.updateOpts = function (opts) {
    opts = opts || {};
    if (this._opts) {
      for (var key in opts) {
        this._opts[key] = opts[key];
      }
    } else {
      this._opts = opts;
    }

    if (opts.tag) {
      this.tag = opts.tag;
    }
    if (opts.filter) {
      this._filter = opts.filter;
    }

    if (opts.infinite) {
      this._infinite = opts.infinite;
    }

    if (opts.layout) {
      this.__view.layout = opts.layout;
    }

    this.style.update(opts);
    this.__input.update(opts);

    if (opts.centerAnchor) {
      this.style.anchorX = this.style.width / 2;
      this.style.anchorY = this.style.height / 2;
    }

    if (opts.superview) {
      opts.superview.addSubview(this);
    }
    //opts.parent is deprecated, use opts.superview instead
    if (opts.parent) {
      opts.parent.addSubview(this);
    }

    return opts;
  };

  // --- filters ---
  // each filter can have multiple views
  // but no view can have more than one filter

  /**
   * Returns the filters attached to this view -- DEPRECATED
   */
  this.getFilters = function () {
    logger.warn("View.getFilters() is deprecated! Use View.getFilter() instead.");
    var filters = {};
    if (this._filter) {
      filters[this._filter.getType()] = this._filter;
    }
    return filters;
  };

  /**
   * Returns the filter attached to this view.
   */
  this.getFilter = function () {
    return this._filter;
  };

  /**
   * Sets the filter on this view -- DEPRECATED
   */
  this.addFilter = function (filter) {
    logger.warn("View.addFilter() is deprecated! Use View.setFilter() instead.");
    this.setFilter(filter);
  };

  /**
   * Sets the filter on this view. Only one filter can exist on a view.
   */
  this.setFilter = function (filter) {
    this._filter = filter;
  };

  /**
   * Remove the filter from this view.
   */
  this.removeFilter = function () {
    this._filter = null;
  };

  // --- animation component ---

  /**
   * Get an animation group from this view.
   */
  this.getAnimation = function (groupID) {
    return animate(this, groupID);
  };

  /**
   * @deprecated
   * Return an animation object for this view.
   */
  this.animate = function (style, duration, easing) {
    return this.getAnimation().then(style, duration, easing);
  };

  // --- ui focus/blur component ---

  /**
   * Indicate to the focus manager singleton this element is focused.
   */
  this.focus = function () {
    FocusMgr.get().focus(this); return this;
  };

  /**
   * Indicate to the focus manager singleton this element is blurred.
   */
  this.blur = function () {
    FocusMgr.get().blur(this);
    return this;
  };

  /**
   * Triggered when focus is given to this view.
   */
  this.onFocus = function () {
    this._isFocused = true;
  };

  /**
   * Indicate to the focus manager singleton this element is blurred.
   */
  this.onBlur = function () {
    this._isFocused = false;
  };

  // --- input component ---

  /**
   * Returns a boolean indicating we are currently dragging this view.
   */
  this.isDragging = function () {
    return this.__input.isDragging();
  };

  /**
   * Start responding to touch input by dragging this view.
   */
  this.startDrag = function (opts) {
    this.__input.startDrag(opts);
  };

  /**
   * Return the InputHandler for this view.
   */
  this.getInput = function () {
    return this.__input;
  };

  /**
   * Returns a boolean indicating if a touch is on this view.
   */
  this.isInputOver = function () {
    return !!this.__input.overCount;
  };

  /**
   * Returns a number indicating how many touches are on this view.
   */
  this.getInputOverCount = function () {
    return this._inputOverCount;
  };

  /**
   * Renamed to setHandleEvents, canHandleEvents is deprecated.
   * @param {boolean} handleEvents Pass events through.
   * @param {boolean} ignoreSubviews Optional, defaults to false in InputHandler. Ignore events in childen as well.
   */
  this.canHandleEvents = function (handleEvents, ignoreSubviews) {
    this.__input.canHandleEvents = handleEvents;

    if (typeof ignoreSubviews === 'boolean') {
      this.__input.blockEvents = ignoreSubviews;
    }
  };

  // TODO: think about refactoring internal components and exposing them differently...
  this.setIsHandlingEvents = function (canHandleEvents) {
    this.__input.canHandleEvents = canHandleEvents;
  };

  this.isHandlingEvents = function () {
    return this.__input.canHandleEvents;
  };

  this.needsRepaint = function () {
    /* Abstract */
  };

  this.needsReflow = function () {
    _reflowMgr.add(this);
  };

  this.reflowSync = function () { _reflowMgr.reflow(this); };

  /**
   * Consumes an event targeting this view.
   * NOTE: Does no actual propagation.
   */
  this._onEventPropagate = function (evt, pt, atTarget) {
    if (atTarget) {
      var id = evt.id;
      var lastEvt;
      var i;

      switch(evt.type) {
        case dispatch.eventTypes.SELECT:
        case dispatch.eventTypes.CLEAR:
          dispatch._evtHistory[dispatch.eventTypes.MOVE] = null;
          lastEvt = dispatch._activeInputOver[id];
          if (lastEvt) {
            dispatch.clearOverState(id);
          }
          break;

        case dispatch.eventTypes.START:
        case dispatch.eventTypes.MOVE:
          // translate input:move events into two higher-level events:
          //   input:over and input:out

          var target = evt.trace[0];
          var view = null;

          // fire input:out events first, start with deepest node and work out
          lastEvt = dispatch._activeInputOver[id];
          if (lastEvt && target != lastEvt.trace[0]) {
            var trace = lastEvt.trace;
            for (i = 0, view; view = trace[i]; ++i) {
              if (!(view.uid in evt.pt)) {
                view.__input.onLeave(id, target == view);
              }
            }
          }

          if (!lastEvt || target != lastEvt.trace[0]) {
            // fire input:over events second, start with outermost node and go to target
            var trace = evt.trace;
            for (i = evt.depth - 1; i >= 0; --i) {
              trace[i].__input.onEnter(id, target == view);
            }

            // update current mouse trace
            dispatch._activeInputOver[id] = evt;
          }
          break;
      }
    }
  };

  this.localizePoint = function (pt) {
    var list = this.getParents();
    var i = 0;
    list.push(this);
    while (list[i]) {
      pt = list[i++].__view.localizePoint(pt);
    }
    return pt;
  };

  // --- view hierarchy component ---

  /**
   * Return the subview at the given index.
   */
  this.getSubview = function (i) {
    return this.__view.getSubviews()[i];
  };

  /**
   * Returns an array of all subviews.
   */
  this.getSubviews = function () {
    return this.__view.getSubviews();
  };

  /**
   * Returns the superview of this view.
   */
  this.getSuperview = function () {
    return this.__view.getSuperview();
  };

  this.connectEvent = function (src, name /*, args */) {
    if (!this.__subs) {
      this.__subs = [];

      this.on('ViewAdded', bind(this, '_connectEvents'));
      this.on('ViewRemoved', bind(this, '_disconnectEvents'));

      if (this.__root) {
        this._connectEvents();
      }
    }
  };

  this.disconnectEvent = function (src, name) {
    if (this.__subs) {
      var args = Array.prototype.slice.call(arguments, 1);
      for (var i = 0, sub; sub = this.__subs[i]; ++i) {
        if (sub[0] == src && compareSubscription(args, sub[1])) {
          sub[0].removeListener.apply(sub[0], sub[1]);
          this.__subs.splice(i--, 1);
        }
      }
    }
  };

  this._connectEvents = function () {
    for (var i = 0, args; args = this.__subs[i]; ++i) {
      args[0].on.apply(args[0], args[1]);
    }
  };

  this._disconnectEvents = function () {
    for (var i = 0, args; args = this.__subs[i]; ++i) {
      args[0].removeListener.apply(args[0], args[1]);
    }
  };

  /**
   * Add a subview.
   */
  this.addSubview = function (view) {
    if (this.__view.addSubview(view)) {

      this._linkView(view);

      // if successful, clear any residual input over count
      view.__input.resetOver();

      this.publish('SubviewAdded', view);
      if (this.__root) {
        var root = this.__root;
        var viewCreated = view;
        scheduler.add(bind(this, function recurse (view) {
          if (!view.style.__firstRender) {
            view.style.__firstRender = true;
            view.needsReflow();
          }

          view.__root = root;
          view.emit('ViewAdded', viewCreated);
          var subviews = view.getSubviews();
          for (var i = 0, subview; subview = subviews[i]; ++i) {
            recurse(subview);
          }
        }, view));
      }
    }

    return view;
  };

  // link the input view to the current view to prevent native views from being
  // garbage collected
  this._linkView = function (view) {
    // remove any current connections
    this._unlinkView(view);

    // Insert this view as the head of the sibling list
    if (this.__children) {
      this.__children.__leftSibling = view;
    }
    view.__leftSibling = null;
    view.__rightSibling = this.__children;
    this.__children = view;
    view.__parent = this;


  };

  this._unlinkView = function (view) {
    if (view.__parent) {
      // When removing a subview, remove the view from its sibling list
      if (view.__leftSibling) {
        view.__leftSibling.__rightSibling = view.__rightSibling;
      }

      if (view.__rightSibling) {
        view.__rightSibling.__leftSibling = view.__leftSibling;
      }

      // If this view is the head of the sibling list
      // then set the next sibling to be the head
      if (view.__parent.__children == view) {
        view.__parent.__children = view.__rightSibling;
      }

      view.__leftSibling = null;
      view.__rightSibling = null;
      view.__parent = null;
    }
  };

  /**
   * Removes a subview.
   */
  this.removeSubview = function (view) {
    if (this.__view.removeSubview(view)) {
      this._unlinkView(view);
      this.publish('SubviewRemoved', view);
      if (view.__root) {
        scheduler.add(bind(this, function recurse(view) {
          view.__root = null;
          view.emit('ViewRemoved', this);
          var subviews = view.getSubviews();
          for (var i = 0, subview; subview = subviews[i]; ++i) {
            recurse(subview);
          }
        }, view));
      }
    }

    return view;
  };

  /**
   * Removes this view from its parent.
   */
  this.removeFromSuperview = function () {
    var superview = this.__view.getSuperview();
    if (superview) {
      this.updateOpts({
        superview: null
      });
      superview.removeSubview(this);
    }
  };

  /**
   * Removes all subviews from this view.
   */
  this.removeAllSubviews = function () {
    var subviews = this.getSubviews();
    var i = subviews.length;
    while (i--) {
      this.removeSubview(subviews[i]);
    }
  };

  // --- onResize callbacks ---

  // ---

  /**
   * Get the root application for this view.
   */
  this.getApp = function () {
    return this.__root;
  };

  /**
   * Returns an array of all ancestors of the current view.
   */
  this.getSuperviews = function () {

    var views = [];
    var next = this.getSuperview();
    while (next) {
      views.unshift(next);
      next = next.getSuperview();
    }

    return views;
  };

  /**
   * @interface
   */
  this.buildView = function () {};

  /**
   * Determine if this view contains a point.
   */
  this.containsLocalPoint = function (pt) {
    if (this._infinite) { return true; }  // infinite plane

    var s = this.style,
      w = s.width,
      h = s.height;

    if (w > 0 && h > 0) {
      return pt.x <= w && pt.y <= h && pt.x >= 0 && pt.y >= 0;
    } else if (w > 0) {
      return pt.x <= w && pt.y >= h && pt.x >= 0 && pt.y <= 0;
    } else if (h > 0) {
      return pt.x >= w && pt.y <= h && pt.x <= 0 && pt.y >= 0;
    } else {
      return pt.x >= w && pt.y >= h && pt.x <= 0 && pt.y <= 0;
    }
  };

  /**
   * Return the bounding shape for this view. The shape is defined in the
   * options object when this view was constructed.
   */
  this.getBoundingShape = function (simple) {
    if (this._infinite) {
      return true;
    } else {
      var s = this.style;
      var w = s.width;
      var h = s.height;
      if (!(w && h) && s.layout) {
        var superview = this.getSuperview();
        if (superview) {
          var supersize = superview.getBoundingShape(true);
          if (!w) {
            w = supersize.width;
            if (s.layoutWidth) {
              w *= parseInt(s.layoutWidth) / 100;
            }
          }
          if (!h) {
            h = supersize.height;
            if (s.layoutHeight) {
              h *= parseInt(s.layoutHeight) / 100;
            }
          }
        }
      }
      if (simple) {
        this._boundingShape.x = s.x;
        this._boundingShape.y = s.y;
        this._boundingShape.width = w * s.scale;
        this._boundingShape.height = h * s.scale;
        return this._boundingShape;
      }
      return new Rect(s.x, s.y, w * s.scale, h * s.scale);
    }
  };

  /**
   * Given a rectangle and a parent view, compute the location of
   * the rectangle in this view's coordinate space.
   * WARNING: only works with non-rotated rectangles.
   * TODO Make it work with rotated rectangles!
   */
  this.getRelativeRegion = function (region, parent) {
    var offset = this.getPosition(parent || region.src);
    return new Rect((region.x - offset.x) / offset.scale,
            (region.y - offset.y)  / offset.scale,
            region.width / offset.scale,
            region.height / offset.scale);
  };

  /**
   * Return a fully defined position, rotation, size, and scale for this view.
   */
  this.getPosition = function (/* optional */ relativeTo) {
    var abs = new Point(),
      view = this,
      r = 0,
      s = this.style,
      w = s.width,
      h = s.height,
      c = 1;

    while (view && view != relativeTo) {
      var scale = view.style.scale;

      //translate to anchor point
      abs.add(
        -(view.style.anchorX),
        -(view.style.anchorY)
      );

      //scale and rotate
      abs.rotate(view.style.r);
      abs.scale(scale);

      //translate back
      abs.add(
        view.style.anchorX + view.style.x + view.style.offsetX,
        view.style.anchorY + view.style.y + view.style.offsetY
      );

      r += view.style.r;
      w *= scale;
      h *= scale;
      c *= scale;
      view = view.__view.getSuperview();
    }

    return {
      x: abs.x,
      y: abs.y,
      r: r % (2 * Math.PI),
      width: w,
      height: h,
      scale: c,
      anchorX: this.style.anchorX,
      anchorY: this.style.anchorY
    };
  };

  /**
   * Exposes the internal implementation of the view hierarchy
   */
  this.getBacking = function () {
    return this.__view;
  };

  /**
   * Sets the visibility to true. Triggers repaint.
   */
  this.show = function () {
    this.style.visible = true;
    this.needsRepaint();
  };

  /**
   * Sets the visibility to false. Triggers repaint.
   */
  this.hide = function () {
    this.style.visible = false;
    this.needsRepaint();
  };

  /**
   * Return a human-readable tag for this view.
   */
  this.getTag = function () {
    var cls = 'View';

    if (DEBUG) {
      // check the cached name
      if (this.__tagClassName) {
        cls = this.__tagClassName;
      } else {
        // generate the classname
        cls = this.constructor.name;

        if (!cls) {
          cls = this.constructor.toString().match(/^function ([^(]*)/)[1];
        }

        if (cls) {
          cls = cls.substr(cls.lastIndexOf("_") + 1);
        }

        this.__tagClassName = cls || 'unknown';
      }
    }

    return cls + this.uid + (this.tag ? ':' + this.tag : '');
  };
});

View.prototype.DEFAULT_REFLOW  = function () {};
View.prototype.reflow = View.prototype.DEFAULT_REFLOW;
View.prototype._boundingShape = {};
View.prototype.setHandleEvents = View.prototype.canHandleEvents;
View.prototype.getEngine = View.prototype.getApp;
View.prototype.getParents = View.prototype.getSuperviews;
View.prototype.toString = View.prototype.getTag;


// --- render setter ---
/**
 * Adds a hook to determine when the "render" property is set.
 */
View.prototype._render = null;
Object.defineProperty(View.prototype, 'render', {
  get: function () { return this._render; },
  set: function (render) {
    if (this._render === render) {
      return;
    }

    if (!render) {
      this._render = null;
    } else {
      this._render = render;
    }

    if (this.__view) {
      this.__view._hasRender = !!render;
    }
  }
});

// legacy implementation shim
setProperty(View.prototype, '_superview', {
  get: View.prototype.getSuperview,
  set: function () {
  }
});
setProperty(View.prototype, '_subviews', {
  get: View.prototype.getSubviews,
  set: function () {
  }
});


var _extensions = [];
View.addExtension = function (ext) {
  ext.extend(View.BackingCtor);
  _extensions.push(ext);
};

View.setDefaultViewBacking = function (ViewBackingCtor) {
  _BackingCtor = View.BackingCtor = ViewBackingCtor;
  _extensions.forEach(function (ext) { ext.extend(_BackingCtor); });
};

// default view backing is canvas
View.setDefaultViewBacking(backend.canvas.ViewBacking);
