import cache.LRUCache as LRUCache;
import lib.PubSub as PubSub;

var WebGLTextureManager = Class(PubSub, function() {

  var CACHE_SIZE = 65535;
  var CACHE_UID = 1;
  var BYTES_PER_PIXEL = 4;
  var MAX_TEXTURE_BYTES = 128 * 1024 * 1024;
  var MAX_TEXTURE_DUMP_ITERATIONS = 5;

  var pow = Math.pow;
  var ceil = Math.ceil;
  var log = Math.log;

  var LOG_2 = log(2);

  this.init = function() {
    this.gl = null;
    this.textureDataCache = new LRUCache(CACHE_SIZE);
    this.textureByteCount = 0;
    this.memoryLimit = MAX_TEXTURE_BYTES;
  };

  this.initGL = function(ctx) {
    this.gl = ctx;
    this.reloadTextures();
  };

  this.deleteTextureForImage = function(image) {
    var texture = image.texture;
    if (texture) {
      this.deleteTexture(texture);
    }
  };

  this.deleteTexture = function(textureData) {
    this.emit(WebGLTextureManager.TEXTURE_REMOVED);
  };

  this.createTexture = function(image, id) {
    var width = image.width;
    var height = image.height;

    if (width === 0 || height === 0) {
      throw new Error('Image cannot have a width or height of 0.');
    }

    var gl = this.gl;
    var texture = gl.createTexture();
    var textureData = {
      image: image,
      isImg: image instanceof Image,
      isCanvas: image instanceof HTMLCanvasElement,
      width: width,
      height: height,
      texture: texture
    };

    gl.bindTexture(gl.TEXTURE_2D, textureData.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    if (textureData.isImg || textureData.isCanvas) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    var cacheKey = CACHE_UID++;
    this.textureDataCache.put(cacheKey, textureData);
    this.addToByteCount(width, height);

    return texture;
  };

  this.reloadTextures = function() {
    var imagesToLoad = [];
    this.textureDataCache.forEach(function(key, value) {
      if (value.isImg || value.isCanvas) {
        imagesToLoad.push(value.image);
      }
    }, this);
    this.textureDataCache.removeAll();
    this.textureByteCount = 0;
    for (var i = 0, len = imagesToLoad.length; i < len; i++) {
      this.createOrUpdateTexture(imagesToLoad[i]);
    }
  };

  this.addToByteCount = function(width, height) {
    width = this.nextPowerOfTwo(width);
    height = this.nextPowerOfTwo(height);
    this.textureByteCount += width * height * BYTES_PER_PIXEL;
    var textureDumps = 0;
    while (this.textureByteCount > MAX_TEXTURE_BYTES && textureDumps++ < MAX_TEXTURE_DUMP_ITERATIONS) {
      var oldestTextureEntry = this.textureDataCache.head;
      if (oldestTextureEntry) {
        if (!oldestTextureEntry.value.isImg) {
          this.textureDataCache.get(oldestTextureEntry.key);
          continue;
        }
        var textureData = oldestTextureEntry.value;
        this.deleteTexture(textureData.texture);
        this.removeFromByteCount(textureData.width, textureData.height);
      }
    }
  };

  this.removeFromByteCount = function(width, height) {
    width = this.nextPowerOfTwo(width);
    height = this.nextPowerOfTwo(height);
    this.textureByteCount -= width * height * BYTES_PER_PIXEL;
  };

  this.nextPowerOfTwo = function(value) {
    return pow(2, ceil(log(value) / LOG_2));
  };

});

WebGLTextureManager.TEXTURE_REMOVED = "TextureRemoved";

exports = WebGLTextureManager;