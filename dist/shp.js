;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("calvinmetcalf-setImmediate/lib/index.js", function(exports, require, module){
"use strict";
var types = [
    require("./nextTick"),
    require("./mutation"),
    require("./realSetImmediate"),
    require("./postMessage"),
    require("./messageChannel"),
    require("./stateChange"),
    require("./timeout")
];
var handlerQueue = [];

function drainQueue() {
    var i = 0,
        task,
        innerQueue = handlerQueue;
	handlerQueue = [];
	/*jslint boss: true */
	while (task = innerQueue[i++]) {
		task();
	}
}
var nextTick;
types.some(function (obj) {
    var t = obj.test();
    if (t) {
        nextTick = obj.install(drainQueue);
    }
    return t;
});
var retFunc = function (task) {
    var len, args;
    if (arguments.length > 1 && typeof task === "function") {
        args = Array.prototype.slice.call(arguments, 1);
        args.unshift(undefined);
        task = task.bind.apply(task, args);
    }
    if ((len = handlerQueue.push(task)) === 1) {
        nextTick(drainQueue);
    }
    return len;
};
retFunc.clear = function (n) {
    if (n <= handlerQueue.length) {
        handlerQueue[n - 1] = function () {};
    }
    return this;
};
module.exports = retFunc;

});
require.register("calvinmetcalf-setImmediate/lib/nextTick.js", function(exports, require, module){
"use strict";
exports.test = function () {
    // Don't get fooled by e.g. browserify environments.
    return typeof process === "object" && Object.prototype.toString.call(process) === "[object process]";
};

exports.install = function () {
    return process.nextTick;
};
});
require.register("calvinmetcalf-setImmediate/lib/postMessage.js", function(exports, require, module){
"use strict";
var globe = require("./global");
exports.test = function () {
    // The test against `importScripts` prevents this implementation from being installed inside a web worker,
    // where `global.postMessage` means something completely different and can"t be used for this purpose.

    if (!globe.postMessage || globe.importScripts) {
        return false;
    }

    var postMessageIsAsynchronous = true;
    var oldOnMessage = globe.onmessage;
    globe.onmessage = function () {
        postMessageIsAsynchronous = false;
    };
    globe.postMessage("", "*");
    globe.onmessage = oldOnMessage;

    return postMessageIsAsynchronous;
};

exports.install = function (func) {
    var codeWord = "com.calvinmetcalf.setImmediate" + Math.random();
    function globalMessage(event) {
        if (event.source === globe && event.data === codeWord) {
            func();
        }
    }
    if (globe.addEventListener) {
        globe.addEventListener("message", globalMessage, false);
    } else {
        globe.attachEvent("onmessage", globalMessage);
    }
    return function () {
        globe.postMessage(codeWord, "*");
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/messageChannel.js", function(exports, require, module){
"use strict";
var globe = require("./global");
exports.test = function () {
    return !!globe.MessageChannel;
};

exports.install = function (func) {
    var channel = new globe.MessageChannel();
    channel.port1.onmessage = func;
    return function () {
        channel.port2.postMessage(0);
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/stateChange.js", function(exports, require, module){
"use strict";
var globe = require("./global");
exports.test = function () {
    return "document" in globe && "onreadystatechange" in globe.document.createElement("script");
};

exports.install = function (handle) {
    return function () {

        // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
        // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
        var scriptEl = globe.document.createElement("script");
        scriptEl.onreadystatechange = function () {
            handle();

            scriptEl.onreadystatechange = null;
            scriptEl.parentNode.removeChild(scriptEl);
            scriptEl = null;
        };
        globe.document.documentElement.appendChild(scriptEl);

        return handle;
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/timeout.js", function(exports, require, module){
"use strict";
exports.test = function () {
    return true;
};

exports.install = function (t) {
    return function () {
        setTimeout(t, 0);
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/global.js", function(exports, require, module){
module.exports = typeof global === "object" && global ? global : this;
});
require.register("calvinmetcalf-setImmediate/lib/mutation.js", function(exports, require, module){
"use strict";
//based off rsvp
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/async.js
var globe = require("./global");

var MutationObserver = globe.MutationObserver || globe.WebKitMutationObserver;

exports.test = function () {
    return MutationObserver;
};

exports.install = function (handle) {
    var observer = new MutationObserver(handle);
    var element = globe.document.createElement("div");
    observer.observe(element, { attributes: true });

    // Chrome Memory Leak: https://bugs.webkit.org/show_bug.cgi?id=93661
    globe.addEventListener("unload", function () {
        observer.disconnect();
        observer = null;
    }, false);
    return function () {
        element.setAttribute("drainQueue", "drainQueue");
    };
};
});
require.register("calvinmetcalf-setImmediate/lib/realSetImmediate.js", function(exports, require, module){
"use strict";
var globe = require("./global");
exports.test = function () {
    return  globe.setImmediate;
};

exports.install = function (handle) {
    //return globe.setImmediate.bind(globe, handle);
    return globe.setTimeout.bind(globe,handle,0);
};

});
require.register("calvinmetcalf-lie/lie.js", function(exports, require, module){
var immediate = require('immediate');
// Creates a deferred: an object with a promise and corresponding resolve/reject methods
function Promise(resolver) {
     if (!(this instanceof Promise)) {
        return new Promise(resolver);
    }
    var queue = [];
    var resolved = false;
    // The `handler` variable points to the function that will
    // 1) handle a .then(onFulfilled, onRejected) call
    // 2) handle a .resolve or .reject call (if not fulfilled)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a simple .then handler.
    // We use only one function to save memory and complexity.
     // Case 1) handle a .then(onFulfilled, onRejected) call
    function pending(onFulfilled, onRejected){
        return Promise(function(resolver,rejecter){
            queue.push({
                resolve: onFulfilled,
                reject: onRejected,
                resolver:resolver,
                rejecter:rejecter
            });
        });
    }
    function then(onFulfilled, onRejected) {
        return resolved?resolved(onFulfilled, onRejected):pending(onFulfilled, onRejected);
    }
    // Case 2) handle a .resolve or .reject call
        // (`onFulfilled` acts as a sentinel)
        // The actual function signature is
        // .re[ject|solve](sentinel, success, value)
    function resolve(success, value){
        var action = success ? 'resolve' : 'reject';
        var queued;
        var callback;
        for (var i = 0, l = queue.length; i < l; i++) {
            queued = queue[i];
            callback = queued[action];
            if (typeof callback === 'function') {
                immediate(execute,callback, value, queued.resolver, queued.rejecter);
            }else if(success){
                queued.resolver(value);
            }else{
                queued.rejecter(value);
            }
        }
        // Replace this handler with a simple resolved or rejected handler
        resolved = createHandler(then, value, success);
    }
    this.then = then;
    function yes(value) {
        if (!resolved) {
            resolve(true, value);
        }
    }
    function no (reason) {
        if (!resolved) {
            resolve(false, reason);
        }
    }
    try{
        resolver(function(a){
            if(a && typeof a.then==='function'){
                a.then(yes,no);
            }else{
                yes(a);
            }
        },no);
    }catch(e){
        no(e);
    }
}

// Creates a fulfilled or rejected .then function
function createHandler(then, value, success) {
    return function(onFulfilled, onRejected) {
        var callback = success ? onFulfilled : onRejected;
        if (typeof callback !== 'function') {
            return Promise(function(resolve,reject){
                then(resolve,reject);
            });
        }
        return Promise(function(resolve,reject){
            immediate(execute,callback,value,resolve,reject);
       });
    };
}

// Executes the callback with the specified value,
// resolving or rejecting the deferred
function execute(callback, value, resolve, reject) {
        try {
            var result = callback(value);
            if (result && typeof result.then === 'function') {
                result.then(resolve, reject);
            }
            else {
                resolve(result);
            }
        }
        catch (error) {
            reject(error);
        }
}
module.exports = Promise;

});
require.register("calvinmetcalf-jszip/lib/base64.js", function(exports, require, module){
// private property
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";


// public method for encoding
exports.encode = function(input, utf8) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {

        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        }
        else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);

    }

    return output;
};

// public method for decoding
exports.decode = function(input, utf8) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

        enc1 = _keyStr.indexOf(input.charAt(i++));
        enc2 = _keyStr.indexOf(input.charAt(i++));
        enc3 = _keyStr.indexOf(input.charAt(i++));
        enc4 = _keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

    }

    return output;

};

});
require.register("calvinmetcalf-jszip/lib/compressedObject.js", function(exports, require, module){
function CompressedObject() {
    this.compressedSize = 0;
    this.uncompressedSize = 0;
    this.crc32 = 0;
    this.compressionMethod = null;
    this.compressedContent = null;
}

CompressedObject.prototype = {
    /**
     * Return the decompressed content in an unspecified format.
     * The format will depend on the decompressor.
     * @return {Object} the decompressed content.
     */
    getContent: function() {
        return null; // see implementation
    },
    /**
     * Return the compressed content in an unspecified format.
     * The format will depend on the compressed conten source.
     * @return {Object} the compressed content.
     */
    getCompressedContent: function() {
        return null; // see implementation
    }
};
module.exports = CompressedObject;

});
require.register("calvinmetcalf-jszip/lib/compressions.js", function(exports, require, module){
exports.STORE = {
    magic: "\x00\x00",
    compress: function(content) {
        return content; // no compression
    },
    uncompress: function(content) {
        return content; // no compression
    },
    compressInputType: null,
    uncompressInputType: null
};
exports.DEFLATE = require('./flate');

});
require.register("calvinmetcalf-jszip/lib/dataReader.js", function(exports, require, module){
var utils = require('./utils');

function DataReader(data) {
    this.data = null; // type : see implementation
    this.length = 0;
    this.index = 0;
}
DataReader.prototype = {
    /**
     * Check that the offset will not go too far.
     * @param {string} offset the additional offset to check.
     * @throws {Error} an Error if the offset is out of bounds.
     */
    checkOffset: function(offset) {
        this.checkIndex(this.index + offset);
    },
    /**
     * Check that the specifed index will not be too far.
     * @param {string} newIndex the index to check.
     * @throws {Error} an Error if the index is out of bounds.
     */
    checkIndex: function(newIndex) {
        if (this.length < newIndex || newIndex < 0) {
            throw new Error("End of data reached (data length = " + this.length + ", asked index = " + (newIndex) + "). Corrupted zip ?");
        }
    },
    /**
     * Change the index.
     * @param {number} newIndex The new index.
     * @throws {Error} if the new index is out of the data.
     */
    setIndex: function(newIndex) {
        this.checkIndex(newIndex);
        this.index = newIndex;
    },
    /**
     * Skip the next n bytes.
     * @param {number} n the number of bytes to skip.
     * @throws {Error} if the new index is out of the data.
     */
    skip: function(n) {
        this.setIndex(this.index + n);
    },
    /**
     * Get the byte at the specified index.
     * @param {number} i the index to use.
     * @return {number} a byte.
     */
    byteAt: function(i) {
        // see implementations
    },
    /**
     * Get the next number with a given byte size.
     * @param {number} size the number of bytes to read.
     * @return {number} the corresponding number.
     */
    readInt: function(size) {
        var result = 0,
            i;
        this.checkOffset(size);
        for (i = this.index + size - 1; i >= this.index; i--) {
            result = (result << 8) + this.byteAt(i);
        }
        this.index += size;
        return result;
    },
    /**
     * Get the next string with a given byte size.
     * @param {number} size the number of bytes to read.
     * @return {string} the corresponding string.
     */
    readString: function(size) {
        return utils.transformTo("string", this.readData(size));
    },
    /**
     * Get raw data without conversion, <size> bytes.
     * @param {number} size the number of bytes to read.
     * @return {Object} the raw data, implementation specific.
     */
    readData: function(size) {
        // see implementations
    },
    /**
     * Find the last occurence of a zip signature (4 bytes).
     * @param {string} sig the signature to find.
     * @return {number} the index of the last occurence, -1 if not found.
     */
    lastIndexOfSignature: function(sig) {
        // see implementations
    },
    /**
     * Get the next date.
     * @return {Date} the date.
     */
    readDate: function() {
        var dostime = this.readInt(4);
        return new Date(
        ((dostime >> 25) & 0x7f) + 1980, // year
        ((dostime >> 21) & 0x0f) - 1, // month
        (dostime >> 16) & 0x1f, // day
        (dostime >> 11) & 0x1f, // hour
        (dostime >> 5) & 0x3f, // minute
        (dostime & 0x1f) << 1); // second
    }
};
module.exports = DataReader;

});
require.register("calvinmetcalf-jszip/lib/defaults.js", function(exports, require, module){
exports.base64 = false;
exports.binary = false;
exports.dir = false;
exports.date = null;
exports.compression = null;
});
require.register("calvinmetcalf-jszip/lib/index.js", function(exports, require, module){
/**

JSZip - A Javascript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2012 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.

Usage:
   zip = new JSZip();
   zip.file("hello.txt", "Hello, World!").file("tempfile", "nothing");
   zip.folder("images").file("smile.gif", base64Data, {base64: true});
   zip.file("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
   zip.remove("tempfile");

   base64zip = zip.generate();

**/

/**
 * Representation a of zip file in js
 * @constructor
 * @param {String=|ArrayBuffer=|Uint8Array=} data the data to load, if any (optional).
 * @param {Object=} options the options for creating this objects (optional).
 */

var JSZip = function(data, options) {
    // object containing the files :
    // {
    //   "folder/" : {...},
    //   "folder/data.txt" : {...}
    // }
    this.files = {};

    // Where we are in the hierarchy
    this.root = "";

    if (data) {
        this.load(data, options);
    }
};



JSZip.prototype = require('./object');
JSZip.prototype.clone = function() {
    var newObj = new JSZip();
    for (var i in this) {
        if (typeof this[i] !== "function") {
            newObj[i] = this[i];
        }
    }
    return newObj;
};
JSZip.prototype.load = require('./load');
JSZip.support = require('./support');
JSZip.utils = require('./utils');
JSZip.base64 = require('./base64');
JSZip.compressions = require('./compressions');
module.exports = JSZip;

});
require.register("calvinmetcalf-jszip/lib/load.js", function(exports, require, module){
var base64 = require('./base64');
var ZipEntries = require('./zipEntries');
module.exports = function(data, options) {
    var files, zipEntries, i, input;
    options = options || {};
    if (options.base64) {
        data = base64.decode(data);
    }

    zipEntries = new ZipEntries(data, options);
    files = zipEntries.files;
    for (i = 0; i < files.length; i++) {
        input = files[i];
        this.file(input.fileName, input.decompressed, {
            binary: true,
            optimizedBinaryString: true,
            date: input.date,
            dir: input.dir
        });
    }

    return this;
};

});
require.register("calvinmetcalf-jszip/lib/nodeBufferReader.js", function(exports, require, module){
var Uint8ArrayReader = require('./uint8ArrayReader');

function NodeBufferReader(data) {
    this.data = data;
    this.length = this.data.length;
    this.index = 0;
}
NodeBufferReader.prototype = new Uint8ArrayReader();

/**
 * @see DataReader.readData
 */
NodeBufferReader.prototype.readData = function(size) {
    this.checkOffset(size);
    var result = this.data.slice(this.index, this.index + size);
    this.index += size;
    return result;
};
module.exports = NodeBufferReader;

});
require.register("calvinmetcalf-jszip/lib/object.js", function(exports, require, module){
var support = require('./support');
var utils = require('./utils');
var signature = require('./signature');
var defaults = require('./defaults');
var base64 = require('./base64');
var compressions = require('./compressions');
var CompressedObject = require('./compressedObject');
/**
 * Returns the raw data of a ZipObject, decompress the content if necessary.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */

var getRawData = function(file) {
    if (file._data instanceof CompressedObject) {
        file._data = file._data.getContent();
        file.options.binary = true;
        file.options.base64 = false;

        if (utils.getTypeOf(file._data) === "uint8array") {
            var copy = file._data;
            // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
            // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
            file._data = new Uint8Array(copy.length);
            // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
            if (copy.length !== 0) {
                file._data.set(copy, 0);
            }
        }
    }
    return file._data;
};

/**
 * Returns the data of a ZipObject in a binary form. If the content is an unicode string, encode it.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
var getBinaryData = function(file) {
    var result = getRawData(file),
        type = utils.getTypeOf(result);
    if (type === "string") {
        if (!file.options.binary) {
            // unicode text !
            // unicode string => binary string is a painful process, check if we can avoid it.
            if (support.uint8array && typeof TextEncoder === "function") {
                return TextEncoder("utf-8").encode(result);
            }
            if (support.nodebuffer) {
                return new Buffer(result, "utf-8");
            }
        }
        return file.asBinary();
    }
    return result;
}

/**
 * Transform this._data into a string.
 * @param {function} filter a function String -> String, applied if not null on the result.
 * @return {String} the string representing this._data.
 */
var dataToString = function(asUTF8) {
    var result = getRawData(this);
    if (result === null || typeof result === "undefined") {
        return "";
    }
    // if the data is a base64 string, we decode it before checking the encoding !
    if (this.options.base64) {
        result = base64.decode(result);
    }
    if (asUTF8 && this.options.binary) {
        // JSZip.prototype.utf8decode supports arrays as input
        // skip to array => string step, utf8decode will do it.
        result = out.utf8decode(result);
    }
    else {
        // no utf8 transformation, do the array => string step.
        result = utils.transformTo("string", result);
    }

    if (!asUTF8 && !this.options.binary) {
        result = out.utf8encode(result);
    }
    return result;
};
/**
 * A simple object representing a file in the zip file.
 * @constructor
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
 * @param {Object} options the options of the file
 */
var ZipObject = function(name, data, options) {
    this.name = name;
    this._data = data;
    this.options = options;
};

ZipObject.prototype = {
    /**
     * Return the content as UTF8 string.
     * @return {string} the UTF8 string.
     */
    asText: function() {
        return dataToString.call(this, true);
    },
    /**
     * Returns the binary content.
     * @return {string} the content as binary.
     */
    asBinary: function() {
        return dataToString.call(this, false);
    },
    /**
     * Returns the content as a nodejs Buffer.
     * @return {Buffer} the content as a Buffer.
     */
    asNodeBuffer: function() {
        var result = getBinaryData(this);
        return utils.transformTo("nodebuffer", result);
    },
    /**
     * Returns the content as an Uint8Array.
     * @return {Uint8Array} the content as an Uint8Array.
     */
    asUint8Array: function() {
        var result = getBinaryData(this);
        return utils.transformTo("uint8array", result);
    },
    /**
     * Returns the content as an ArrayBuffer.
     * @return {ArrayBuffer} the content as an ArrayBufer.
     */
    asArrayBuffer: function() {
        return this.asUint8Array().buffer;
    }
};

/**
 * Transform an integer into a string in hexadecimal.
 * @private
 * @param {number} dec the number to convert.
 * @param {number} bytes the number of bytes to generate.
 * @returns {string} the result.
 */
var decToHex = function(dec, bytes) {
    var hex = "",
        i;
    for (i = 0; i < bytes; i++) {
        hex += String.fromCharCode(dec & 0xff);
        dec = dec >>> 8;
    }
    return hex;
};

/**
 * Merge the objects passed as parameters into a new one.
 * @private
 * @param {...Object} var_args All objects to merge.
 * @return {Object} a new object with the data of the others.
 */
var extend = function() {
    var result = {}, i, attr;
    for (i = 0; i < arguments.length; i++) { // arguments is not enumerable in some browsers
        for (attr in arguments[i]) {
            if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
                result[attr] = arguments[i][attr];
            }
        }
    }
    return result;
};

/**
 * Transforms the (incomplete) options from the user into the complete
 * set of options to create a file.
 * @private
 * @param {Object} o the options from the user.
 * @return {Object} the complete set of options.
 */
var prepareFileAttrs = function(o) {
    o = o || {};
    if (o.base64 === true && o.binary == null) {
        o.binary = true;
    }
    o = extend(o, defaults);
    o.date = o.date || new Date();
    if (o.compression !== null) o.compression = o.compression.toUpperCase();

    return o;
};

/**
 * Add a file in the current folder.
 * @private
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
 * @param {Object} o the options of the file
 * @return {Object} the new file.
 */
var fileAdd = function(name, data, o) {
    // be sure sub folders exist
    var parent = parentFolder(name),
        dataType = utils.getTypeOf(data);
    if (parent) {
        folderAdd.call(this, parent);
    }

    o = prepareFileAttrs(o);

    if (o.dir || data === null || typeof data === "undefined") {
        o.base64 = false;
        o.binary = false;
        data = null;
    }
    else if (dataType === "string") {
        if (o.binary && !o.base64) {
            // optimizedBinaryString == true means that the file has already been filtered with a 0xFF mask
            if (o.optimizedBinaryString !== true) {
                // this is a string, not in a base64 format.
                // Be sure that this is a correct "binary string"
                data = utils.string2binary(data);
            }
        }
    }
    else { // arraybuffer, uint8array, ...
        o.base64 = false;
        o.binary = true;

        if (!dataType && !(data instanceof CompressedObject)) {
            throw new Error("The data of '" + name + "' is in an unsupported format !");
        }

        // special case : it's way easier to work with Uint8Array than with ArrayBuffer
        if (dataType === "arraybuffer") {
            data = utils.transformTo("uint8array", data);
        }
    }

    return this.files[name] = new ZipObject(name, data, o);
};


/**
 * Find the parent folder of the path.
 * @private
 * @param {string} path the path to use
 * @return {string} the parent folder, or ""
 */
var parentFolder = function(path) {
    if (path.slice(-1) == '/') {
        path = path.substring(0, path.length - 1);
    }
    var lastSlash = path.lastIndexOf('/');
    return (lastSlash > 0) ? path.substring(0, lastSlash) : "";
};

/**
 * Add a (sub) folder in the current folder.
 * @private
 * @param {string} name the folder's name
 * @return {Object} the new folder.
 */
var folderAdd = function(name) {
    // Check the name ends with a /
    if (name.slice(-1) != "/") {
        name += "/"; // IE doesn't like substr(-1)
    }

    // Does this folder already exist?
    if (!this.files[name]) {
        fileAdd.call(this, name, null, {
            dir: true
        });
    }
    return this.files[name];
};

/**
 * Generate a JSZip.CompressedObject for a given zipOject.
 * @param {ZipObject} file the object to read.
 * @param {JSZip.compression} compression the compression to use.
 * @return {JSZip.CompressedObject} the compressed result.
 */
var generateCompressedObjectFrom = function(file, compression) {
    var result = new CompressedObject(),
        content;

    // the data has not been decompressed, we might reuse things !
    if (file._data instanceof CompressedObject) {
        result.uncompressedSize = file._data.uncompressedSize;
        result.crc32 = file._data.crc32;

        if (result.uncompressedSize === 0 || file.options.dir) {
            compression = compressions['STORE'];
            result.compressedContent = "";
            result.crc32 = 0;
        }
        else if (file._data.compressionMethod === compression.magic) {
            result.compressedContent = file._data.getCompressedContent();
        }
        else {
            content = file._data.getContent()
            // need to decompress / recompress
            result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content));
        }
    }
    else {
        // have uncompressed data
        content = getBinaryData(file);
        if (!content || content.length === 0 || file.options.dir) {
            compression = compressions['STORE'];
            content = "";
        }
        result.uncompressedSize = content.length;
        result.crc32 = this.crc32(content);
        result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content));
    }

    result.compressedSize = result.compressedContent.length;
    result.compressionMethod = compression.magic;

    return result;
};

/**
 * Generate the various parts used in the construction of the final zip file.
 * @param {string} name the file name.
 * @param {ZipObject} file the file content.
 * @param {JSZip.CompressedObject} compressedObject the compressed object.
 * @param {number} offset the current offset from the start of the zip file.
 * @return {object} the zip parts.
 */
var generateZipParts = function(name, file, compressedObject, offset) {
    var data = compressedObject.compressedContent,
        utfEncodedFileName = this.utf8encode(file.name),
        useUTF8 = utfEncodedFileName !== file.name,
        o = file.options,
        dosTime,
        dosDate;

    // date
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
    // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

    dosTime = o.date.getHours();
    dosTime = dosTime << 6;
    dosTime = dosTime | o.date.getMinutes();
    dosTime = dosTime << 5;
    dosTime = dosTime | o.date.getSeconds() / 2;

    dosDate = o.date.getFullYear() - 1980;
    dosDate = dosDate << 4;
    dosDate = dosDate | (o.date.getMonth() + 1);
    dosDate = dosDate << 5;
    dosDate = dosDate | o.date.getDate();


    var header = "";

    // version needed to extract
    header += "\x0A\x00";
    // general purpose bit flag
    // set bit 11 if utf8
    header += useUTF8 ? "\x00\x08" : "\x00\x00";
    // compression method
    header += compressedObject.compressionMethod;
    // last mod file time
    header += decToHex(dosTime, 2);
    // last mod file date
    header += decToHex(dosDate, 2);
    // crc-32
    header += decToHex(compressedObject.crc32, 4);
    // compressed size
    header += decToHex(compressedObject.compressedSize, 4);
    // uncompressed size
    header += decToHex(compressedObject.uncompressedSize, 4);
    // file name length
    header += decToHex(utfEncodedFileName.length, 2);
    // extra field length
    header += "\x00\x00";


    var fileRecord = signature.LOCAL_FILE_HEADER + header + utfEncodedFileName;

    var dirRecord = signature.CENTRAL_FILE_HEADER +
    // version made by (00: DOS)
    "\x14\x00" +
    // file header (common to file and central directory)
    header +
    // file comment length
    "\x00\x00" +
    // disk number start
    "\x00\x00" +
    // internal file attributes TODO
    "\x00\x00" +
    // external file attributes
    (file.options.dir === true ? "\x10\x00\x00\x00" : "\x00\x00\x00\x00") +
    // relative offset of local header
    decToHex(offset, 4) +
    // file name
    utfEncodedFileName;


    return {
        fileRecord: fileRecord,
        dirRecord: dirRecord,
        compressedObject: compressedObject
    };
};

/**
 * An object to write any content to a string.
 * @constructor
 */
var StringWriter = function() {
    this.data = [];
};
StringWriter.prototype = {
    /**
     * Append any content to the current string.
     * @param {Object} input the content to add.
     */
    append: function(input) {
        input = utils.transformTo("string", input);
        this.data.push(input);
    },
    /**
     * Finalize the construction an return the result.
     * @return {string} the generated string.
     */
    finalize: function() {
        return this.data.join("");
    }
};
/**
 * An object to write any content to an Uint8Array.
 * @constructor
 * @param {number} length The length of the array.
 */
var Uint8ArrayWriter = function(length) {
    this.data = new Uint8Array(length);
    this.index = 0;
};
Uint8ArrayWriter.prototype = {
    /**
     * Append any content to the current array.
     * @param {Object} input the content to add.
     */
    append: function(input) {
        if (input.length !== 0) {
            // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
            input = utils.transformTo("uint8array", input);
            this.data.set(input, this.index);
            this.index += input.length;
        }
    },
    /**
     * Finalize the construction an return the result.
     * @return {Uint8Array} the generated array.
     */
    finalize: function() {
        return this.data;
    }
};

// return the actual prototype of JSZip
var out = {
    /**
     * Read an existing zip and merge the data in the current JSZip object.
     * The implementation is in jszip-load.js, don't forget to include it.
     * @param {String|ArrayBuffer|Uint8Array|Buffer} stream  The stream to load
     * @param {Object} options Options for loading the stream.
     *  options.base64 : is the stream in base64 ? default : false
     * @return {JSZip} the current JSZip object
     */
    load: function(stream, options) {
        throw new Error("Load method is not defined. Is the file jszip-load.js included ?");
    },

    /**
     * Filter nested files/folders with the specified function.
     * @param {Function} search the predicate to use :
     * function (relativePath, file) {...}
     * It takes 2 arguments : the relative path and the file.
     * @return {Array} An array of matching elements.
     */
    filter: function(search) {
        var result = [],
            filename, relativePath, file, fileClone;
        for (filename in this.files) {
            if (!this.files.hasOwnProperty(filename)) {
                continue;
            }
            file = this.files[filename];
            // return a new object, don't let the user mess with our internal objects :)
            fileClone = new ZipObject(file.name, file._data, extend(file.options));
            relativePath = filename.slice(this.root.length, filename.length);
            if (filename.slice(0, this.root.length) === this.root && // the file is in the current root
            search(relativePath, fileClone)) { // and the file matches the function
                result.push(fileClone);
            }
        }
        return result;
    },

    /**
     * Add a file to the zip file, or search a file.
     * @param   {string|RegExp} name The name of the file to add (if data is defined),
     * the name of the file to find (if no data) or a regex to match files.
     * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
     * @param   {Object} o     File options
     * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
     * a file (when searching by string) or an array of files (when searching by regex).
     */
    file: function(name, data, o) {
        if (arguments.length === 1) {
            if (name instanceof RegExp) {
                var regexp = name;
                return this.filter(function(relativePath, file) {
                    return !file.options.dir && regexp.test(relativePath);
                });
            }
            else { // text
                return this.filter(function(relativePath, file) {
                    return !file.options.dir && relativePath === name;
                })[0] || null;
            }
        }
        else { // more than one argument : we have data !
            name = this.root + name;
            fileAdd.call(this, name, data, o);
        }
        return this;
    },

    /**
     * Add a directory to the zip file, or search.
     * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
     * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
     */
    folder: function(arg) {
        if (!arg) {
            return this;
        }

        if (arg instanceof RegExp) {
            return this.filter(function(relativePath, file) {
                return file.options.dir && arg.test(relativePath);
            });
        }

        // else, name is a new folder
        var name = this.root + arg;
        var newFolder = folderAdd.call(this, name);

        // Allow chaining by returning a new object with this folder as the root
        var ret = this.clone();
        ret.root = newFolder.name;
        return ret;
    },

    /**
     * Delete a file, or a directory and all sub-files, from the zip
     * @param {string} name the name of the file to delete
     * @return {JSZip} this JSZip object
     */
    remove: function(name) {
        name = this.root + name;
        var file = this.files[name];
        if (!file) {
            // Look for any folders
            if (name.slice(-1) != "/") {
                name += "/";
            }
            file = this.files[name];
        }

        if (file) {
            if (!file.options.dir) {
                // file
                delete this.files[name];
            }
            else {
                // folder
                var kids = this.filter(function(relativePath, file) {
                    return file.name.slice(0, name.length) === name;
                });
                for (var i = 0; i < kids.length; i++) {
                    delete this.files[kids[i].name];
                }
            }
        }

        return this;
    },

    /**
     * Generate the complete zip file
     * @param {Object} options the options to generate the zip file :
     * - base64, (deprecated, use type instead) true to generate base64.
     * - compression, "STORE" by default.
     * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
     * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the zip file
     */
    generate: function(options) {
        options = extend(options || {}, {
            base64: true,
            compression: "STORE",
            type: "base64"
        });

        utils.checkSupport(options.type);

        var zipData = [],
            localDirLength = 0,
            centralDirLength = 0,
            writer, i;


        // first, generate all the zip parts.
        for (var name in this.files) {
            if (!this.files.hasOwnProperty(name)) {
                continue;
            }
            var file = this.files[name];

            var compressionName = file.options.compression || options.compression.toUpperCase();
            var compression = compressions[compressionName];
            if (!compression) {
                throw new Error(compressionName + " is not a valid compression method !");
            }

            var compressedObject = generateCompressedObjectFrom.call(this, file, compression);

            var zipPart = generateZipParts.call(this, name, file, compressedObject, localDirLength);
            localDirLength += zipPart.fileRecord.length + compressedObject.compressedSize;
            centralDirLength += zipPart.dirRecord.length;
            zipData.push(zipPart);
        }

        var dirEnd = "";

        // end of central dir signature
        dirEnd = signature.CENTRAL_DIRECTORY_END +
        // number of this disk
        "\x00\x00" +
        // number of the disk with the start of the central directory
        "\x00\x00" +
        // total number of entries in the central directory on this disk
        decToHex(zipData.length, 2) +
        // total number of entries in the central directory
        decToHex(zipData.length, 2) +
        // size of the central directory   4 bytes
        decToHex(centralDirLength, 4) +
        // offset of start of central directory with respect to the starting disk number
        decToHex(localDirLength, 4) +
        // .ZIP file comment length
        "\x00\x00";


        // we have all the parts (and the total length)
        // time to create a writer !
        switch (options.type.toLowerCase()) {
        case "uint8array":
        case "arraybuffer":
        case "blob":
        case "nodebuffer":
            writer = new Uint8ArrayWriter(localDirLength + centralDirLength + dirEnd.length);
            break;
        case "base64":
        default:
            // case "string" :
            writer = new StringWriter(localDirLength + centralDirLength + dirEnd.length);
            break;
        }

        for (i = 0; i < zipData.length; i++) {
            writer.append(zipData[i].fileRecord);
            writer.append(zipData[i].compressedObject.compressedContent);
        }
        for (i = 0; i < zipData.length; i++) {
            writer.append(zipData[i].dirRecord);
        }

        writer.append(dirEnd);

        var zip = writer.finalize();



        switch (options.type.toLowerCase()) {
            // case "zip is an Uint8Array"
        case "uint8array":
        case "arraybuffer":
        case "nodebuffer":
            return utils.transformTo(options.type.toLowerCase(), zip);
        case "blob":
            return utils.arrayBuffer2Blob(utils.transformTo("arraybuffer", zip));

            // case "zip is a string"
        case "base64":
            return (options.base64) ? base64.encode(zip) : zip;
        default:
            // case "string" :
            return zip;
        }
    },

    /**
     *
     *  Javascript crc32
     *  http://www.webtoolkit.info/
     *
     */
    crc32: function crc32(input, crc) {
        if (typeof input === "undefined" || !input.length) {
            return 0;
        }

        var isArray = utils.getTypeOf(input) !== "string";

        var table = [
        0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
        0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
        0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988,
        0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
        0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
        0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
        0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC,
        0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
        0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172,
        0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
        0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940,
        0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
        0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116,
        0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
        0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
        0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
        0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A,
        0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
        0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818,
        0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
        0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E,
        0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
        0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C,
        0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
        0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
        0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
        0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0,
        0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
        0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086,
        0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
        0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4,
        0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,
        0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A,
        0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
        0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
        0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
        0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE,
        0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
        0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC,
        0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
        0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252,
        0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
        0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60,
        0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
        0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
        0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
        0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04,
        0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,
        0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A,
        0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
        0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38,
        0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
        0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E,
        0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
        0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
        0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
        0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2,
        0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
        0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0,
        0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
        0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6,
        0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
        0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94,
        0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];

        if (typeof(crc) == "undefined") {
            crc = 0;
        }
        var x = 0;
        var y = 0;
        var byte = 0;

        crc = crc ^ (-1);
        for (var i = 0, iTop = input.length; i < iTop; i++) {
            byte = isArray ? input[i] : input.charCodeAt(i);
            y = (crc ^ byte) & 0xFF;
            x = table[y];
            crc = (crc >>> 8) ^ x;
        }

        return crc ^ (-1);
    },

    // Inspired by http://my.opera.com/GreyWyvern/blog/show.dml/1725165

    /**
     * http://www.webtoolkit.info/javascript-utf8.html
     */
    utf8encode: function(string) {
        // TextEncoder + Uint8Array to binary string is faster than checking every bytes on long strings.
        // http://jsperf.com/utf8encode-vs-textencoder
        // On short strings (file names for example), the TextEncoder API is (currently) slower.
        if (support.uint8array && typeof TextEncoder === "function") {
            var u8 = TextEncoder("utf-8").encode(string);
            return utils.transformTo("string", u8);
        }
        if (support.nodebuffer) {
            return utils.transformTo("string", new Buffer(string, "utf-8"));
        }

        // array.join may be slower than string concatenation but generates less objects (less time spent garbage collecting).
        // See also http://jsperf.com/array-direct-assignment-vs-push/31
        var result = [],
            resIndex = 0;

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                result[resIndex++] = String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                result[resIndex++] = String.fromCharCode((c >> 6) | 192);
                result[resIndex++] = String.fromCharCode((c & 63) | 128);
            }
            else {
                result[resIndex++] = String.fromCharCode((c >> 12) | 224);
                result[resIndex++] = String.fromCharCode(((c >> 6) & 63) | 128);
                result[resIndex++] = String.fromCharCode((c & 63) | 128);
            }

        }

        return result.join("");
    },

    /**
     * http://www.webtoolkit.info/javascript-utf8.html
     */
    utf8decode: function(input) {
        var result = [],
            resIndex = 0;
        var type = utils.getTypeOf(input);
        var isArray = type !== "string";
        var i = 0;
        var c = 0,
            c1 = 0,
            c2 = 0,
            c3 = 0;

        // check if we can use the TextDecoder API
        // see http://encoding.spec.whatwg.org/#api
        if (support.uint8array && typeof TextDecoder === "function") {
            return TextDecoder("utf-8").decode(
            utils.transformTo("uint8array", input));
        }
        if (support.nodebuffer) {
            return utils.transformTo("nodebuffer", input).toString("utf-8");
        }

        while (i < input.length) {

            c = isArray ? input[i] : input.charCodeAt(i);

            if (c < 128) {
                result[resIndex++] = String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = isArray ? input[i + 1] : input.charCodeAt(i + 1);
                result[resIndex++] = String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = isArray ? input[i + 1] : input.charCodeAt(i + 1);
                c3 = isArray ? input[i + 2] : input.charCodeAt(i + 2);
                result[resIndex++] = String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return result.join("");
    }
};
module.exports = out;

});
require.register("calvinmetcalf-jszip/lib/signature.js", function(exports, require, module){
exports.LOCAL_FILE_HEADER = "PK\x03\x04";
exports.CENTRAL_FILE_HEADER = "PK\x01\x02";
exports.CENTRAL_DIRECTORY_END = "PK\x05\x06";
exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x06\x07";
exports.ZIP64_CENTRAL_DIRECTORY_END = "PK\x06\x06";
exports.DATA_DESCRIPTOR = "PK\x07\x08";

});
require.register("calvinmetcalf-jszip/lib/stringReader.js", function(exports, require, module){
var DataReader = require('./dataReader');
var utils = require('./utils');

function StringReader(data, optimizedBinaryString) {
    this.data = data;
    if (!optimizedBinaryString) {
        this.data = utils.string2binary(this.data);
    }
    this.length = this.data.length;
    this.index = 0;
}
StringReader.prototype = new DataReader();
/**
 * @see DataReader.byteAt
 */
StringReader.prototype.byteAt = function(i) {
    return this.data.charCodeAt(i);
};
/**
 * @see DataReader.lastIndexOfSignature
 */
StringReader.prototype.lastIndexOfSignature = function(sig) {
    return this.data.lastIndexOf(sig);
};
/**
 * @see DataReader.readData
 */
StringReader.prototype.readData = function(size) {
    this.checkOffset(size);
    // this will work because the constructor applied the "& 0xff" mask.
    var result = this.data.slice(this.index, this.index + size);
    this.index += size;
    return result;
};
module.exports = StringReader;
});
require.register("calvinmetcalf-jszip/lib/support.js", function(exports, require, module){
exports.base64 = true;
exports.array = true;
exports.string = true;
exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
// contains true if JSZip can read/generate nodejs Buffer, false otherwise.
exports.nodebuffer = typeof Buffer !== "undefined";
// contains true if JSZip can read/generate Uint8Array, false otherwise.
exports.uint8array = typeof Uint8Array !== "undefined";

if (typeof ArrayBuffer === "undefined") {
    exports.blob = false;
}
else {
    var buffer = new ArrayBuffer(0);
    try {
        exports.blob = new Blob([buffer], {
            type: "application/zip"
        }).size === 0;
    }
    catch (e) {
        try {
            var b = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var builder = new b();
            builder.append(buffer);
            exports.blob = builder.getBlob('application/zip').size === 0;
        }
        catch (e) {
            exports.blob = false;
        }
    }
}

});
require.register("calvinmetcalf-jszip/lib/uint8ArrayReader.js", function(exports, require, module){
var DataReader = require('./dataReader');

function Uint8ArrayReader(data) {
    if (data) {
        this.data = data;
        this.length = this.data.length;
        this.index = 0;
    }
}
Uint8ArrayReader.prototype = new DataReader();
/**
 * @see DataReader.byteAt
 */
Uint8ArrayReader.prototype.byteAt = function(i) {
    return this.data[i];
};
/**
 * @see DataReader.lastIndexOfSignature
 */
Uint8ArrayReader.prototype.lastIndexOfSignature = function(sig) {
    var sig0 = sig.charCodeAt(0),
        sig1 = sig.charCodeAt(1),
        sig2 = sig.charCodeAt(2),
        sig3 = sig.charCodeAt(3);
    for (var i = this.length - 4; i >= 0; --i) {
        if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) {
            return i;
        }
    }

    return -1;
};
/**
 * @see DataReader.readData
 */
Uint8ArrayReader.prototype.readData = function(size) {
    this.checkOffset(size);
    var result = this.data.subarray(this.index, this.index + size);
    this.index += size;
    return result;
};
module.exports = Uint8ArrayReader;
});
require.register("calvinmetcalf-jszip/lib/utils.js", function(exports, require, module){
var support = require('./support');
var compressions = require('./compressions');
/**
 * Convert a string to a "binary string" : a string containing only char codes between 0 and 255.
 * @param {string} str the string to transform.
 * @return {String} the binary string.
 */
exports.string2binary = function(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) & 0xff);
    }
    return result;
};
/**
 * Create a Uint8Array from the string.
 * @param {string} str the string to transform.
 * @return {Uint8Array} the typed array.
 * @throws {Error} an Error if the browser doesn't support the requested feature.
 */
exports.string2Uint8Array = function(str) {
    return exports.transformTo("uint8array", str);
};

/**
 * Create a string from the Uint8Array.
 * @param {Uint8Array} array the array to transform.
 * @return {string} the string.
 * @throws {Error} an Error if the browser doesn't support the requested feature.
 */
exports.uint8Array2String = function(array) {
    return exports.transformTo("string", array);
};
/**
 * Create a blob from the given string.
 * @param {string} str the string to transform.
 * @return {Blob} the string.
 * @throws {Error} an Error if the browser doesn't support the requested feature.
 */
exports.string2Blob = function(str) {
    var buffer = exports.transformTo("arraybuffer", str);
    return exports.arrayBuffer2Blob(buffer);
};
exports.arrayBuffer2Blob = function(buffer) {
    exports.checkSupport("blob");

    try {
        // Blob constructor
        return new Blob([buffer], {
            type: "application/zip"
        });
    }
    catch (e) {

        try {
            // deprecated, browser only, old way
            var builder = new(window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder)();
            builder.append(buffer);
            return builder.getBlob('application/zip');
        }
        catch (e) {

            // well, fuck ?!
            throw new Error("Bug : can't construct the Blob.");
        }
    }


};
/**
 * The identity function.
 * @param {Object} input the input.
 * @return {Object} the same input.
 */
function identity(input) {
    return input;
};

/**
 * Fill in an array with a string.
 * @param {String} str the string to use.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
 */
function stringToArrayLike(str, array) {
    for (var i = 0; i < str.length; ++i) {
        array[i] = str.charCodeAt(i) & 0xFF;
    }
    return array;
};

/**
 * Transform an array-like object to a string.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
 * @return {String} the result.
 */
function arrayLikeToString(array) {
    // Performances notes :
    // --------------------
    // String.fromCharCode.apply(null, array) is the fastest, see
    // see http://jsperf.com/converting-a-uint8array-to-a-string/2
    // but the stack is limited (and we can get huge arrays !).
    //
    // result += String.fromCharCode(array[i]); generate too many strings !
    //
    // This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
    var chunk = 65536;
    var result = [],
        len = array.length,
        type = exports.getTypeOf(array),
        k = 0;

    while (k < len && chunk > 1) {
        try {
            if (type === "array" || type === "nodebuffer") {
                result.push(String.fromCharCode.apply(null, array.slice(k, Math.max(k + chunk, len))));
            }
            else {
                result.push(String.fromCharCode.apply(null, array.subarray(k, k + chunk)));
            }
            k += chunk;
        }
        catch (e) {
            chunk = Math.floor(chunk / 2);
        }
    }
    return result.join("");
};

/**
 * Copy the data from an array-like to an other array-like.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
 * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
 * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
 */
function arrayLikeToArrayLike(arrayFrom, arrayTo) {
    for (var i = 0; i < arrayFrom.length; i++) {
        arrayTo[i] = arrayFrom[i];
    }
    return arrayTo;
};

// a matrix containing functions to transform everything into everything.
var transform = {};

// string to ?
transform["string"] = {
    "string": identity,
    "array": function(input) {
        return stringToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return transform["string"]["uint8array"](input).buffer;
    },
    "uint8array": function(input) {
        return stringToArrayLike(input, new Uint8Array(input.length));
    },
    "nodebuffer": function(input) {
        return stringToArrayLike(input, new Buffer(input.length));
    }
};

// array to ?
transform["array"] = {
    "string": arrayLikeToString,
    "array": identity,
    "arraybuffer": function(input) {
        return (new Uint8Array(input)).buffer;
    },
    "uint8array": function(input) {
        return new Uint8Array(input);
    },
    "nodebuffer": function(input) {
        return new Buffer(input);
    }
};

// arraybuffer to ?
transform["arraybuffer"] = {
    "string": function(input) {
        return arrayLikeToString(new Uint8Array(input));
    },
    "array": function(input) {
        return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
    },
    "arraybuffer": identity,
    "uint8array": function(input) {
        return new Uint8Array(input);
    },
    "nodebuffer": function(input) {
        return new Buffer(new Uint8Array(input));
    }
};

// uint8array to ?
transform["uint8array"] = {
    "string": arrayLikeToString,
    "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return input.buffer;
    },
    "uint8array": identity,
    "nodebuffer": function(input) {
        return new Buffer(input);
    }
};

// nodebuffer to ?
transform["nodebuffer"] = {
    "string": arrayLikeToString,
    "array": function(input) {
        return arrayLikeToArrayLike(input, new Array(input.length));
    },
    "arraybuffer": function(input) {
        return transform["nodebuffer"]["uint8array"](input).buffer;
    },
    "uint8array": function(input) {
        return arrayLikeToArrayLike(input, new Uint8Array(input.length));
    },
    "nodebuffer": identity
};

/**
 * Transform an input into any type.
 * The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
 * If no output type is specified, the unmodified input will be returned.
 * @param {String} outputType the output type.
 * @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
 * @throws {Error} an Error if the browser doesn't support the requested output type.
 */
exports.transformTo = function(outputType, input) {
    if (!input) {
        // undefined, null, etc
        // an empty string won't harm.
        input = "";
    }
    if (!outputType) {
        return input;
    }
    exports.checkSupport(outputType);
    var inputType = exports.getTypeOf(input);
    var result = transform[inputType][outputType](input);
    return result;
};

/**
 * Return the type of the input.
 * The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
 * @param {Object} input the input to identify.
 * @return {String} the (lowercase) type of the input.
 */
exports.getTypeOf = function(input) {
    if (typeof input === "string") {
        return "string";
    }
    if (input instanceof Array) {
        return "array";
    }
    if (support.nodebuffer && Buffer.isBuffer(input)) {
        return "nodebuffer";
    }
    if (support.uint8array && input instanceof Uint8Array) {
        return "uint8array";
    }
    if (support.arraybuffer && input instanceof ArrayBuffer) {
        return "arraybuffer";
    }
};

/**
 * Throw an exception if the type is not supported.
 * @param {String} type the type to check.
 * @throws {Error} an Error if the browser doesn't support the requested type.
 */
exports.checkSupport = function(type) {
    var supported = support[type.toLowerCase()];
    if (!supported) {
        throw new Error(type + " is not supported by this browser");
    }
};
exports.MAX_VALUE_16BITS = 65535;
exports.MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

/**
 * Prettify a string read as binary.
 * @param {string} str the string to prettify.
 * @return {string} a pretty string.
 */
exports.pretty = function(str) {
    var res = '',
        code, i;
    for (i = 0; i < (str || "").length; i++) {
        code = str.charCodeAt(i);
        res += '\\x' + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
    }
    return res;
};

/**
 * Find a compression registered in JSZip.
 * @param {string} compressionMethod the method magic to find.
 * @return {Object|null} the JSZip compression object, null if none found.
 */
exports.findCompression = function(compressionMethod) {
    for (var method in compressions) {
        if (!compressions.hasOwnProperty(method)) {
            continue;
        }
        if (compressions[method].magic === compressionMethod) {
            return compressions[method];
        }
    }
    return null;
};

});
require.register("calvinmetcalf-jszip/lib/zipEntries.js", function(exports, require, module){
var StringReader = require('./stringReader');
var NodeBufferReader = require('./nodeBufferReader');
var Uint8ArrayReader = require('./uint8ArrayReader');
var utils = require('./utils');
var sig = require('./signature');
var ZipEntry = require('./zipEntry');
var support = require('./support');
//  class ZipEntries {{{
/**
 * All the entries in the zip file.
 * @constructor
 * @param {String|ArrayBuffer|Uint8Array} data the binary stream to load.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntries(data, loadOptions) {
    this.files = [];
    this.loadOptions = loadOptions;
    if (data) {
        this.load(data);
    }
}
ZipEntries.prototype = {
    /**
     * Check that the reader is on the speficied signature.
     * @param {string} expectedSignature the expected signature.
     * @throws {Error} if it is an other signature.
     */
    checkSignature: function(expectedSignature) {
        var signature = this.reader.readString(4);
        if (signature !== expectedSignature) {
            throw new Error("Corrupted zip or bug : unexpected signature " + "(" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
        }
    },
    /**
     * Read the end of the central directory.
     */
    readBlockEndOfCentral: function() {
        this.diskNumber = this.reader.readInt(2);
        this.diskWithCentralDirStart = this.reader.readInt(2);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
        this.centralDirRecords = this.reader.readInt(2);
        this.centralDirSize = this.reader.readInt(4);
        this.centralDirOffset = this.reader.readInt(4);

        this.zipCommentLength = this.reader.readInt(2);
        this.zipComment = this.reader.readString(this.zipCommentLength);
    },
    /**
     * Read the end of the Zip 64 central directory.
     * Not merged with the method readEndOfCentral :
     * The end of central can coexist with its Zip64 brother,
     * I don't want to read the wrong number of bytes !
     */
    readBlockZip64EndOfCentral: function() {
        this.zip64EndOfCentralSize = this.reader.readInt(8);
        this.versionMadeBy = this.reader.readString(2);
        this.versionNeeded = this.reader.readInt(2);
        this.diskNumber = this.reader.readInt(4);
        this.diskWithCentralDirStart = this.reader.readInt(4);
        this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
        this.centralDirRecords = this.reader.readInt(8);
        this.centralDirSize = this.reader.readInt(8);
        this.centralDirOffset = this.reader.readInt(8);

        this.zip64ExtensibleData = {};
        var extraDataSize = this.zip64EndOfCentralSize - 44,
            index = 0,
            extraFieldId,
            extraFieldLength,
            extraFieldValue;
        while (index < extraDataSize) {
            extraFieldId = this.reader.readInt(2);
            extraFieldLength = this.reader.readInt(4);
            extraFieldValue = this.reader.readString(extraFieldLength);
            this.zip64ExtensibleData[extraFieldId] = {
                id: extraFieldId,
                length: extraFieldLength,
                value: extraFieldValue
            };
        }
    },
    /**
     * Read the end of the Zip 64 central directory locator.
     */
    readBlockZip64EndOfCentralLocator: function() {
        this.diskWithZip64CentralDirStart = this.reader.readInt(4);
        this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
        this.disksCount = this.reader.readInt(4);
        if (this.disksCount > 1) {
            throw new Error("Multi-volumes zip are not supported");
        }
    },
    /**
     * Read the local files, based on the offset read in the central part.
     */
    readLocalFiles: function() {
        var i, file;
        for (i = 0; i < this.files.length; i++) {
            file = this.files[i];
            this.reader.setIndex(file.localHeaderOffset);
            this.checkSignature(sig.LOCAL_FILE_HEADER);
            file.readLocalPart(this.reader);
            file.handleUTF8();
        }
    },
    /**
     * Read the central directory.
     */
    readCentralDir: function() {
        var file;

        this.reader.setIndex(this.centralDirOffset);
        while (this.reader.readString(4) === sig.CENTRAL_FILE_HEADER) {
            file = new ZipEntry({
                zip64: this.zip64
            }, this.loadOptions);
            file.readCentralPart(this.reader);
            this.files.push(file);
        }
    },
    /**
     * Read the end of central directory.
     */
    readEndOfCentral: function() {
        var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
        if (offset === -1) {
            throw new Error("Corrupted zip : can't find end of central directory");
        }
        this.reader.setIndex(offset);
        this.checkSignature(sig.CENTRAL_DIRECTORY_END);
        this.readBlockEndOfCentral();


        /* extract from the zip spec :
            4)  If one of the fields in the end of central directory
                record is too small to hold required data, the field
                should be set to -1 (0xFFFF or 0xFFFFFFFF) and the
                ZIP64 format record should be created.
            5)  The end of central directory record and the
                Zip64 end of central directory locator record must
                reside on the same disk when splitting or spanning
                an archive.
         */
        if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
            this.zip64 = true;

            /*
            Warning : the zip64 extension is supported, but ONLY if the 64bits integer read from
            the zip file can fit into a 32bits integer. This cannot be solved : Javascript represents
            all numbers as 64-bit double precision IEEE 754 floating point numbers.
            So, we have 53bits for integers and bitwise operations treat everything as 32bits.
            see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
            and http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf section 8.5
            */

            // should look for a zip64 EOCD locator
            offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            if (offset === -1) {
                throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
            }
            this.reader.setIndex(offset);
            this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            this.readBlockZip64EndOfCentralLocator();

            // now the zip64 EOCD record
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
            this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
            this.readBlockZip64EndOfCentral();
        }
    },
    prepareReader: function(data) {
        var type = utils.getTypeOf(data);
        if (type === "string" && !support.uint8array) {
            this.reader = new StringReader(data, this.loadOptions.optimizedBinaryString);
        }
        else if (type === "nodebuffer") {
            this.reader = new NodeBufferReader(data);
        }
        else {
            this.reader = new Uint8ArrayReader(utils.transformTo("uint8array", data));
        }
    },
    /**
     * Read a zip file and create ZipEntries.
     * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
     */
    load: function(data) {
        this.prepareReader(data);
        this.readEndOfCentral();
        this.readCentralDir();
        this.readLocalFiles();
    }
};
// }}} end of ZipEntries
module.exports = ZipEntries;
});
require.register("calvinmetcalf-jszip/lib/zipEntry.js", function(exports, require, module){
var StringReader = require('./stringReader');
var utils = require('./utils');
var CompressedObject = require('./compressedObject');
var jszipProto = require('./object');
// class ZipEntry {{{
/**
 * An entry in the zip file.
 * @constructor
 * @param {Object} options Options of the current file.
 * @param {Object} loadOptions Options for loading the stream.
 */
function ZipEntry(options, loadOptions) {
    this.options = options;
    this.loadOptions = loadOptions;
}
ZipEntry.prototype = {
    /**
     * say if the file is encrypted.
     * @return {boolean} true if the file is encrypted, false otherwise.
     */
    isEncrypted: function() {
        // bit 1 is set
        return (this.bitFlag & 0x0001) === 0x0001;
    },
    /**
     * say if the file has utf-8 filename/comment.
     * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
     */
    useUTF8: function() {
        // bit 11 is set
        return (this.bitFlag & 0x0800) === 0x0800;
    },
    /**
     * Prepare the function used to generate the compressed content from this ZipFile.
     * @param {DataReader} reader the reader to use.
     * @param {number} from the offset from where we should read the data.
     * @param {number} length the length of the data to read.
     * @return {Function} the callback to get the compressed content (the type depends of the DataReader class).
     */
    prepareCompressedContent: function(reader, from, length) {
        return function() {
            var previousIndex = reader.index;
            reader.setIndex(from);
            var compressedFileData = reader.readData(length);
            reader.setIndex(previousIndex);

            return compressedFileData;
        }
    },
    /**
     * Prepare the function used to generate the uncompressed content from this ZipFile.
     * @param {DataReader} reader the reader to use.
     * @param {number} from the offset from where we should read the data.
     * @param {number} length the length of the data to read.
     * @param {JSZip.compression} compression the compression used on this file.
     * @param {number} uncompressedSize the uncompressed size to expect.
     * @return {Function} the callback to get the uncompressed content (the type depends of the DataReader class).
     */
    prepareContent: function(reader, from, length, compression, uncompressedSize) {
        return function() {

            var compressedFileData = utils.transformTo(compression.uncompressInputType, this.getCompressedContent());
            var uncompressedFileData = compression.uncompress(compressedFileData);

            if (uncompressedFileData.length !== uncompressedSize) {
                throw new Error("Bug : uncompressed data size mismatch");
            }

            return uncompressedFileData;
        }
    },
    /**
     * Read the local part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readLocalPart: function(reader) {
        var compression, localExtraFieldsLength;

        // we already know everything from the central dir !
        // If the central dir data are false, we are doomed.
        // On the bright side, the local part is scary  : zip64, data descriptors, both, etc.
        // The less data we get here, the more reliable this should be.
        // Let's skip the whole header and dash to the data !
        reader.skip(22);
        // in some zip created on windows, the filename stored in the central dir contains \ instead of /.
        // Strangely, the filename here is OK.
        // I would love to treat these zip files as corrupted (see http://www.info-zip.org/FAQ.html#backslashes
        // or APPNOTE#4.4.17.1, "All slashes MUST be forward slashes '/'") but there are a lot of bad zip generators...
        // Search "unzip mismatching "local" filename continuing with "central" filename version" on
        // the internet.
        //
        // I think I see the logic here : the central directory is used to display
        // content and the local directory is used to extract the files. Mixing / and \
        // may be used to display \ to windows users and use / when extracting the files.
        // Unfortunately, this lead also to some issues : http://seclists.org/fulldisclosure/2009/Sep/394
        this.fileNameLength = reader.readInt(2);
        localExtraFieldsLength = reader.readInt(2); // can't be sure this will be the same as the central dir
        this.fileName = reader.readString(this.fileNameLength);
        reader.skip(localExtraFieldsLength);

        if (this.compressedSize == -1 || this.uncompressedSize == -1) {
            throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory " + "(compressedSize == -1 || uncompressedSize == -1)");
        }

        compression = utils.findCompression(this.compressionMethod);
        if (compression === null) { // no compression found
            throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + this.fileName + ")");
        }
        this.decompressed = new CompressedObject();
        this.decompressed.compressedSize = this.compressedSize;
        this.decompressed.uncompressedSize = this.uncompressedSize;
        this.decompressed.crc32 = this.crc32;
        this.decompressed.compressionMethod = this.compressionMethod;
        this.decompressed.getCompressedContent = this.prepareCompressedContent(reader, reader.index, this.compressedSize, compression);
        this.decompressed.getContent = this.prepareContent(reader, reader.index, this.compressedSize, compression, this.uncompressedSize);

        // we need to compute the crc32...
        if (this.loadOptions.checkCRC32) {
            this.decompressed = utils.transformTo("string", this.decompressed.getContent());
            if (jszipProto.crc32(this.decompressed) !== this.crc32) {
                throw new Error("Corrupted zip : CRC32 mismatch");
            }
        }
    },

    /**
     * Read the central part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readCentralPart: function(reader) {
        this.versionMadeBy = reader.readString(2);
        this.versionNeeded = reader.readInt(2);
        this.bitFlag = reader.readInt(2);
        this.compressionMethod = reader.readString(2);
        this.date = reader.readDate();
        this.crc32 = reader.readInt(4);
        this.compressedSize = reader.readInt(4);
        this.uncompressedSize = reader.readInt(4);
        this.fileNameLength = reader.readInt(2);
        this.extraFieldsLength = reader.readInt(2);
        this.fileCommentLength = reader.readInt(2);
        this.diskNumberStart = reader.readInt(2);
        this.internalFileAttributes = reader.readInt(2);
        this.externalFileAttributes = reader.readInt(4);
        this.localHeaderOffset = reader.readInt(4);

        if (this.isEncrypted()) {
            throw new Error("Encrypted zip are not supported");
        }

        this.fileName = reader.readString(this.fileNameLength);
        this.readExtraFields(reader);
        this.parseZIP64ExtraField(reader);
        this.fileComment = reader.readString(this.fileCommentLength);

        // warning, this is true only for zip with madeBy == DOS (plateform dependent feature)
        this.dir = this.externalFileAttributes & 0x00000010 ? true : false;
    },
    /**
     * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
     * @param {DataReader} reader the reader to use.
     */
    parseZIP64ExtraField: function(reader) {

        if (!this.extraFields[0x0001]) {
            return;
        }

        // should be something, preparing the extra reader
        var extraReader = new StringReader(this.extraFields[0x0001].value);

        // I really hope that these 64bits integer can fit in 32 bits integer, because js
        // won't let us have more.
        if (this.uncompressedSize === utils.MAX_VALUE_32BITS) {
            this.uncompressedSize = extraReader.readInt(8);
        }
        if (this.compressedSize === utils.MAX_VALUE_32BITS) {
            this.compressedSize = extraReader.readInt(8);
        }
        if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) {
            this.localHeaderOffset = extraReader.readInt(8);
        }
        if (this.diskNumberStart === utils.MAX_VALUE_32BITS) {
            this.diskNumberStart = extraReader.readInt(4);
        }
    },
    /**
     * Read the central part of a zip file and add the info in this object.
     * @param {DataReader} reader the reader to use.
     */
    readExtraFields: function(reader) {
        var start = reader.index,
            extraFieldId,
            extraFieldLength,
            extraFieldValue;

        this.extraFields = this.extraFields || {};

        while (reader.index < start + this.extraFieldsLength) {
            extraFieldId = reader.readInt(2);
            extraFieldLength = reader.readInt(2);
            extraFieldValue = reader.readString(extraFieldLength);

            this.extraFields[extraFieldId] = {
                id: extraFieldId,
                length: extraFieldLength,
                value: extraFieldValue
            };
        }
    },
    /**
     * Apply an UTF8 transformation if needed.
     */
    handleUTF8: function() {
        if (this.useUTF8()) {
            this.fileName = jszipProto.utf8decode(this.fileName);
            this.fileComment = jszipProto.utf8decode(this.fileComment);
        }
    }
};
module.exports = ZipEntry;

});
require.register("calvinmetcalf-jszip/lib/flate/index.js", function(exports, require, module){
var USE_TYPEDARRAY = (typeof Uint8Array !== 'undefined') && (typeof Uint16Array !== 'undefined') && (typeof Uint32Array !== 'undefined');
exports.magic = "\x08\x00";
exports.uncompress = require('./inflate');
exports.uncompressInputType = USE_TYPEDARRAY ? "uint8array" : "array";
exports.compress = require('./deflate');
exports.compressInputType = USE_TYPEDARRAY ? "uint8array" : "array";

});
require.register("calvinmetcalf-jszip/lib/flate/deflate.js", function(exports, require, module){
var context = {};
(function() {

    // https://github.com/imaya/zlib.js
    // tag 0.1.6
    // file bin/deflate.min.js

    /** @license zlib.js 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */
    (function() {
        'use strict';
        var n = void 0,
            u = !0,
            aa = this;

        function ba(e, d) {
            var c = e.split("."),
                f = aa;
            !(c[0] in f) && f.execScript && f.execScript("var " + c[0]);
            for (var a; c.length && (a = c.shift());)!c.length && d !== n ? f[a] = d : f = f[a] ? f[a] : f[a] = {}
        };
        var C = "undefined" !== typeof Uint8Array && "undefined" !== typeof Uint16Array && "undefined" !== typeof Uint32Array;

        function K(e, d) {
            this.index = "number" === typeof d ? d : 0;
            this.d = 0;
            this.buffer = e instanceof(C ? Uint8Array : Array) ? e : new(C ? Uint8Array : Array)(32768);
            if (2 * this.buffer.length <= this.index) throw Error("invalid index");
            this.buffer.length <= this.index && ca(this)
        }
        function ca(e) {
            var d = e.buffer,
                c, f = d.length,
                a = new(C ? Uint8Array : Array)(f << 1);
            if (C) a.set(d);
            else for (c = 0; c < f; ++c) a[c] = d[c];
            return e.buffer = a
        }
        K.prototype.a = function(e, d, c) {
            var f = this.buffer,
                a = this.index,
                b = this.d,
                k = f[a],
                m;
            c && 1 < d && (e = 8 < d ? (L[e & 255] << 24 | L[e >>> 8 & 255] << 16 | L[e >>> 16 & 255] << 8 | L[e >>> 24 & 255]) >> 32 - d : L[e] >> 8 - d);
            if (8 > d + b) k = k << d | e, b += d;
            else for (m = 0; m < d; ++m) k = k << 1 | e >> d - m - 1 & 1, 8 === ++b && (b = 0, f[a++] = L[k], k = 0, a === f.length && (f = ca(this)));
            f[a] = k;
            this.buffer = f;
            this.d = b;
            this.index = a
        };
        K.prototype.finish = function() {
            var e = this.buffer,
                d = this.index,
                c;
            0 < this.d && (e[d] <<= 8 - this.d, e[d] = L[e[d]], d++);
            C ? c = e.subarray(0, d) : (e.length = d, c = e);
            return c
        };
        var ga = new(C ? Uint8Array : Array)(256),
            M;
        for (M = 0; 256 > M; ++M) {
            for (var R = M, S = R, ha = 7, R = R >>> 1; R; R >>>= 1) S <<= 1, S |= R & 1, --ha;
            ga[M] = (S << ha & 255) >>> 0
        }
        var L = ga;

        function ja(e) {
            this.buffer = new(C ? Uint16Array : Array)(2 * e);
            this.length = 0
        }
        ja.prototype.getParent = function(e) {
            return 2 * ((e - 2) / 4 | 0)
        };
        ja.prototype.push = function(e, d) {
            var c, f, a = this.buffer,
                b;
            c = this.length;
            a[this.length++] = d;
            for (a[this.length++] = e; 0 < c;) if (f = this.getParent(c), a[c] > a[f]) b = a[c], a[c] = a[f], a[f] = b, b = a[c + 1], a[c + 1] = a[f + 1], a[f + 1] = b, c = f;
            else break;
            return this.length
        };
        ja.prototype.pop = function() {
            var e, d, c = this.buffer,
                f, a, b;
            d = c[0];
            e = c[1];
            this.length -= 2;
            c[0] = c[this.length];
            c[1] = c[this.length + 1];
            for (b = 0;;) {
                a = 2 * b + 2;
                if (a >= this.length) break;
                a + 2 < this.length && c[a + 2] > c[a] && (a += 2);
                if (c[a] > c[b]) f = c[b], c[b] = c[a], c[a] = f, f = c[b + 1], c[b + 1] = c[a + 1], c[a + 1] = f;
                else break;
                b = a
            }
            return {
                index: e,
                value: d,
                length: this.length
            }
        };

        function ka(e, d) {
            this.e = ma;
            this.f = 0;
            this.input = C && e instanceof Array ? new Uint8Array(e) : e;
            this.c = 0;
            d && (d.lazy && (this.f = d.lazy), "number" === typeof d.compressionType && (this.e = d.compressionType), d.outputBuffer && (this.b = C && d.outputBuffer instanceof Array ? new Uint8Array(d.outputBuffer) : d.outputBuffer), "number" === typeof d.outputIndex && (this.c = d.outputIndex));
            this.b || (this.b = new(C ? Uint8Array : Array)(32768))
        }
        var ma = 2,
            T = [],
            U;
        for (U = 0; 288 > U; U++) switch (u) {
        case 143 >= U:
            T.push([U + 48, 8]);
            break;
        case 255 >= U:
            T.push([U - 144 + 400, 9]);
            break;
        case 279 >= U:
            T.push([U - 256 + 0, 7]);
            break;
        case 287 >= U:
            T.push([U - 280 + 192, 8]);
            break;
        default:
            throw "invalid literal: " + U;
        }
        ka.prototype.h = function() {
            var e, d, c, f, a = this.input;
            switch (this.e) {
            case 0:
                c = 0;
                for (f = a.length; c < f;) {
                    d = C ? a.subarray(c, c + 65535) : a.slice(c, c + 65535);
                    c += d.length;
                    var b = d,
                        k = c === f,
                        m = n,
                        g = n,
                        p = n,
                        v = n,
                        x = n,
                        l = this.b,
                        h = this.c;
                    if (C) {
                        for (l = new Uint8Array(this.b.buffer); l.length <= h + b.length + 5;) l = new Uint8Array(l.length << 1);
                        l.set(this.b)
                    }
                    m = k ? 1 : 0;
                    l[h++] = m | 0;
                    g = b.length;
                    p = ~g + 65536 & 65535;
                    l[h++] = g & 255;
                    l[h++] = g >>> 8 & 255;
                    l[h++] = p & 255;
                    l[h++] = p >>> 8 & 255;
                    if (C) l.set(b, h), h += b.length, l = l.subarray(0, h);
                    else {
                        v = 0;
                        for (x = b.length; v < x; ++v) l[h++] = b[v];
                        l.length = h
                    }
                    this.c = h;
                    this.b = l
                }
                break;
            case 1:
                var q = new K(C ? new Uint8Array(this.b.buffer) : this.b, this.c);
                q.a(1, 1, u);
                q.a(1, 2, u);
                var t = na(this, a),
                    w, da, z;
                w = 0;
                for (da = t.length; w < da; w++) if (z = t[w], K.prototype.a.apply(q, T[z]), 256 < z) q.a(t[++w], t[++w], u), q.a(t[++w], 5), q.a(t[++w], t[++w], u);
                else if (256 === z) break;
                this.b = q.finish();
                this.c = this.b.length;
                break;
            case ma:
                var B = new K(C ? new Uint8Array(this.b.buffer) : this.b, this.c),
                    ra, J, N, O, P, Ia = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
                    W, sa, X, ta, ea, ia = Array(19),
                    ua, Q, fa, y, va;
                ra = ma;
                B.a(1, 1, u);
                B.a(ra, 2, u);
                J = na(this, a);
                W = oa(this.j, 15);
                sa = pa(W);
                X = oa(this.i, 7);
                ta = pa(X);
                for (N = 286; 257 < N && 0 === W[N - 1]; N--);
                for (O = 30; 1 < O && 0 === X[O - 1]; O--);
                var wa = N,
                    xa = O,
                    F = new(C ? Uint32Array : Array)(wa + xa),
                    r, G, s, Y, E = new(C ? Uint32Array : Array)(316),
                    D, A, H = new(C ? Uint8Array : Array)(19);
                for (r = G = 0; r < wa; r++) F[G++] = W[r];
                for (r = 0; r < xa; r++) F[G++] = X[r];
                if (!C) {
                    r = 0;
                    for (Y = H.length; r < Y; ++r) H[r] = 0
                }
                r = D = 0;
                for (Y = F.length; r < Y; r += G) {
                    for (G = 1; r + G < Y && F[r + G] === F[r]; ++G);
                    s = G;
                    if (0 === F[r]) if (3 > s) for (; 0 < s--;) E[D++] = 0,
                    H[0]++;
                    else for (; 0 < s;) A = 138 > s ? s : 138, A > s - 3 && A < s && (A = s - 3), 10 >= A ? (E[D++] = 17, E[D++] = A - 3, H[17]++) : (E[D++] = 18, E[D++] = A - 11, H[18]++), s -= A;
                    else if (E[D++] = F[r], H[F[r]]++, s--, 3 > s) for (; 0 < s--;) E[D++] = F[r], H[F[r]]++;
                    else for (; 0 < s;) A = 6 > s ? s : 6, A > s - 3 && A < s && (A = s - 3), E[D++] = 16, E[D++] = A - 3, H[16]++, s -= A
                }
                e = C ? E.subarray(0, D) : E.slice(0, D);
                ea = oa(H, 7);
                for (y = 0; 19 > y; y++) ia[y] = ea[Ia[y]];
                for (P = 19; 4 < P && 0 === ia[P - 1]; P--);
                ua = pa(ea);
                B.a(N - 257, 5, u);
                B.a(O - 1, 5, u);
                B.a(P - 4, 4, u);
                for (y = 0; y < P; y++) B.a(ia[y], 3, u);
                y = 0;
                for (va = e.length; y < va; y++) if (Q = e[y], B.a(ua[Q], ea[Q], u), 16 <= Q) {
                    y++;
                    switch (Q) {
                    case 16:
                        fa = 2;
                        break;
                    case 17:
                        fa = 3;
                        break;
                    case 18:
                        fa = 7;
                        break;
                    default:
                        throw "invalid code: " + Q;
                    }
                    B.a(e[y], fa, u)
                }
                var ya = [sa, W],
                    za = [ta, X],
                    I, Aa, Z, la, Ba, Ca, Da, Ea;
                Ba = ya[0];
                Ca = ya[1];
                Da = za[0];
                Ea = za[1];
                I = 0;
                for (Aa = J.length; I < Aa; ++I) if (Z = J[I], B.a(Ba[Z], Ca[Z], u), 256 < Z) B.a(J[++I], J[++I], u), la = J[++I], B.a(Da[la], Ea[la], u), B.a(J[++I], J[++I], u);
                else if (256 === Z) break;
                this.b = B.finish();
                this.c = this.b.length;
                break;
            default:
                throw "invalid compression type";
            }
            return this.b
        };

        function qa(e, d) {
            this.length = e;
            this.g = d
        }
        var Fa = function() {
            function e(a) {
                switch (u) {
                case 3 === a:
                    return [257, a - 3, 0];
                case 4 === a:
                    return [258, a - 4, 0];
                case 5 === a:
                    return [259, a - 5, 0];
                case 6 === a:
                    return [260, a - 6, 0];
                case 7 === a:
                    return [261, a - 7, 0];
                case 8 === a:
                    return [262, a - 8, 0];
                case 9 === a:
                    return [263, a - 9, 0];
                case 10 === a:
                    return [264, a - 10, 0];
                case 12 >= a:
                    return [265, a - 11, 1];
                case 14 >= a:
                    return [266, a - 13, 1];
                case 16 >= a:
                    return [267, a - 15, 1];
                case 18 >= a:
                    return [268, a - 17, 1];
                case 22 >= a:
                    return [269, a - 19, 2];
                case 26 >= a:
                    return [270, a - 23, 2];
                case 30 >= a:
                    return [271, a - 27, 2];
                case 34 >= a:
                    return [272,
                    a - 31, 2];
                case 42 >= a:
                    return [273, a - 35, 3];
                case 50 >= a:
                    return [274, a - 43, 3];
                case 58 >= a:
                    return [275, a - 51, 3];
                case 66 >= a:
                    return [276, a - 59, 3];
                case 82 >= a:
                    return [277, a - 67, 4];
                case 98 >= a:
                    return [278, a - 83, 4];
                case 114 >= a:
                    return [279, a - 99, 4];
                case 130 >= a:
                    return [280, a - 115, 4];
                case 162 >= a:
                    return [281, a - 131, 5];
                case 194 >= a:
                    return [282, a - 163, 5];
                case 226 >= a:
                    return [283, a - 195, 5];
                case 257 >= a:
                    return [284, a - 227, 5];
                case 258 === a:
                    return [285, a - 258, 0];
                default:
                    throw "invalid length: " + a;
                }
            }
            var d = [],
                c, f;
            for (c = 3; 258 >= c; c++) f = e(c), d[c] = f[2] << 24 | f[1] << 16 | f[0];
            return d
        }(),
            Ga = C ? new Uint32Array(Fa) : Fa;

        function na(e, d) {
            function c(a, c) {
                var b = a.g,
                    d = [],
                    f = 0,
                    e;
                e = Ga[a.length];
                d[f++] = e & 65535;
                d[f++] = e >> 16 & 255;
                d[f++] = e >> 24;
                var g;
                switch (u) {
                case 1 === b:
                    g = [0, b - 1, 0];
                    break;
                case 2 === b:
                    g = [1, b - 2, 0];
                    break;
                case 3 === b:
                    g = [2, b - 3, 0];
                    break;
                case 4 === b:
                    g = [3, b - 4, 0];
                    break;
                case 6 >= b:
                    g = [4, b - 5, 1];
                    break;
                case 8 >= b:
                    g = [5, b - 7, 1];
                    break;
                case 12 >= b:
                    g = [6, b - 9, 2];
                    break;
                case 16 >= b:
                    g = [7, b - 13, 2];
                    break;
                case 24 >= b:
                    g = [8, b - 17, 3];
                    break;
                case 32 >= b:
                    g = [9, b - 25, 3];
                    break;
                case 48 >= b:
                    g = [10, b - 33, 4];
                    break;
                case 64 >= b:
                    g = [11, b - 49, 4];
                    break;
                case 96 >= b:
                    g = [12, b - 65, 5];
                    break;
                case 128 >= b:
                    g = [13, b - 97, 5];
                    break;
                case 192 >= b:
                    g = [14, b - 129, 6];
                    break;
                case 256 >= b:
                    g = [15, b - 193, 6];
                    break;
                case 384 >= b:
                    g = [16, b - 257, 7];
                    break;
                case 512 >= b:
                    g = [17, b - 385, 7];
                    break;
                case 768 >= b:
                    g = [18, b - 513, 8];
                    break;
                case 1024 >= b:
                    g = [19, b - 769, 8];
                    break;
                case 1536 >= b:
                    g = [20, b - 1025, 9];
                    break;
                case 2048 >= b:
                    g = [21, b - 1537, 9];
                    break;
                case 3072 >= b:
                    g = [22, b - 2049, 10];
                    break;
                case 4096 >= b:
                    g = [23, b - 3073, 10];
                    break;
                case 6144 >= b:
                    g = [24, b - 4097, 11];
                    break;
                case 8192 >= b:
                    g = [25, b - 6145, 11];
                    break;
                case 12288 >= b:
                    g = [26, b - 8193, 12];
                    break;
                case 16384 >= b:
                    g = [27, b - 12289, 12];
                    break;
                case 24576 >= b:
                    g = [28, b - 16385, 13];
                    break;
                case 32768 >= b:
                    g = [29, b - 24577, 13];
                    break;
                default:
                    throw "invalid distance";
                }
                e = g;
                d[f++] = e[0];
                d[f++] = e[1];
                d[f++] = e[2];
                var k, m;
                k = 0;
                for (m = d.length; k < m; ++k) l[h++] = d[k];
                t[d[0]]++;
                w[d[3]]++;
                q = a.length + c - 1;
                x = null
            }
            var f, a, b, k, m, g = {}, p, v, x, l = C ? new Uint16Array(2 * d.length) : [],
                h = 0,
                q = 0,
                t = new(C ? Uint32Array : Array)(286),
                w = new(C ? Uint32Array : Array)(30),
                da = e.f,
                z;
            if (!C) {
                for (b = 0; 285 >= b;) t[b++] = 0;
                for (b = 0; 29 >= b;) w[b++] = 0
            }
            t[256] = 1;
            f = 0;
            for (a = d.length; f < a; ++f) {
                b = m = 0;
                for (k = 3; b < k && f + b !== a; ++b) m = m << 8 | d[f + b];
                g[m] === n && (g[m] = []);
                p = g[m];
                if (!(0 < q--)) {
                    for (; 0 < p.length && 32768 < f - p[0];) p.shift();
                    if (f + 3 >= a) {
                        x && c(x, - 1);
                        b = 0;
                        for (k = a - f; b < k; ++b) z = d[f + b], l[h++] = z, ++t[z];
                        break
                    }
                    0 < p.length ? (v = Ha(d, f, p), x ? x.length < v.length ? (z = d[f - 1], l[h++] = z, ++t[z], c(v, 0)) : c(x, - 1) : v.length < da ? x = v : c(v, 0)) : x ? c(x, - 1) : (z = d[f], l[h++] = z, ++t[z])
                }
                p.push(f)
            }
            l[h++] = 256;
            t[256]++;
            e.j = t;
            e.i = w;
            return C ? l.subarray(0, h) : l
        }

        function Ha(e, d, c) {
            var f, a, b = 0,
                k, m, g, p, v = e.length;
            m = 0;
            p = c.length;
            a: for (; m < p; m++) {
                f = c[p - m - 1];
                k = 3;
                if (3 < b) {
                    for (g = b; 3 < g; g--) if (e[f + g - 1] !== e[d + g - 1]) continue a;
                    k = b
                }
                for (; 258 > k && d + k < v && e[f + k] === e[d + k];)++k;
                k > b && (a = f, b = k);
                if (258 === k) break
            }
            return new qa(b, d - a)
        }

        function oa(e, d) {
            var c = e.length,
                f = new ja(572),
                a = new(C ? Uint8Array : Array)(c),
                b, k, m, g, p;
            if (!C) for (g = 0; g < c; g++) a[g] = 0;
            for (g = 0; g < c; ++g) 0 < e[g] && f.push(g, e[g]);
            b = Array(f.length / 2);
            k = new(C ? Uint32Array : Array)(f.length / 2);
            if (1 === b.length) return a[f.pop().index] = 1, a;
            g = 0;
            for (p = f.length / 2; g < p; ++g) b[g] = f.pop(), k[g] = b[g].value;
            m = Ja(k, k.length, d);
            g = 0;
            for (p = b.length; g < p; ++g) a[b[g].index] = m[g];
            return a
        }

        function Ja(e, d, c) {
            function f(a) {
                var b = g[a][p[a]];
                b === d ? (f(a + 1), f(a + 1)) : --k[b];
                ++p[a]
            }
            var a = new(C ? Uint16Array : Array)(c),
                b = new(C ? Uint8Array : Array)(c),
                k = new(C ? Uint8Array : Array)(d),
                m = Array(c),
                g = Array(c),
                p = Array(c),
                v = (1 << c) - d,
                x = 1 << c - 1,
                l, h, q, t, w;
            a[c - 1] = d;
            for (h = 0; h < c; ++h) v < x ? b[h] = 0 : (b[h] = 1, v -= x), v <<= 1, a[c - 2 - h] = (a[c - 1 - h] / 2 | 0) + d;
            a[0] = b[0];
            m[0] = Array(a[0]);
            g[0] = Array(a[0]);
            for (h = 1; h < c; ++h) a[h] > 2 * a[h - 1] + b[h] && (a[h] = 2 * a[h - 1] + b[h]), m[h] = Array(a[h]), g[h] = Array(a[h]);
            for (l = 0; l < d; ++l) k[l] = c;
            for (q = 0; q < a[c - 1]; ++q) m[c - 1][q] = e[q], g[c - 1][q] = q;
            for (l = 0; l < c; ++l) p[l] = 0;
            1 === b[c - 1] && (--k[0], ++p[c - 1]);
            for (h = c - 2; 0 <= h; --h) {
                t = l = 0;
                w = p[h + 1];
                for (q = 0; q < a[h]; q++) t = m[h + 1][w] + m[h + 1][w + 1], t > e[l] ? (m[h][q] = t, g[h][q] = d, w += 2) : (m[h][q] = e[l], g[h][q] = l, ++l);
                p[h] = 0;
                1 === b[h] && f(h)
            }
            return k
        }

        function pa(e) {
            var d = new(C ? Uint16Array : Array)(e.length),
                c = [],
                f = [],
                a = 0,
                b, k, m, g;
            b = 0;
            for (k = e.length; b < k; b++) c[e[b]] = (c[e[b]] | 0) + 1;
            b = 1;
            for (k = 16; b <= k; b++) f[b] = a, a += c[b] | 0, a <<= 1;
            b = 0;
            for (k = e.length; b < k; b++) {
                a = f[e[b]];
                f[e[b]] += 1;
                m = d[b] = 0;
                for (g = e[b]; m < g; m++) d[b] = d[b] << 1 | a & 1, a >>>= 1
            }
            return d
        };
        ba("Zlib.RawDeflate", ka);
        ba("Zlib.RawDeflate.prototype.compress", ka.prototype.h);
        var Ka = {
            NONE: 0,
            FIXED: 1,
            DYNAMIC: ma
        }, V, La, $, Ma;
        if (Object.keys) V = Object.keys(Ka);
        else for (La in V = [], $ = 0, Ka) V[$++] = La;
        $ = 0;
        for (Ma = V.length; $ < Ma; ++$) La = V[$], ba("Zlib.RawDeflate.CompressionType." + La, Ka[La]);
    }).call(this);


}).call(context);

module.exports = function(input) {
    var deflate = new context.Zlib.RawDeflate(input);
    return deflate.compress();
};

});
require.register("calvinmetcalf-jszip/lib/flate/inflate.js", function(exports, require, module){
var context = {};
(function() {

    // https://github.com/imaya/zlib.js
    // tag 0.1.6
    // file bin/deflate.min.js

    /** @license zlib.js 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */ (function() {
        'use strict';
        var l = void 0,
            p = this;

        function q(c, d) {
            var a = c.split("."),
                b = p;
            !(a[0] in b) && b.execScript && b.execScript("var " + a[0]);
            for (var e; a.length && (e = a.shift());)!a.length && d !== l ? b[e] = d : b = b[e] ? b[e] : b[e] = {}
        };
        var r = "undefined" !== typeof Uint8Array && "undefined" !== typeof Uint16Array && "undefined" !== typeof Uint32Array;

        function u(c) {
            var d = c.length,
                a = 0,
                b = Number.POSITIVE_INFINITY,
                e, f, g, h, k, m, s, n, t;
            for (n = 0; n < d; ++n) c[n] > a && (a = c[n]), c[n] < b && (b = c[n]);
            e = 1 << a;
            f = new(r ? Uint32Array : Array)(e);
            g = 1;
            h = 0;
            for (k = 2; g <= a;) {
                for (n = 0; n < d; ++n) if (c[n] === g) {
                    m = 0;
                    s = h;
                    for (t = 0; t < g; ++t) m = m << 1 | s & 1, s >>= 1;
                    for (t = m; t < e; t += k) f[t] = g << 16 | n;
                    ++h
                }++g;
                h <<= 1;
                k <<= 1
            }
            return [f, a, b]
        };

        function v(c, d) {
            this.g = [];
            this.h = 32768;
            this.c = this.f = this.d = this.k = 0;
            this.input = r ? new Uint8Array(c) : c;
            this.l = !1;
            this.i = w;
            this.p = !1;
            if (d || !(d = {})) d.index && (this.d = d.index), d.bufferSize && (this.h = d.bufferSize), d.bufferType && (this.i = d.bufferType), d.resize && (this.p = d.resize);
            switch (this.i) {
            case x:
                this.a = 32768;
                this.b = new(r ? Uint8Array : Array)(32768 + this.h + 258);
                break;
            case w:
                this.a = 0;
                this.b = new(r ? Uint8Array : Array)(this.h);
                this.e = this.u;
                this.m = this.r;
                this.j = this.s;
                break;
            default:
                throw Error("invalid inflate mode");
            }
        }
        var x = 0,
            w = 1;
        v.prototype.t = function() {
            for (; !this.l;) {
                var c = y(this, 3);
                c & 1 && (this.l = !0);
                c >>>= 1;
                switch (c) {
                case 0:
                    var d = this.input,
                        a = this.d,
                        b = this.b,
                        e = this.a,
                        f = l,
                        g = l,
                        h = l,
                        k = b.length,
                        m = l;
                    this.c = this.f = 0;
                    f = d[a++];
                    if (f === l) throw Error("invalid uncompressed block header: LEN (first byte)");
                    g = f;
                    f = d[a++];
                    if (f === l) throw Error("invalid uncompressed block header: LEN (second byte)");
                    g |= f << 8;
                    f = d[a++];
                    if (f === l) throw Error("invalid uncompressed block header: NLEN (first byte)");
                    h = f;
                    f = d[a++];
                    if (f === l) throw Error("invalid uncompressed block header: NLEN (second byte)");
                    h |= f << 8;
                    if (g === ~h) throw Error("invalid uncompressed block header: length verify");
                    if (a + g > d.length) throw Error("input buffer is broken");
                    switch (this.i) {
                    case x:
                        for (; e + g > b.length;) {
                            m = k - e;
                            g -= m;
                            if (r) b.set(d.subarray(a, a + m), e), e += m, a += m;
                            else for (; m--;) b[e++] = d[a++];
                            this.a = e;
                            b = this.e();
                            e = this.a
                        }
                        break;
                    case w:
                        for (; e + g > b.length;) b = this.e({
                            o: 2
                        });
                        break;
                    default:
                        throw Error("invalid inflate mode");
                    }
                    if (r) b.set(d.subarray(a, a + g), e), e += g, a += g;
                    else for (; g--;) b[e++] = d[a++];
                    this.d = a;
                    this.a = e;
                    this.b = b;
                    break;
                case 1:
                    this.j(z,
                    A);
                    break;
                case 2:
                    B(this);
                    break;
                default:
                    throw Error("unknown BTYPE: " + c);
                }
            }
            return this.m()
        };
        var C = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
            D = r ? new Uint16Array(C) : C,
            E = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 258, 258],
            F = r ? new Uint16Array(E) : E,
            G = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0],
            H = r ? new Uint8Array(G) : G,
            I = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577],
            J = r ? new Uint16Array(I) : I,
            K = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13,
            13],
            L = r ? new Uint8Array(K) : K,
            M = new(r ? Uint8Array : Array)(288),
            N, O;
        N = 0;
        for (O = M.length; N < O; ++N) M[N] = 143 >= N ? 8 : 255 >= N ? 9 : 279 >= N ? 7 : 8;
        var z = u(M),
            P = new(r ? Uint8Array : Array)(30),
            Q, R;
        Q = 0;
        for (R = P.length; Q < R; ++Q) P[Q] = 5;
        var A = u(P);

        function y(c, d) {
            for (var a = c.f, b = c.c, e = c.input, f = c.d, g; b < d;) {
                g = e[f++];
                if (g === l) throw Error("input buffer is broken");
                a |= g << b;
                b += 8
            }
            g = a & (1 << d) - 1;
            c.f = a >>> d;
            c.c = b - d;
            c.d = f;
            return g
        }

        function S(c, d) {
            for (var a = c.f, b = c.c, e = c.input, f = c.d, g = d[0], h = d[1], k, m, s; b < h;) {
                k = e[f++];
                if (k === l) break;
                a |= k << b;
                b += 8
            }
            m = g[a & (1 << h) - 1];
            s = m >>> 16;
            c.f = a >> s;
            c.c = b - s;
            c.d = f;
            return m & 65535
        }

        function B(c) {
            function d(a, c, b) {
                var d, f, e, g;
                for (g = 0; g < a;) switch (d = S(this, c), d) {
                case 16:
                    for (e = 3 + y(this, 2); e--;) b[g++] = f;
                    break;
                case 17:
                    for (e = 3 + y(this, 3); e--;) b[g++] = 0;
                    f = 0;
                    break;
                case 18:
                    for (e = 11 + y(this, 7); e--;) b[g++] = 0;
                    f = 0;
                    break;
                default:
                    f = b[g++] = d
                }
                return b
            }
            var a = y(c, 5) + 257,
                b = y(c, 5) + 1,
                e = y(c, 4) + 4,
                f = new(r ? Uint8Array : Array)(D.length),
                g, h, k, m;
            for (m = 0; m < e; ++m) f[D[m]] = y(c, 3);
            g = u(f);
            h = new(r ? Uint8Array : Array)(a);
            k = new(r ? Uint8Array : Array)(b);
            c.j(u(d.call(c, a, g, h)), u(d.call(c, b, g, k)))
        }
        v.prototype.j = function(c, d) {
            var a = this.b,
                b = this.a;
            this.n = c;
            for (var e = a.length - 258, f, g, h, k; 256 !== (f = S(this, c));) if (256 > f) b >= e && (this.a = b, a = this.e(), b = this.a), a[b++] = f;
            else {
                g = f - 257;
                k = F[g];
                0 < H[g] && (k += y(this, H[g]));
                f = S(this, d);
                h = J[f];
                0 < L[f] && (h += y(this, L[f]));
                b >= e && (this.a = b, a = this.e(), b = this.a);
                for (; k--;) a[b] = a[b++-h]
            }
            for (; 8 <= this.c;) this.c -= 8, this.d--;
            this.a = b
        };
        v.prototype.s = function(c, d) {
            var a = this.b,
                b = this.a;
            this.n = c;
            for (var e = a.length, f, g, h, k; 256 !== (f = S(this, c));) if (256 > f) b >= e && (a = this.e(), e = a.length), a[b++] = f;
            else {
                g = f - 257;
                k = F[g];
                0 < H[g] && (k += y(this, H[g]));
                f = S(this, d);
                h = J[f];
                0 < L[f] && (h += y(this, L[f]));
                b + k > e && (a = this.e(), e = a.length);
                for (; k--;) a[b] = a[b++-h]
            }
            for (; 8 <= this.c;) this.c -= 8, this.d--;
            this.a = b
        };
        v.prototype.e = function() {
            var c = new(r ? Uint8Array : Array)(this.a - 32768),
                d = this.a - 32768,
                a, b, e = this.b;
            if (r) c.set(e.subarray(32768, c.length));
            else {
                a = 0;
                for (b = c.length; a < b; ++a) c[a] = e[a + 32768]
            }
            this.g.push(c);
            this.k += c.length;
            if (r) e.set(e.subarray(d, d + 32768));
            else for (a = 0; 32768 > a; ++a) e[a] = e[d + a];
            this.a = 32768;
            return e
        };
        v.prototype.u = function(c) {
            var d, a = this.input.length / this.d + 1 | 0,
                b, e, f, g = this.input,
                h = this.b;
            c && ("number" === typeof c.o && (a = c.o), "number" === typeof c.q && (a += c.q));
            2 > a ? (b = (g.length - this.d) / this.n[2], f = 258 * (b / 2) | 0, e = f < h.length ? h.length + f : h.length << 1) : e = h.length * a;
            r ? (d = new Uint8Array(e), d.set(h)) : d = h;
            return this.b = d
        };
        v.prototype.m = function() {
            var c = 0,
                d = this.b,
                a = this.g,
                b, e = new(r ? Uint8Array : Array)(this.k + (this.a - 32768)),
                f, g, h, k;
            if (0 === a.length) return r ? this.b.subarray(32768, this.a) : this.b.slice(32768, this.a);
            f = 0;
            for (g = a.length; f < g; ++f) {
                b = a[f];
                h = 0;
                for (k = b.length; h < k; ++h) e[c++] = b[h]
            }
            f = 32768;
            for (g = this.a; f < g; ++f) e[c++] = d[f];
            this.g = [];
            return this.buffer = e
        };
        v.prototype.r = function() {
            var c, d = this.a;
            r ? this.p ? (c = new Uint8Array(d), c.set(this.b.subarray(0, d))) : c = this.b.subarray(0, d) : (this.b.length > d && (this.b.length = d), c = this.b);
            return this.buffer = c
        };
        q("Zlib.RawInflate", v);
        q("Zlib.RawInflate.prototype.decompress", v.prototype.t);
        var T = {
            ADAPTIVE: w,
            BLOCK: x
        }, U, V, W, X;
        if (Object.keys) U = Object.keys(T);
        else for (V in U = [], W = 0, T) U[W++] = V;
        W = 0;
        for (X = U.length; W < X; ++W) V = U[W], q("Zlib.RawInflate.BufferType." + V, T[V]);
    }).call(this);


}).call(context);

module.exports = function(input) {
    var inflate = new context.Zlib.RawInflate(new Uint8Array(input));
    return inflate.decompress();
};

});
require.register("proj4js-proj4js/dist/proj4.js", function(exports, require, module){
!function(t,s){"function"==typeof define&&define.amd?define(s):"undefined"!=typeof module?module.exports=s():t.proj4=s()}(this,function(){var t,s,i;return function(a){function h(t,s){return x.call(t,s)}function e(t,s){var i,a,h,e,n,r,o,l,u,p,c=s&&s.split("/"),m=y.map,M=m&&m["*"]||{};if(t&&"."===t.charAt(0))if(s){for(c=c.slice(0,c.length-1),t=c.concat(t.split("/")),l=0;l<t.length;l+=1)if(p=t[l],"."===p)t.splice(l,1),l-=1;else if(".."===p){if(1===l&&(".."===t[2]||".."===t[0]))break;l>0&&(t.splice(l-1,2),l-=2)}t=t.join("/")}else 0===t.indexOf("./")&&(t=t.substring(2));if((c||M)&&m){for(i=t.split("/"),l=i.length;l>0;l-=1){if(a=i.slice(0,l).join("/"),c)for(u=c.length;u>0;u-=1)if(h=m[c.slice(0,u).join("/")],h&&(h=h[a])){e=h,n=l;break}if(e)break;!r&&M&&M[a]&&(r=M[a],o=l)}!e&&r&&(e=r,n=o),e&&(i.splice(0,n,e),t=i.join("/"))}return t}function n(t,s){return function(){return m.apply(a,g.call(arguments,0).concat([t,s]))}}function r(t){return function(s){return e(s,t)}}function o(t){return function(s){d[t]=s}}function l(t){if(h(_,t)){var s=_[t];delete _[t],j[t]=!0,c.apply(a,s)}if(!h(d,t)&&!h(j,t))throw new Error("No "+t);return d[t]}function u(t){var s,i=t?t.indexOf("!"):-1;return i>-1&&(s=t.substring(0,i),t=t.substring(i+1,t.length)),[s,t]}function p(t){return function(){return y&&y.config&&y.config[t]||{}}}var c,m,M,f,d={},_={},y={},j={},x=Object.prototype.hasOwnProperty,g=[].slice;M=function(t,s){var i,a=u(t),h=a[0];return t=a[1],h&&(h=e(h,s),i=l(h)),h?t=i&&i.normalize?i.normalize(t,r(s)):e(t,s):(t=e(t,s),a=u(t),h=a[0],t=a[1],h&&(i=l(h))),{f:h?h+"!"+t:t,n:t,pr:h,p:i}},f={require:function(t){return n(t)},exports:function(t){var s=d[t];return"undefined"!=typeof s?s:d[t]={}},module:function(t){return{id:t,uri:"",exports:d[t],config:p(t)}}},c=function(t,s,i,e){var r,u,p,c,m,y,x=[];if(e=e||t,"function"==typeof i){for(s=!s.length&&i.length?["require","exports","module"]:s,m=0;m<s.length;m+=1)if(c=M(s[m],e),u=c.f,"require"===u)x[m]=f.require(t);else if("exports"===u)x[m]=f.exports(t),y=!0;else if("module"===u)r=x[m]=f.module(t);else if(h(d,u)||h(_,u)||h(j,u))x[m]=l(u);else{if(!c.p)throw new Error(t+" missing "+u);c.p.load(c.n,n(e,!0),o(u),{}),x[m]=d[u]}p=i.apply(d[t],x),t&&(r&&r.exports!==a&&r.exports!==d[t]?d[t]=r.exports:p===a&&y||(d[t]=p))}else t&&(d[t]=i)},t=s=m=function(t,s,i,h,e){return"string"==typeof t?f[t]?f[t](s):l(M(t,s).f):(t.splice||(y=t,s.splice?(t=s,s=i,i=null):t=a),s=s||function(){},"function"==typeof i&&(i=h,h=e),h?c(a,t,s,i):setTimeout(function(){c(a,t,s,i)},4),m)},m.config=function(t){return y=t,y.deps&&m(y.deps,y.callback),m},t._defined=d,i=function(t,s,i){s.splice||(i=s,s=[]),h(d,t)||h(_,t)||(_[t]=[t,s,i])},i.amd={jQuery:!0}}(),i("node_modules/almond/almond",function(){}),i("proj4/mgrs",["require","exports","module"],function(t,s){function i(t){return t*(Math.PI/180)}function a(t){return 180*(t/Math.PI)}function h(t){var s,a,h,e,r,o,l,u,p,c=t.lat,m=t.lon,M=6378137,f=.00669438,d=.9996,_=i(c),y=i(m);p=Math.floor((m+180)/6)+1,180===m&&(p=60),c>=56&&64>c&&m>=3&&12>m&&(p=32),c>=72&&84>c&&(m>=0&&9>m?p=31:m>=9&&21>m?p=33:m>=21&&33>m?p=35:m>=33&&42>m&&(p=37)),s=6*(p-1)-180+3,u=i(s),a=f/(1-f),h=M/Math.sqrt(1-f*Math.sin(_)*Math.sin(_)),e=Math.tan(_)*Math.tan(_),r=a*Math.cos(_)*Math.cos(_),o=Math.cos(_)*(y-u),l=M*((1-f/4-3*f*f/64-5*f*f*f/256)*_-(3*f/8+3*f*f/32+45*f*f*f/1024)*Math.sin(2*_)+(15*f*f/256+45*f*f*f/1024)*Math.sin(4*_)-35*f*f*f/3072*Math.sin(6*_));var j=d*h*(o+(1-e+r)*o*o*o/6+(5-18*e+e*e+72*r-58*a)*o*o*o*o*o/120)+5e5,x=d*(l+h*Math.tan(_)*(o*o/2+(5-e+9*r+4*r*r)*o*o*o*o/24+(61-58*e+e*e+600*r-330*a)*o*o*o*o*o*o/720));return 0>c&&(x+=1e7),{northing:Math.round(x),easting:Math.round(j),zoneNumber:p,zoneLetter:n(c)}}function e(t){var s=t.northing,i=t.easting,h=t.zoneLetter,n=t.zoneNumber;if(0>n||n>60)return null;var r,o,l,u,p,c,m,M,f,d,_=.9996,y=6378137,j=.00669438,x=(1-Math.sqrt(1-j))/(1+Math.sqrt(1-j)),g=i-5e5,v=s;"N">h&&(v-=1e7),M=6*(n-1)-180+3,r=j/(1-j),m=v/_,f=m/(y*(1-j/4-3*j*j/64-5*j*j*j/256)),d=f+(3*x/2-27*x*x*x/32)*Math.sin(2*f)+(21*x*x/16-55*x*x*x*x/32)*Math.sin(4*f)+151*x*x*x/96*Math.sin(6*f),o=y/Math.sqrt(1-j*Math.sin(d)*Math.sin(d)),l=Math.tan(d)*Math.tan(d),u=r*Math.cos(d)*Math.cos(d),p=y*(1-j)/Math.pow(1-j*Math.sin(d)*Math.sin(d),1.5),c=g/(o*_);var P=d-o*Math.tan(d)/p*(c*c/2-(5+3*l+10*u-4*u*u-9*r)*c*c*c*c/24+(61+90*l+298*u+45*l*l-252*r-3*u*u)*c*c*c*c*c*c/720);P=a(P);var b=(c-(1+2*l+u)*c*c*c/6+(5-2*u+28*l-3*u*u+8*r+24*l*l)*c*c*c*c*c/120)/Math.cos(d);b=M+a(b);var C;if(t.accuracy){var S=e({northing:t.northing+t.accuracy,easting:t.easting+t.accuracy,zoneLetter:t.zoneLetter,zoneNumber:t.zoneNumber});C={top:S.lat,right:S.lon,bottom:P,left:b}}else C={lat:P,lon:b};return C}function n(t){var s="Z";return 84>=t&&t>=72?s="X":72>t&&t>=64?s="W":64>t&&t>=56?s="V":56>t&&t>=48?s="U":48>t&&t>=40?s="T":40>t&&t>=32?s="S":32>t&&t>=24?s="R":24>t&&t>=16?s="Q":16>t&&t>=8?s="P":8>t&&t>=0?s="N":0>t&&t>=-8?s="M":-8>t&&t>=-16?s="L":-16>t&&t>=-24?s="K":-24>t&&t>=-32?s="J":-32>t&&t>=-40?s="H":-40>t&&t>=-48?s="G":-48>t&&t>=-56?s="F":-56>t&&t>=-64?s="E":-64>t&&t>=-72?s="D":-72>t&&t>=-80&&(s="C"),s}function r(t,s){var i=""+t.easting,a=""+t.northing;return t.zoneNumber+t.zoneLetter+o(t.easting,t.northing,t.zoneNumber)+i.substr(i.length-5,s)+a.substr(a.length-5,s)}function o(t,s,i){var a=l(i),h=Math.floor(t/1e5),e=Math.floor(s/1e5)%20;return u(h,e,a)}function l(t){var s=t%f;return 0===s&&(s=f),s}function u(t,s,i){var a=i-1,h=d.charCodeAt(a),e=_.charCodeAt(a),n=h+t-1,r=e+s,o=!1;n>v&&(n=n-v+y-1,o=!0),(n===j||j>h&&n>j||(n>j||j>h)&&o)&&n++,(n===x||x>h&&n>x||(n>x||x>h)&&o)&&(n++,n===j&&n++),n>v&&(n=n-v+y-1),r>g?(r=r-g+y-1,o=!0):o=!1,(r===j||j>e&&r>j||(r>j||j>e)&&o)&&r++,(r===x||x>e&&r>x||(r>x||x>e)&&o)&&(r++,r===j&&r++),r>g&&(r=r-g+y-1);var l=String.fromCharCode(n)+String.fromCharCode(r);return l}function p(t){if(t&&0===t.length)throw"MGRSPoint coverting from nothing";for(var s,i=t.length,a=null,h="",e=0;!/[A-Z]/.test(s=t.charAt(e));){if(e>=2)throw"MGRSPoint bad conversion from: "+t;h+=s,e++}var n=parseInt(h,10);if(0===e||e+3>i)throw"MGRSPoint bad conversion from: "+t;var r=t.charAt(e++);if("A">=r||"B"===r||"Y"===r||r>="Z"||"I"===r||"O"===r)throw"MGRSPoint zone letter "+r+" not handled: "+t;a=t.substring(e,e+=2);for(var o=l(n),u=c(a.charAt(0),o),p=m(a.charAt(1),o);p<M(r);)p+=2e6;var f=i-e;if(0!==f%2)throw"MGRSPoint has to have an even number \nof digits after the zone letter and two 100km letters - front \nhalf for easting meters, second half for \nnorthing meters"+t;var d,_,y,j,x,g=f/2,v=0,P=0;return g>0&&(d=1e5/Math.pow(10,g),_=t.substring(e,e+g),v=parseFloat(_)*d,y=t.substring(e+g),P=parseFloat(y)*d),j=v+u,x=P+p,{easting:j,northing:x,zoneLetter:r,zoneNumber:n,accuracy:d}}function c(t,s){for(var i=d.charCodeAt(s-1),a=1e5,h=!1;i!==t.charCodeAt(0);){if(i++,i===j&&i++,i===x&&i++,i>v){if(h)throw"Bad character: "+t;i=y,h=!0}a+=1e5}return a}function m(t,s){if(t>"V")throw"MGRSPoint given invalid Northing "+t;for(var i=_.charCodeAt(s-1),a=0,h=!1;i!==t.charCodeAt(0);){if(i++,i===j&&i++,i===x&&i++,i>g){if(h)throw"Bad character: "+t;i=y,h=!0}a+=1e5}return a}function M(t){var s;switch(t){case"C":s=11e5;break;case"D":s=2e6;break;case"E":s=28e5;break;case"F":s=37e5;break;case"G":s=46e5;break;case"H":s=55e5;break;case"J":s=64e5;break;case"K":s=73e5;break;case"L":s=82e5;break;case"M":s=91e5;break;case"N":s=0;break;case"P":s=8e5;break;case"Q":s=17e5;break;case"R":s=26e5;break;case"S":s=35e5;break;case"T":s=44e5;break;case"U":s=53e5;break;case"V":s=62e5;break;case"W":s=7e6;break;case"X":s=79e5;break;default:s=-1}if(s>=0)return s;throw"Invalid zone letter: "+t}var f=6,d="AJSAJS",_="AFAFAF",y=65,j=73,x=79,g=86,v=90;s.forward=function(t,s){return s=s||5,r(h({lat:t.lat,lon:t.lon}),s)},s.inverse=function(t){var s=e(p(t.toUpperCase()));return[s.left,s.bottom,s.right,s.top]}}),i("proj4/Point",["require","proj4/mgrs"],function(t){function s(t,i,a){if(!(this instanceof s))return new s(t,i,a);if("object"==typeof t)this.x=t[0],this.y=t[1],this.z=t[2]||0;else if("string"==typeof t&&"undefined"==typeof i){var h=t.split(",");this.x=parseFloat(h[0]),this.y=parseFloat(h[1]),this.z=parseFloat(h[2])||0}else this.x=t,this.y=i,this.z=a||0;this.clone=function(){return new s(this.x,this.y,this.z)},this.toString=function(){return"x="+this.x+",y="+this.y},this.toShortString=function(){return this.x+", "+this.y}}var i=t("proj4/mgrs");return s.fromMGRS=function(t){var a=i.inverse(t);return new s((a[2]+a[0])/2,(a[3]+a[1])/2)},s.prototype.toMGRS=function(t){return i.forward({lon:this.x,lat:this.y},t)},s}),i("proj4/extend",[],function(){return function(t,s){t=t||{};var i,a;if(!s)return t;for(a in s)i=s[a],void 0!==i&&(t[a]=i);return t}}),i("proj4/common",[],function(){var t={PI:3.141592653589793,HALF_PI:1.5707963267948966,TWO_PI:6.283185307179586,FORTPI:.7853981633974483,R2D:57.29577951308232,D2R:.017453292519943295,SEC_TO_RAD:484813681109536e-20,EPSLN:1e-10,MAX_ITER:20,COS_67P5:.3826834323650898,AD_C:1.0026,PJD_UNKNOWN:0,PJD_3PARAM:1,PJD_7PARAM:2,PJD_GRIDSHIFT:3,PJD_WGS84:4,PJD_NODATUM:5,SRS_WGS84_SEMIMAJOR:6378137,SRS_WGS84_ESQUARED:.006694379990141316,SIXTH:.16666666666666666,RA4:.04722222222222222,RA6:.022156084656084655,RV4:.06944444444444445,RV6:.04243827160493827,msfnz:function(t,s,i){var a=t*s;return i/Math.sqrt(1-a*a)},tsfnz:function(t,s,i){var a=t*i,h=.5*t;return a=Math.pow((1-a)/(1+a),h),Math.tan(.5*(this.HALF_PI-s))/a},phi2z:function(t,s){for(var i,a,h=.5*t,e=this.HALF_PI-2*Math.atan(s),n=0;15>=n;n++)if(i=t*Math.sin(e),a=this.HALF_PI-2*Math.atan(s*Math.pow((1-i)/(1+i),h))-e,e+=a,Math.abs(a)<=1e-10)return e;return-9999},qsfnz:function(t,s){var i;return t>1e-7?(i=t*s,(1-t*t)*(s/(1-i*i)-.5/t*Math.log((1-i)/(1+i)))):2*s},iqsfnz:function(s,i){var a=1-(1-s*s)/(2*s)*Math.log((1-s)/(1+s));if(Math.abs(Math.abs(i)-a)<1e-6)return 0>i?-1*t.HALF_PI:t.HALF_PI;for(var h,e,n,r,o=Math.asin(.5*i),l=0;30>l;l++)if(e=Math.sin(o),n=Math.cos(o),r=s*e,h=Math.pow(1-r*r,2)/(2*n)*(i/(1-s*s)-e/(1-r*r)+.5/s*Math.log((1-r)/(1+r))),o+=h,Math.abs(h)<=1e-10)return o;return 0/0},asinz:function(t){return Math.abs(t)>1&&(t=t>1?1:-1),Math.asin(t)},e0fn:function(t){return 1-.25*t*(1+t/16*(3+1.25*t))},e1fn:function(t){return.375*t*(1+.25*t*(1+.46875*t))},e2fn:function(t){return.05859375*t*t*(1+.75*t)},e3fn:function(t){return t*t*t*(35/3072)},mlfn:function(t,s,i,a,h){return t*h-s*Math.sin(2*h)+i*Math.sin(4*h)-a*Math.sin(6*h)},imlfn:function(t,s,i,a,h){var e,n;e=t/s;for(var r=0;15>r;r++)if(n=(t-(s*e-i*Math.sin(2*e)+a*Math.sin(4*e)-h*Math.sin(6*e)))/(s-2*i*Math.cos(2*e)+4*a*Math.cos(4*e)-6*h*Math.cos(6*e)),e+=n,Math.abs(n)<=1e-10)return e;return 0/0},srat:function(t,s){return Math.pow((1-t)/(1+t),s)},sign:function(t){return 0>t?-1:1},adjust_lon:function(t){return t=Math.abs(t)<this.PI?t:t-this.sign(t)*this.TWO_PI},adjust_lat:function(t){return t=Math.abs(t)<this.HALF_PI?t:t-this.sign(t)*this.PI},latiso:function(t,s,i){if(Math.abs(s)>this.HALF_PI)return Number.NaN;if(s===this.HALF_PI)return Number.POSITIVE_INFINITY;if(s===-1*this.HALF_PI)return Number.NEGATIVE_INFINITY;var a=t*i;return Math.log(Math.tan((this.HALF_PI+s)/2))+t*Math.log((1-a)/(1+a))/2},fL:function(t,s){return 2*Math.atan(t*Math.exp(s))-this.HALF_PI},invlatiso:function(t,s){var i=this.fL(1,s),a=0,h=0;do a=i,h=t*Math.sin(a),i=this.fL(Math.exp(t*Math.log((1+h)/(1-h))/2),s);while(Math.abs(i-a)>1e-12);return i},sinh:function(t){var s=Math.exp(t);return s=(s-1/s)/2},cosh:function(t){var s=Math.exp(t);return s=(s+1/s)/2},tanh:function(t){var s=Math.exp(t);return s=(s-1/s)/(s+1/s)},asinh:function(t){var s=t>=0?1:-1;return s*Math.log(Math.abs(t)+Math.sqrt(t*t+1))},acosh:function(t){return 2*Math.log(Math.sqrt((t+1)/2)+Math.sqrt((t-1)/2))},atanh:function(t){return Math.log((t-1)/(t+1))/2},gN:function(t,s,i){var a=s*i;return t/Math.sqrt(1-a*a)},pj_enfn:function(t){var s=[];s[0]=this.C00-t*(this.C02+t*(this.C04+t*(this.C06+t*this.C08))),s[1]=t*(this.C22-t*(this.C04+t*(this.C06+t*this.C08)));var i=t*t;return s[2]=i*(this.C44-t*(this.C46+t*this.C48)),i*=t,s[3]=i*(this.C66-t*this.C68),s[4]=i*t*this.C88,s},pj_mlfn:function(t,s,i,a){return i*=s,s*=s,a[0]*t-i*(a[1]+s*(a[2]+s*(a[3]+s*a[4])))},pj_inv_mlfn:function(s,i,a){for(var h=1/(1-i),e=s,n=t.MAX_ITER;n;--n){var r=Math.sin(e),o=1-i*r*r;if(o=(this.pj_mlfn(e,r,Math.cos(e),a)-s)*o*Math.sqrt(o)*h,e-=o,Math.abs(o)<t.EPSLN)return e}return e},nad_intr:function(t,s){var i,a={x:(t.x-1e-7)/s.del[0],y:(t.y-1e-7)/s.del[1]},h={x:Math.floor(a.x),y:Math.floor(a.y)},e={x:a.x-1*h.x,y:a.y-1*h.y},n={x:Number.NaN,y:Number.NaN};if(h.x<0){if(!(-1===h.x&&e.x>.99999999999))return n;h.x++,e.x=0}else if(i=h.x+1,i>=s.lim[0]){if(!(i===s.lim[0]&&e.x<1e-11))return n;h.x--,e.x=1}if(h.y<0){if(!(-1===h.y&&e.y>.99999999999))return n;h.y++,e.y=0}else if(i=h.y+1,i>=s.lim[1]){if(!(i===s.lim[1]&&e.y<1e-11))return n;h.y++,e.y=1}i=h.y*s.lim[0]+h.x;var r={x:s.cvs[i][0],y:s.cvs[i][1]};i++;var o={x:s.cvs[i][0],y:s.cvs[i][1]};i+=s.lim[0];var l={x:s.cvs[i][0],y:s.cvs[i][1]};i--;var u={x:s.cvs[i][0],y:s.cvs[i][1]},p=e.x*e.y,c=e.x*(1-e.y),m=(1-e.x)*(1-e.y),M=(1-e.x)*e.y;return n.x=m*r.x+c*o.x+M*u.x+p*l.x,n.y=m*r.y+c*o.y+M*u.y+p*l.y,n},nad_cvt:function(s,i,a){var h={x:Number.NaN,y:Number.NaN};if(isNaN(s.x))return h;var e={x:s.x,y:s.y};e.x-=a.ll[0],e.y-=a.ll[1],e.x=t.adjust_lon(e.x-t.PI)+t.PI;var n=t.nad_intr(e,a);if(i){if(isNaN(n.x))return h;n.x=e.x+n.x,n.y=e.y-n.y;var r,o,l=9,u=1e-12;do{if(o=t.nad_intr(n,a),isNaN(o.x)){this.reportError("Inverse grid shift iteration failed, presumably at grid edge.  Using first approximation.");break}r={x:n.x-o.x-e.x,y:n.y+o.y-e.y},n.x-=r.x,n.y-=r.y}while(l--&&Math.abs(r.x)>u&&Math.abs(r.y)>u);if(0>l)return this.reportError("Inverse grid shift iterator failed to converge."),h;h.x=t.adjust_lon(n.x+a.ll[0]),h.y=n.y+a.ll[1]}else isNaN(n.x)||(h.x=s.x-n.x,h.y=s.y+n.y);return h},C00:1,C02:.25,C04:.046875,C06:.01953125,C08:.01068115234375,C22:.75,C44:.46875,C46:.013020833333333334,C48:.007120768229166667,C66:.3645833333333333,C68:.005696614583333333,C88:.3076171875};return t}),i("proj4/global",[],function(){return function(t){t("WGS84","+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"),t("EPSG:4326","+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"),t("EPSG:4269","+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees"),t("EPSG:3857","+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs"),t["EPSG:3785"]=t["EPSG:3857"],t.GOOGLE=t["EPSG:3857"],t["EPSG:900913"]=t["EPSG:3857"],t["EPSG:102113"]=t["EPSG:3857"]}}),i("proj4/constants/PrimeMeridian",{greenwich:0,lisbon:-9.131906111111,paris:2.337229166667,bogota:-74.080916666667,madrid:-3.687938888889,rome:12.452333333333,bern:7.439583333333,jakarta:106.807719444444,ferro:-17.666666666667,brussels:4.367975,stockholm:18.058277777778,athens:23.7163375,oslo:10.722916666667}),i("proj4/constants/Ellipsoid",{MERIT:{a:6378137,rf:298.257,ellipseName:"MERIT 1983"},SGS85:{a:6378136,rf:298.257,ellipseName:"Soviet Geodetic System 85"},GRS80:{a:6378137,rf:298.257222101,ellipseName:"GRS 1980(IUGG, 1980)"},IAU76:{a:6378140,rf:298.257,ellipseName:"IAU 1976"},airy:{a:6377563.396,b:6356256.91,ellipseName:"Airy 1830"},"APL4.":{a:6378137,rf:298.25,ellipseName:"Appl. Physics. 1965"},NWL9D:{a:6378145,rf:298.25,ellipseName:"Naval Weapons Lab., 1965"},mod_airy:{a:6377340.189,b:6356034.446,ellipseName:"Modified Airy"},andrae:{a:6377104.43,rf:300,ellipseName:"Andrae 1876 (Den., Iclnd.)"},aust_SA:{a:6378160,rf:298.25,ellipseName:"Australian Natl & S. Amer. 1969"},GRS67:{a:6378160,rf:298.247167427,ellipseName:"GRS 67(IUGG 1967)"},bessel:{a:6377397.155,rf:299.1528128,ellipseName:"Bessel 1841"},bess_nam:{a:6377483.865,rf:299.1528128,ellipseName:"Bessel 1841 (Namibia)"},clrk66:{a:6378206.4,b:6356583.8,ellipseName:"Clarke 1866"},clrk80:{a:6378249.145,rf:293.4663,ellipseName:"Clarke 1880 mod."},clrk58:{a:6378293.645208759,rf:294.2606763692654,ellipseName:"Clarke 1858"},CPM:{a:6375738.7,rf:334.29,ellipseName:"Comm. des Poids et Mesures 1799"},delmbr:{a:6376428,rf:311.5,ellipseName:"Delambre 1810 (Belgium)"},engelis:{a:6378136.05,rf:298.2566,ellipseName:"Engelis 1985"},evrst30:{a:6377276.345,rf:300.8017,ellipseName:"Everest 1830"},evrst48:{a:6377304.063,rf:300.8017,ellipseName:"Everest 1948"},evrst56:{a:6377301.243,rf:300.8017,ellipseName:"Everest 1956"},evrst69:{a:6377295.664,rf:300.8017,ellipseName:"Everest 1969"},evrstSS:{a:6377298.556,rf:300.8017,ellipseName:"Everest (Sabah & Sarawak)"},fschr60:{a:6378166,rf:298.3,ellipseName:"Fischer (Mercury Datum) 1960"},fschr60m:{a:6378155,rf:298.3,ellipseName:"Fischer 1960"},fschr68:{a:6378150,rf:298.3,ellipseName:"Fischer 1968"},helmert:{a:6378200,rf:298.3,ellipseName:"Helmert 1906"},hough:{a:6378270,rf:297,ellipseName:"Hough"},intl:{a:6378388,rf:297,ellipseName:"International 1909 (Hayford)"},kaula:{a:6378163,rf:298.24,ellipseName:"Kaula 1961"},lerch:{a:6378139,rf:298.257,ellipseName:"Lerch 1979"},mprts:{a:6397300,rf:191,ellipseName:"Maupertius 1738"},new_intl:{a:6378157.5,b:6356772.2,ellipseName:"New International 1967"},plessis:{a:6376523,rf:6355863,ellipseName:"Plessis 1817 (France)"},krass:{a:6378245,rf:298.3,ellipseName:"Krassovsky, 1942"},SEasia:{a:6378155,b:6356773.3205,ellipseName:"Southeast Asia"},walbeck:{a:6376896,b:6355834.8467,ellipseName:"Walbeck"},WGS60:{a:6378165,rf:298.3,ellipseName:"WGS 60"},WGS66:{a:6378145,rf:298.25,ellipseName:"WGS 66"},WGS72:{a:6378135,rf:298.26,ellipseName:"WGS 72"},WGS84:{a:6378137,rf:298.257223563,ellipseName:"WGS 84"},sphere:{a:6370997,b:6370997,ellipseName:"Normal Sphere (r=6370997)"}}),i("proj4/constants/Datum",{wgs84:{towgs84:"0,0,0",ellipse:"WGS84",datumName:"WGS84"},ch1903:{towgs84:"674.374,15.056,405.346",ellipse:"bessel",datumName:"swiss"},ggrs87:{towgs84:"-199.87,74.79,246.62",ellipse:"GRS80",datumName:"Greek_Geodetic_Reference_System_1987"},nad83:{towgs84:"0,0,0",ellipse:"GRS80",datumName:"North_American_Datum_1983"},nad27:{nadgrids:"@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat",ellipse:"clrk66",datumName:"North_American_Datum_1927"},potsdam:{towgs84:"606.0,23.0,413.0",ellipse:"bessel",datumName:"Potsdam Rauenberg 1950 DHDN"},carthage:{towgs84:"-263.0,6.0,431.0",ellipse:"clark80",datumName:"Carthage 1934 Tunisia"},hermannskogel:{towgs84:"653.0,-212.0,449.0",ellipse:"bessel",datumName:"Hermannskogel"},ire65:{towgs84:"482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15",ellipse:"mod_airy",datumName:"Ireland 1965"},rassadiran:{towgs84:"-133.63,-157.5,-158.62",ellipse:"intl",datumName:"Rassadiran"},nzgd49:{towgs84:"59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993",ellipse:"intl",datumName:"New Zealand Geodetic Datum 1949"},osgb36:{towgs84:"446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894",ellipse:"airy",datumName:"Airy 1830"},s_jtsk:{towgs84:"589,76,480",ellipse:"bessel",datumName:"S-JTSK (Ferro)"},beduaram:{towgs84:"-106,-87,188",ellipse:"clrk80",datumName:"Beduaram"},gunung_segara:{towgs84:"-403,684,41",ellipse:"bessel",datumName:"Gunung Segara Jakarta"}}),i("proj4/constants/grids",{"null":{ll:[-3.14159265,-1.57079633],del:[3.14159265,1.57079633],lim:[3,3],count:9,cvs:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]}}),i("proj4/constants",["require","exports","module","proj4/constants/PrimeMeridian","proj4/constants/Ellipsoid","proj4/constants/Datum","proj4/constants/grids"],function(t,s){s.PrimeMeridian=t("proj4/constants/PrimeMeridian"),s.Ellipsoid=t("proj4/constants/Ellipsoid"),s.Datum=t("proj4/constants/Datum"),s.Datum.OSB36=s.Datum.OSGB36,s.grids=t("proj4/constants/grids")}),i("proj4/projString",["require","proj4/common","proj4/constants"],function(t){var s=t("proj4/common"),i=t("proj4/constants");return function(t){var a={},h={};t.split("+").map(function(t){return t.trim()}).filter(function(t){return t}).forEach(function(t){var s=t.split("=");s.push(!0),h[s[0].toLowerCase()]=s[1]});var e,n,r,o={proj:"projName",datum:"datumCode",rf:function(t){a.rf=parseFloat(t,10)},lat_0:function(t){a.lat0=t*s.D2R},lat_1:function(t){a.lat1=t*s.D2R},lat_2:function(t){a.lat2=t*s.D2R},lat_ts:function(t){a.lat_ts=t*s.D2R},lon_0:function(t){a.long0=t*s.D2R},lon_1:function(t){a.long1=t*s.D2R},lon_2:function(t){a.long2=t*s.D2R},alpha:function(t){a.alpha=parseFloat(t)*s.D2R},lonc:function(t){a.longc=t*s.D2R},x_0:function(t){a.x0=parseFloat(t,10)},y_0:function(t){a.y0=parseFloat(t,10)},k_0:function(t){a.k0=parseFloat(t,10)},k:function(t){a.k0=parseFloat(t,10)},r_a:function(){a.R_A=!0},zone:function(t){a.zone=parseInt(t,10)},south:function(){a.utmSouth=!0},towgs84:function(t){a.datum_params=t.split(",").map(function(t){return parseFloat(t,10)})},to_meter:function(t){a.to_meter=parseFloat(t,10)},from_greenwich:function(t){a.from_greenwich=t*s.D2R},pm:function(t){a.from_greenwich=(i.PrimeMeridian[t]?i.PrimeMeridian[t]:parseFloat(t,10))*s.D2R},nadgrids:function(t){"@null"===t?a.datumCode="none":a.nadgrids=t},axis:function(t){var s="ewnsud";3===t.length&&-1!==s.indexOf(t.substr(0,1))&&-1!==s.indexOf(t.substr(1,1))&&-1!==s.indexOf(t.substr(2,1))&&(a.axis=t)}};for(e in h)n=h[e],e in o?(r=o[e],"function"==typeof r?r(n):a[r]=n):a[e]=n;return a}}),i("proj4/wkt",["require","proj4/common","proj4/extend"],function(t){function s(t,s,a){t[s]=a.map(function(t){var s={};return i(t,s),s}).reduce(function(t,s){return r(t,s)},{})}function i(t,a){var h;return Array.isArray(t)?(h=t.shift(),"PARAMETER"===h&&(h=t.shift()),1===t.length?Array.isArray(t[0])?(a[h]={},i(t[0],a[h])):a[h]=t[0]:t.length?"TOWGS84"===h?a[h]=t:(a[h]={},["UNIT","PRIMEM","VERT_DATUM"].indexOf(h)>-1?(a[h]={name:t[0].toLowerCase(),convert:t[1]},3===t.length&&(a[h].auth=t[2])):"SPHEROID"===h?(a[h]={name:t[0],a:t[1],rf:t[2]},4===t.length&&(a[h].auth=t[3])):["GEOGCS","GEOCCS","DATUM","VERT_CS","COMPD_CS","LOCAL_CS","FITTED_CS","LOCAL_DATUM"].indexOf(h)>-1?(t[0]=["name",t[0]],s(a,h,t)):t.every(function(t){return Array.isArray(t)})?s(a,h,t):i(t,a[h])):a[h]=!0,void 0):(a[t]=!0,void 0)}function a(t,s){var i=s[0],a=s[1];!(i in t)&&a in t&&(t[i]=t[a],3===s.length&&(t[i]=s[2](t[i])))}function h(t){return t*n.D2R}function e(t){function s(s){var i=t.to_meter||1;return parseFloat(s,10)*i}"GEOGCS"===t.type?t.projName="longlat":"LOCAL_CS"===t.type?(t.projName="identity",t.local=!0):t.projName="object"==typeof t.PROJECTION?Object.keys(t.PROJECTION)[0]:t.PROJECTION,t.UNIT&&(t.units=t.UNIT.name.toLowerCase(),"metre"===t.units&&(t.units="meter"),t.UNIT.convert&&(t.to_meter=parseFloat(t.UNIT.convert,10))),t.GEOGCS&&(t.datumCode=t.GEOGCS.DATUM?t.GEOGCS.DATUM.name.toLowerCase():t.GEOGCS.name.toLowerCase(),"d_"===t.datumCode.slice(0,2)&&(t.datumCode=t.datumCode.slice(2)),("new_zealand_geodetic_datum_1949"===t.datumCode||"new_zealand_1949"===t.datumCode)&&(t.datumCode="nzgd49"),"wgs_1984"===t.datumCode&&("Mercator_Auxiliary_Sphere"===t.PROJECTION&&(t.sphere=!0),t.datumCode="wgs84"),"_ferro"===t.datumCode.slice(-6)&&(t.datumCode=t.datumCode.slice(0,-6)),"_jakarta"===t.datumCode.slice(-8)&&(t.datumCode=t.datumCode.slice(0,-8)),t.GEOGCS.DATUM&&t.GEOGCS.DATUM.SPHEROID&&(t.ellps=t.GEOGCS.DATUM.SPHEROID.name.replace("_19","").replace(/[Cc]larke\_18/,"clrk"),"international"===t.ellps.toLowerCase().slice(0,13)&&(t.ellps="intl"),t.a=t.GEOGCS.DATUM.SPHEROID.a,t.rf=parseFloat(t.GEOGCS.DATUM.SPHEROID.rf,10))),t.b&&!isFinite(t.b)&&(t.b=t.a);var i=function(s){return a(t,s)},e=[["standard_parallel_1","Standard_Parallel_1"],["standard_parallel_2","Standard_Parallel_2"],["false_easting","False_Easting"],["false_northing","False_Northing"],["central_meridian","Central_Meridian"],["latitude_of_origin","Latitude_Of_Origin"],["scale_factor","Scale_Factor"],["k0","scale_factor"],["latitude_of_center","Latitude_of_center"],["lat0","latitude_of_center",h],["longitude_of_center","Longitude_Of_Center"],["longc","longitude_of_center",h],["x0","false_easting",s],["y0","false_northing",s],["long0","central_meridian",h],["lat0","latitude_of_origin",h],["lat0","standard_parallel_1",h],["lat1","standard_parallel_1",h],["lat2","standard_parallel_2",h],["alpha","azimuth",h],["srsCode","name"]];e.forEach(i),t.long0||!t.longc||"Albers_Conic_Equal_Area"!==t.PROJECTION&&"Lambert_Azimuthal_Equal_Area"!==t.PROJECTION||(t.long0=t.longc)}var n=t("proj4/common"),r=t("proj4/extend");return function(t,s){var a=JSON.parse((","+t).replace(/\s*\,\s*([A-Z_0-9]+?)(\[)/g,',["$1",').slice(1).replace(/\s*\,\s*([A-Z_0-9]+?)\]/g,',"$1"]')),h=a.shift(),n=a.shift();a.unshift(["name",n]),a.unshift(["type",h]),a.unshift("output");var o={};return i(a,o),e(o.output),r(s,o.output)}}),i("proj4/defs",["require","proj4/global","proj4/projString","proj4/wkt"],function(t){function s(t){var i=this;if(2===arguments.length)s[t]="+"===arguments[1][0]?a(arguments[1]):h(arguments[1]);else if(1===arguments.length)return Array.isArray(t)?t.map(function(t){Array.isArray(t)?s.apply(i,t):s(t)}):("string"==typeof t||("EPSG"in t?s["EPSG:"+t.EPSG]=t:"ESRI"in t?s["ESRI:"+t.ESRI]=t:"IAU2000"in t?s["IAU2000:"+t.IAU2000]=t:console.log(t)),void 0)}var i=t("proj4/global"),a=t("proj4/projString"),h=t("proj4/wkt");return i(s),s}),i("proj4/datum",["require","proj4/common"],function(t){var s=t("proj4/common"),i=function(t){if(!(this instanceof i))return new i(t);if(this.datum_type=s.PJD_WGS84,t){if(t.datumCode&&"none"===t.datumCode&&(this.datum_type=s.PJD_NODATUM),t.datum_params){for(var a=0;a<t.datum_params.length;a++)t.datum_params[a]=parseFloat(t.datum_params[a]);(0!==t.datum_params[0]||0!==t.datum_params[1]||0!==t.datum_params[2])&&(this.datum_type=s.PJD_3PARAM),t.datum_params.length>3&&(0!==t.datum_params[3]||0!==t.datum_params[4]||0!==t.datum_params[5]||0!==t.datum_params[6])&&(this.datum_type=s.PJD_7PARAM,t.datum_params[3]*=s.SEC_TO_RAD,t.datum_params[4]*=s.SEC_TO_RAD,t.datum_params[5]*=s.SEC_TO_RAD,t.datum_params[6]=t.datum_params[6]/1e6+1)}this.datum_type=t.grids?s.PJD_GRIDSHIFT:this.datum_type,this.a=t.a,this.b=t.b,this.es=t.es,this.ep2=t.ep2,this.datum_params=t.datum_params,this.datum_type===s.PJD_GRIDSHIFT&&(this.grids=t.grids)}};return i.prototype={compare_datums:function(t){return this.datum_type!==t.datum_type?!1:this.a!==t.a||Math.abs(this.es-t.es)>5e-11?!1:this.datum_type===s.PJD_3PARAM?this.datum_params[0]===t.datum_params[0]&&this.datum_params[1]===t.datum_params[1]&&this.datum_params[2]===t.datum_params[2]:this.datum_type===s.PJD_7PARAM?this.datum_params[0]===t.datum_params[0]&&this.datum_params[1]===t.datum_params[1]&&this.datum_params[2]===t.datum_params[2]&&this.datum_params[3]===t.datum_params[3]&&this.datum_params[4]===t.datum_params[4]&&this.datum_params[5]===t.datum_params[5]&&this.datum_params[6]===t.datum_params[6]:this.datum_type===s.PJD_GRIDSHIFT||t.datum_type===s.PJD_GRIDSHIFT?this.nadgrids===t.nadgrids:!0},geodetic_to_geocentric:function(t){var i,a,h,e,n,r,o,l=t.x,u=t.y,p=t.z?t.z:0,c=0;if(u<-s.HALF_PI&&u>-1.001*s.HALF_PI)u=-s.HALF_PI;else if(u>s.HALF_PI&&u<1.001*s.HALF_PI)u=s.HALF_PI;else if(u<-s.HALF_PI||u>s.HALF_PI)return null;return l>s.PI&&(l-=2*s.PI),n=Math.sin(u),o=Math.cos(u),r=n*n,e=this.a/Math.sqrt(1-this.es*r),i=(e+p)*o*Math.cos(l),a=(e+p)*o*Math.sin(l),h=(e*(1-this.es)+p)*n,t.x=i,t.y=a,t.z=h,c},geocentric_to_geodetic:function(t){var i,a,h,e,n,r,o,l,u,p,c,m,M,f,d,_,y,j=1e-12,x=j*j,g=30,v=t.x,P=t.y,b=t.z?t.z:0;if(M=!1,i=Math.sqrt(v*v+P*P),a=Math.sqrt(v*v+P*P+b*b),i/this.a<j){if(M=!0,d=0,a/this.a<j)return _=s.HALF_PI,y=-this.b,void 0}else d=Math.atan2(P,v);h=b/a,e=i/a,n=1/Math.sqrt(1-this.es*(2-this.es)*e*e),l=e*(1-this.es)*n,u=h*n,f=0;do f++,o=this.a/Math.sqrt(1-this.es*u*u),y=i*l+b*u-o*(1-this.es*u*u),r=this.es*o/(o+y),n=1/Math.sqrt(1-r*(2-r)*e*e),p=e*(1-r)*n,c=h*n,m=c*l-p*u,l=p,u=c;while(m*m>x&&g>f);return _=Math.atan(c/Math.abs(p)),t.x=d,t.y=_,t.z=y,t},geocentric_to_geodetic_noniter:function(t){var i,a,h,e,n,r,o,l,u,p,c,m,M,f,d,_,y,j=t.x,x=t.y,g=t.z?t.z:0;if(j=parseFloat(j),x=parseFloat(x),g=parseFloat(g),y=!1,0!==j)i=Math.atan2(x,j);else if(x>0)i=s.HALF_PI;else if(0>x)i=-s.HALF_PI;else if(y=!0,i=0,g>0)a=s.HALF_PI;else{if(!(0>g))return a=s.HALF_PI,h=-this.b,void 0;a=-s.HALF_PI}return n=j*j+x*x,e=Math.sqrt(n),r=g*s.AD_C,l=Math.sqrt(r*r+n),p=r/l,m=e/l,c=p*p*p,o=g+this.b*this.ep2*c,_=e-this.a*this.es*m*m*m,u=Math.sqrt(o*o+_*_),M=o/u,f=_/u,d=this.a/Math.sqrt(1-this.es*M*M),h=f>=s.COS_67P5?e/f-d:f<=-s.COS_67P5?e/-f-d:g/M+d*(this.es-1),y===!1&&(a=Math.atan(M/f)),t.x=i,t.y=a,t.z=h,t},geocentric_to_wgs84:function(t){if(this.datum_type===s.PJD_3PARAM)t.x+=this.datum_params[0],t.y+=this.datum_params[1],t.z+=this.datum_params[2];else if(this.datum_type===s.PJD_7PARAM){var i=this.datum_params[0],a=this.datum_params[1],h=this.datum_params[2],e=this.datum_params[3],n=this.datum_params[4],r=this.datum_params[5],o=this.datum_params[6],l=o*(t.x-r*t.y+n*t.z)+i,u=o*(r*t.x+t.y-e*t.z)+a,p=o*(-n*t.x+e*t.y+t.z)+h;t.x=l,t.y=u,t.z=p}},geocentric_from_wgs84:function(t){if(this.datum_type===s.PJD_3PARAM)t.x-=this.datum_params[0],t.y-=this.datum_params[1],t.z-=this.datum_params[2];else if(this.datum_type===s.PJD_7PARAM){var i=this.datum_params[0],a=this.datum_params[1],h=this.datum_params[2],e=this.datum_params[3],n=this.datum_params[4],r=this.datum_params[5],o=this.datum_params[6],l=(t.x-i)/o,u=(t.y-a)/o,p=(t.z-h)/o;t.x=l+r*u-n*p,t.y=-r*l+u+e*p,t.z=n*l-e*u+p}}},i}),i("proj4/projCode/tmerc",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.e0=i.e0fn(this.es),this.e1=i.e1fn(this.es),this.e2=i.e2fn(this.es),this.e3=i.e3fn(this.es),this.ml0=this.a*i.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0)},s.forward=function(t){var s,a,h,e=t.x,n=t.y,r=i.adjust_lon(e-this.long0),o=Math.sin(n),l=Math.cos(n);if(this.sphere){var u=l*Math.sin(r);if(Math.abs(Math.abs(u)-1)<1e-10)return 93;a=.5*this.a*this.k0*Math.log((1+u)/(1-u)),s=Math.acos(l*Math.cos(r)/Math.sqrt(1-u*u)),0>n&&(s=-s),h=this.a*this.k0*(s-this.lat0)}else{var p=l*r,c=Math.pow(p,2),m=this.ep2*Math.pow(l,2),M=Math.tan(n),f=Math.pow(M,2);s=1-this.es*Math.pow(o,2);var d=this.a/Math.sqrt(s),_=this.a*i.mlfn(this.e0,this.e1,this.e2,this.e3,n);a=this.k0*d*p*(1+c/6*(1-f+m+c/20*(5-18*f+Math.pow(f,2)+72*m-58*this.ep2)))+this.x0,h=this.k0*(_-this.ml0+d*M*c*(.5+c/24*(5-f+9*m+4*Math.pow(m,2)+c/30*(61-58*f+Math.pow(f,2)+600*m-330*this.ep2))))+this.y0}return t.x=a,t.y=h,t},s.inverse=function(t){var s,a,h,e,n,r,o=6;if(this.sphere){var l=Math.exp(t.x/(this.a*this.k0)),u=.5*(l-1/l),p=this.lat0+t.y/(this.a*this.k0),c=Math.cos(p);s=Math.sqrt((1-c*c)/(1+u*u)),n=i.asinz(s),0>p&&(n=-n),r=0===u&&0===c?this.long0:i.adjust_lon(Math.atan2(u,c)+this.long0)}else{var m=t.x-this.x0,M=t.y-this.y0;for(s=(this.ml0+M/this.k0)/this.a,a=s,e=0;!0&&(h=(s+this.e1*Math.sin(2*a)-this.e2*Math.sin(4*a)+this.e3*Math.sin(6*a))/this.e0-a,a+=h,!(Math.abs(h)<=i.EPSLN));e++)if(e>=o)return 95;if(Math.abs(a)<i.HALF_PI){var f=Math.sin(a),d=Math.cos(a),_=Math.tan(a),y=this.ep2*Math.pow(d,2),j=Math.pow(y,2),x=Math.pow(_,2),g=Math.pow(x,2);s=1-this.es*Math.pow(f,2);var v=this.a/Math.sqrt(s),P=v*(1-this.es)/s,b=m/(v*this.k0),C=Math.pow(b,2);n=a-v*_*C/P*(.5-C/24*(5+3*x+10*y-4*j-9*this.ep2-C/30*(61+90*x+298*y+45*g-252*this.ep2-3*j))),r=i.adjust_lon(this.long0+b*(1-C/6*(1+2*x+y-C/20*(5-2*y+28*x-3*j+8*this.ep2+24*g)))/d)}else n=i.HALF_PI*i.sign(M),r=this.long0}return t.x=r,t.y=n,t},s.names=["Transverse_Mercator","Transverse Mercator","tmerc"]}),i("proj4/projCode/utm",["require","exports","module","proj4/common","proj4/projCode/tmerc"],function(t,s){var i=t("proj4/common"),a=t("proj4/projCode/tmerc");s.dependsOn="tmerc",s.init=function(){this.zone&&(this.lat0=0,this.long0=(6*Math.abs(this.zone)-183)*i.D2R,this.x0=5e5,this.y0=this.utmSouth?1e7:0,this.k0=.9996,a.init.apply(this),this.forward=a.forward,this.inverse=a.inverse)},s.names=["Universal Transverse Mercator System","utm"]}),i("proj4/projCode/gauss",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){var t=Math.sin(this.lat0),s=Math.cos(this.lat0);s*=s,this.rc=Math.sqrt(1-this.es)/(1-this.es*t*t),this.C=Math.sqrt(1+this.es*s*s/(1-this.es)),this.phic0=Math.asin(t/this.C),this.ratexp=.5*this.C*this.e,this.K=Math.tan(.5*this.phic0+i.FORTPI)/(Math.pow(Math.tan(.5*this.lat0+i.FORTPI),this.C)*i.srat(this.e*t,this.ratexp))
},s.forward=function(t){var s=t.x,a=t.y;return t.y=2*Math.atan(this.K*Math.pow(Math.tan(.5*a+i.FORTPI),this.C)*i.srat(this.e*Math.sin(a),this.ratexp))-i.HALF_PI,t.x=this.C*s,t},s.inverse=function(t){for(var s=1e-14,a=t.x/this.C,h=t.y,e=Math.pow(Math.tan(.5*h+i.FORTPI)/this.K,1/this.C),n=i.MAX_ITER;n>0&&(h=2*Math.atan(e*i.srat(this.e*Math.sin(t.y),-.5*this.e))-i.HALF_PI,!(Math.abs(h-t.y)<s));--n)t.y=h;return n?(t.x=a,t.y=h,t):null},s.names=["gauss"]}),i("proj4/projCode/sterea",["require","exports","module","proj4/common","proj4/projCode/gauss"],function(t,s){var i=t("proj4/common"),a=t("proj4/projCode/gauss");s.init=function(){a.init.apply(this),this.rc&&(this.sinc0=Math.sin(this.phic0),this.cosc0=Math.cos(this.phic0),this.R2=2*this.rc,this.title||(this.title="Oblique Stereographic Alternative"))},s.forward=function(t){var s,h,e,n;return t.x=i.adjust_lon(t.x-this.long0),a.forward.apply(this,[t]),s=Math.sin(t.y),h=Math.cos(t.y),e=Math.cos(t.x),n=this.k0*this.R2/(1+this.sinc0*s+this.cosc0*h*e),t.x=n*h*Math.sin(t.x),t.y=n*(this.cosc0*s-this.sinc0*h*e),t.x=this.a*t.x+this.x0,t.y=this.a*t.y+this.y0,t},s.inverse=function(t){var s,h,e,n,r;if(t.x=(t.x-this.x0)/this.a,t.y=(t.y-this.y0)/this.a,t.x/=this.k0,t.y/=this.k0,r=Math.sqrt(t.x*t.x+t.y*t.y)){var o=2*Math.atan2(r,this.R2);s=Math.sin(o),h=Math.cos(o),n=Math.asin(h*this.sinc0+t.y*s*this.cosc0/r),e=Math.atan2(t.x*s,r*this.cosc0*h-t.y*this.sinc0*s)}else n=this.phic0,e=0;return t.x=e,t.y=n,a.inverse.apply(this,[t]),t.x=i.adjust_lon(t.x+this.long0),t},s.names=["Stereographic_North_Pole","Oblique_Stereographic","Polar_Stereographic","sterea"]}),i("proj4/projCode/stere",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.ssfn_=function(t,s,a){return s*=a,Math.tan(.5*(i.HALF_PI+t))*Math.pow((1-s)/(1+s),.5*a)},s.init=function(){this.coslat0=Math.cos(this.lat0),this.sinlat0=Math.sin(this.lat0),this.sphere?1===this.k0&&!isNaN(this.lat_ts)&&Math.abs(this.coslat0)<=i.EPSLN&&(this.k0=.5*(1+i.sign(this.lat0)*Math.sin(this.lat_ts))):(Math.abs(this.coslat0)<=i.EPSLN&&(this.con=this.lat0>0?1:-1),this.cons=Math.sqrt(Math.pow(1+this.e,1+this.e)*Math.pow(1-this.e,1-this.e)),1===this.k0&&!isNaN(this.lat_ts)&&Math.abs(this.coslat0)<=i.EPSLN&&(this.k0=.5*this.cons*i.msfnz(this.e,Math.sin(this.lat_ts),Math.cos(this.lat_ts))/i.tsfnz(this.e,this.con*this.lat_ts,this.con*Math.sin(this.lat_ts))),this.ms1=i.msfnz(this.e,this.sinlat0,this.coslat0),this.X0=2*Math.atan(this.ssfn_(this.lat0,this.sinlat0,this.e))-i.HALF_PI,this.cosX0=Math.cos(this.X0),this.sinX0=Math.sin(this.X0))},s.forward=function(t){var s,a,h,e,n,r,o=t.x,l=t.y,u=Math.sin(l),p=Math.cos(l),c=i.adjust_lon(o-this.long0);return Math.abs(Math.abs(o-this.long0)-i.PI)<=i.EPSLN&&Math.abs(l+this.lat0)<=i.EPSLN?(t.x=0/0,t.y=0/0,t):this.sphere?(s=2*this.k0/(1+this.sinlat0*u+this.coslat0*p*Math.cos(c)),t.x=this.a*s*p*Math.sin(c)+this.x0,t.y=this.a*s*(this.coslat0*u-this.sinlat0*p*Math.cos(c))+this.y0,t):(a=2*Math.atan(this.ssfn_(l,u,this.e))-i.HALF_PI,e=Math.cos(a),h=Math.sin(a),Math.abs(this.coslat0)<=i.EPSLN?(n=i.tsfnz(this.e,l*this.con,this.con*u),r=2*this.a*this.k0*n/this.cons,t.x=this.x0+r*Math.sin(o-this.long0),t.y=this.y0-this.con*r*Math.cos(o-this.long0),t):(Math.abs(this.sinlat0)<i.EPSLN?(s=2*this.a*this.k0/(1+e*Math.cos(c)),t.y=s*h):(s=2*this.a*this.k0*this.ms1/(this.cosX0*(1+this.sinX0*h+this.cosX0*e*Math.cos(c))),t.y=s*(this.cosX0*h-this.sinX0*e*Math.cos(c))+this.y0),t.x=s*e*Math.sin(c)+this.x0,t))},s.inverse=function(t){t.x-=this.x0,t.y-=this.y0;var s,a,h,e,n,r=Math.sqrt(t.x*t.x+t.y*t.y);if(this.sphere){var o=2*Math.atan(r/(.5*this.a*this.k0));return s=this.long0,a=this.lat0,r<=i.EPSLN?(t.x=s,t.y=a,t):(a=Math.asin(Math.cos(o)*this.sinlat0+t.y*Math.sin(o)*this.coslat0/r),s=Math.abs(this.coslat0)<i.EPSLN?this.lat0>0?i.adjust_lon(this.long0+Math.atan2(t.x,-1*t.y)):i.adjust_lon(this.long0+Math.atan2(t.x,t.y)):i.adjust_lon(this.long0+Math.atan2(t.x*Math.sin(o),r*this.coslat0*Math.cos(o)-t.y*this.sinlat0*Math.sin(o))),t.x=s,t.y=a,t)}if(Math.abs(this.coslat0)<=i.EPSLN){if(r<=i.EPSLN)return a=this.lat0,s=this.long0,t.x=s,t.y=a,t;t.x*=this.con,t.y*=this.con,h=r*this.cons/(2*this.a*this.k0),a=this.con*i.phi2z(this.e,h),s=this.con*i.adjust_lon(this.con*this.long0+Math.atan2(t.x,-1*t.y))}else e=2*Math.atan(r*this.cosX0/(2*this.a*this.k0*this.ms1)),s=this.long0,r<=i.EPSLN?n=this.X0:(n=Math.asin(Math.cos(e)*this.sinX0+t.y*Math.sin(e)*this.cosX0/r),s=i.adjust_lon(this.long0+Math.atan2(t.x*Math.sin(e),r*this.cosX0*Math.cos(e)-t.y*this.sinX0*Math.sin(e)))),a=-1*i.phi2z(this.e,Math.tan(.5*(i.HALF_PI+n)));return t.x=s,t.y=a,t},s.names=["stere"]}),i("proj4/projCode/somerc",["require","exports","module"],function(t,s){s.init=function(){var t=this.lat0;this.lambda0=this.long0;var s=Math.sin(t),i=this.a,a=this.rf,h=1/a,e=2*h-Math.pow(h,2),n=this.e=Math.sqrt(e);this.R=this.k0*i*Math.sqrt(1-e)/(1-e*Math.pow(s,2)),this.alpha=Math.sqrt(1+e/(1-e)*Math.pow(Math.cos(t),4)),this.b0=Math.asin(s/this.alpha);var r=Math.log(Math.tan(Math.PI/4+this.b0/2)),o=Math.log(Math.tan(Math.PI/4+t/2)),l=Math.log((1+n*s)/(1-n*s));this.K=r-this.alpha*o+this.alpha*n/2*l},s.forward=function(t){var s=Math.log(Math.tan(Math.PI/4-t.y/2)),i=this.e/2*Math.log((1+this.e*Math.sin(t.y))/(1-this.e*Math.sin(t.y))),a=-this.alpha*(s+i)+this.K,h=2*(Math.atan(Math.exp(a))-Math.PI/4),e=this.alpha*(t.x-this.lambda0),n=Math.atan(Math.sin(e)/(Math.sin(this.b0)*Math.tan(h)+Math.cos(this.b0)*Math.cos(e))),r=Math.asin(Math.cos(this.b0)*Math.sin(h)-Math.sin(this.b0)*Math.cos(h)*Math.cos(e));return t.y=this.R/2*Math.log((1+Math.sin(r))/(1-Math.sin(r)))+this.y0,t.x=this.R*n+this.x0,t},s.inverse=function(t){for(var s=t.x-this.x0,i=t.y-this.y0,a=s/this.R,h=2*(Math.atan(Math.exp(i/this.R))-Math.PI/4),e=Math.asin(Math.cos(this.b0)*Math.sin(h)+Math.sin(this.b0)*Math.cos(h)*Math.cos(a)),n=Math.atan(Math.sin(a)/(Math.cos(this.b0)*Math.cos(a)-Math.sin(this.b0)*Math.tan(h))),r=this.lambda0+n/this.alpha,o=0,l=e,u=-1e3,p=0;Math.abs(l-u)>1e-7;){if(++p>20)return;o=1/this.alpha*(Math.log(Math.tan(Math.PI/4+e/2))-this.K)+this.e*Math.log(Math.tan(Math.PI/4+Math.asin(this.e*Math.sin(l))/2)),u=l,l=2*Math.atan(Math.exp(o))-Math.PI/2}return t.x=r,t.y=l,t},s.names=["somerc"]}),i("proj4/projCode/omerc",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.no_off=this.no_off||!1,this.no_rot=this.no_rot||!1,isNaN(this.k0)&&(this.k0=1);var t=Math.sin(this.lat0),s=Math.cos(this.lat0),a=this.e*t;this.bl=Math.sqrt(1+this.es/(1-this.es)*Math.pow(s,4)),this.al=this.a*this.bl*this.k0*Math.sqrt(1-this.es)/(1-a*a);var h=i.tsfnz(this.e,this.lat0,t),e=this.bl/s*Math.sqrt((1-this.es)/(1-a*a));1>e*e&&(e=1);var n,r;if(isNaN(this.longc)){var o=i.tsfnz(this.e,this.lat1,Math.sin(this.lat1)),l=i.tsfnz(this.e,this.lat2,Math.sin(this.lat2));this.el=this.lat0>=0?(e+Math.sqrt(e*e-1))*Math.pow(h,this.bl):(e-Math.sqrt(e*e-1))*Math.pow(h,this.bl);var u=Math.pow(o,this.bl),p=Math.pow(l,this.bl);n=this.el/u,r=.5*(n-1/n);var c=(this.el*this.el-p*u)/(this.el*this.el+p*u),m=(p-u)/(p+u),M=i.adjust_lon(this.long1-this.long2);this.long0=.5*(this.long1+this.long2)-Math.atan(c*Math.tan(.5*this.bl*M)/m)/this.bl,this.long0=i.adjust_lon(this.long0);var f=i.adjust_lon(this.long1-this.long0);this.gamma0=Math.atan(Math.sin(this.bl*f)/r),this.alpha=Math.asin(e*Math.sin(this.gamma0))}else n=this.lat0>=0?e+Math.sqrt(e*e-1):e-Math.sqrt(e*e-1),this.el=n*Math.pow(h,this.bl),r=.5*(n-1/n),this.gamma0=Math.asin(Math.sin(this.alpha)/e),this.long0=this.longc-Math.asin(r*Math.tan(this.gamma0))/this.bl;this.uc=this.no_off?0:this.lat0>=0?this.al/this.bl*Math.atan2(Math.sqrt(e*e-1),Math.cos(this.alpha)):-1*this.al/this.bl*Math.atan2(Math.sqrt(e*e-1),Math.cos(this.alpha))},s.forward=function(t){var s,a,h,e=t.x,n=t.y,r=i.adjust_lon(e-this.long0);if(Math.abs(Math.abs(n)-i.HALF_PI)<=i.EPSLN)h=n>0?-1:1,a=this.al/this.bl*Math.log(Math.tan(i.FORTPI+.5*h*this.gamma0)),s=-1*h*i.HALF_PI*this.al/this.bl;else{var o=i.tsfnz(this.e,n,Math.sin(n)),l=this.el/Math.pow(o,this.bl),u=.5*(l-1/l),p=.5*(l+1/l),c=Math.sin(this.bl*r),m=(u*Math.sin(this.gamma0)-c*Math.cos(this.gamma0))/p;a=Math.abs(Math.abs(m)-1)<=i.EPSLN?Number.POSITIVE_INFINITY:.5*this.al*Math.log((1-m)/(1+m))/this.bl,s=Math.abs(Math.cos(this.bl*r))<=i.EPSLN?this.al*this.bl*r:this.al*Math.atan2(u*Math.cos(this.gamma0)+c*Math.sin(this.gamma0),Math.cos(this.bl*r))/this.bl}return this.no_rot?(t.x=this.x0+s,t.y=this.y0+a):(s-=this.uc,t.x=this.x0+a*Math.cos(this.alpha)+s*Math.sin(this.alpha),t.y=this.y0+s*Math.cos(this.alpha)-a*Math.sin(this.alpha)),t},s.inverse=function(t){var s,a;this.no_rot?(a=t.y-this.y0,s=t.x-this.x0):(a=(t.x-this.x0)*Math.cos(this.alpha)-(t.y-this.y0)*Math.sin(this.alpha),s=(t.y-this.y0)*Math.cos(this.alpha)+(t.x-this.x0)*Math.sin(this.alpha),s+=this.uc);var h=Math.exp(-1*this.bl*a/this.al),e=.5*(h-1/h),n=.5*(h+1/h),r=Math.sin(this.bl*s/this.al),o=(r*Math.cos(this.gamma0)+e*Math.sin(this.gamma0))/n,l=Math.pow(this.el/Math.sqrt((1+o)/(1-o)),1/this.bl);return Math.abs(o-1)<i.EPSLN?(t.x=this.long0,t.y=i.HALF_PI):Math.abs(o+1)<i.EPSLN?(t.x=this.long0,t.y=-1*i.HALF_PI):(t.y=i.phi2z(this.e,l),t.x=i.adjust_lon(this.long0-Math.atan2(e*Math.cos(this.gamma0)-r*Math.sin(this.gamma0),Math.cos(this.bl*s/this.al))/this.bl)),t},s.names=["Hotine_Oblique_Mercator","Hotine Oblique Mercator","Hotine_Oblique_Mercator_Azimuth_Natural_Origin","Hotine_Oblique_Mercator_Azimuth_Center","omerc"]}),i("proj4/projCode/lcc",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){if(this.lat2||(this.lat2=this.lat1),this.k0||(this.k0=1),!(Math.abs(this.lat1+this.lat2)<i.EPSLN)){var t=this.b/this.a;this.e=Math.sqrt(1-t*t);var s=Math.sin(this.lat1),a=Math.cos(this.lat1),h=i.msfnz(this.e,s,a),e=i.tsfnz(this.e,this.lat1,s),n=Math.sin(this.lat2),r=Math.cos(this.lat2),o=i.msfnz(this.e,n,r),l=i.tsfnz(this.e,this.lat2,n),u=i.tsfnz(this.e,this.lat0,Math.sin(this.lat0));this.ns=Math.abs(this.lat1-this.lat2)>i.EPSLN?Math.log(h/o)/Math.log(e/l):s,isNaN(this.ns)&&(this.ns=s),this.f0=h/(this.ns*Math.pow(e,this.ns)),this.rh=this.a*this.f0*Math.pow(u,this.ns),this.title||(this.title="Lambert Conformal Conic")}},s.forward=function(t){var s=t.x,a=t.y;Math.abs(2*Math.abs(a)-i.PI)<=i.EPSLN&&(a=i.sign(a)*(i.HALF_PI-2*i.EPSLN));var h,e,n=Math.abs(Math.abs(a)-i.HALF_PI);if(n>i.EPSLN)h=i.tsfnz(this.e,a,Math.sin(a)),e=this.a*this.f0*Math.pow(h,this.ns);else{if(n=a*this.ns,0>=n)return null;e=0}var r=this.ns*i.adjust_lon(s-this.long0);return t.x=this.k0*e*Math.sin(r)+this.x0,t.y=this.k0*(this.rh-e*Math.cos(r))+this.y0,t},s.inverse=function(t){var s,a,h,e,n,r=(t.x-this.x0)/this.k0,o=this.rh-(t.y-this.y0)/this.k0;this.ns>0?(s=Math.sqrt(r*r+o*o),a=1):(s=-Math.sqrt(r*r+o*o),a=-1);var l=0;if(0!==s&&(l=Math.atan2(a*r,a*o)),0!==s||this.ns>0){if(a=1/this.ns,h=Math.pow(s/(this.a*this.f0),a),e=i.phi2z(this.e,h),-9999===e)return null}else e=-i.HALF_PI;return n=i.adjust_lon(l/this.ns+this.long0),t.x=n,t.y=e,t},s.names=["Lambert Tangential Conformal Conic Projection","Lambert_Conformal_Conic","Lambert_Conformal_Conic_2SP","lcc"]}),i("proj4/projCode/krovak",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.a=6377397.155,this.es=.006674372230614,this.e=Math.sqrt(this.es),this.lat0||(this.lat0=.863937979737193),this.long0||(this.long0=.4334234309119251),this.k0||(this.k0=.9999),this.s45=.785398163397448,this.s90=2*this.s45,this.fi0=this.lat0,this.e2=this.es,this.e=Math.sqrt(this.e2),this.alfa=Math.sqrt(1+this.e2*Math.pow(Math.cos(this.fi0),4)/(1-this.e2)),this.uq=1.04216856380474,this.u0=Math.asin(Math.sin(this.fi0)/this.alfa),this.g=Math.pow((1+this.e*Math.sin(this.fi0))/(1-this.e*Math.sin(this.fi0)),this.alfa*this.e/2),this.k=Math.tan(this.u0/2+this.s45)/Math.pow(Math.tan(this.fi0/2+this.s45),this.alfa)*this.g,this.k1=this.k0,this.n0=this.a*Math.sqrt(1-this.e2)/(1-this.e2*Math.pow(Math.sin(this.fi0),2)),this.s0=1.37008346281555,this.n=Math.sin(this.s0),this.ro0=this.k1*this.n0/Math.tan(this.s0),this.ad=this.s90-this.uq},s.forward=function(t){var s,a,h,e,n,r,o,l=t.x,u=t.y,p=i.adjust_lon(l-this.long0);return s=Math.pow((1+this.e*Math.sin(u))/(1-this.e*Math.sin(u)),this.alfa*this.e/2),a=2*(Math.atan(this.k*Math.pow(Math.tan(u/2+this.s45),this.alfa)/s)-this.s45),h=-p*this.alfa,e=Math.asin(Math.cos(this.ad)*Math.sin(a)+Math.sin(this.ad)*Math.cos(a)*Math.cos(h)),n=Math.asin(Math.cos(a)*Math.sin(h)/Math.cos(e)),r=this.n*n,o=this.ro0*Math.pow(Math.tan(this.s0/2+this.s45),this.n)/Math.pow(Math.tan(e/2+this.s45),this.n),t.y=o*Math.cos(r)/1,t.x=o*Math.sin(r)/1,this.czech||(t.y*=-1,t.x*=-1),t},s.inverse=function(t){var s,i,a,h,e,n,r,o,l=t.x;t.x=t.y,t.y=l,this.czech||(t.y*=-1,t.x*=-1),n=Math.sqrt(t.x*t.x+t.y*t.y),e=Math.atan2(t.y,t.x),h=e/Math.sin(this.s0),a=2*(Math.atan(Math.pow(this.ro0/n,1/this.n)*Math.tan(this.s0/2+this.s45))-this.s45),s=Math.asin(Math.cos(this.ad)*Math.sin(a)-Math.sin(this.ad)*Math.cos(a)*Math.cos(h)),i=Math.asin(Math.cos(a)*Math.sin(h)/Math.cos(s)),t.x=this.long0-i/this.alfa,r=s,o=0;var u=0;do t.y=2*(Math.atan(Math.pow(this.k,-1/this.alfa)*Math.pow(Math.tan(s/2+this.s45),1/this.alfa)*Math.pow((1+this.e*Math.sin(r))/(1-this.e*Math.sin(r)),this.e/2))-this.s45),Math.abs(r-t.y)<1e-10&&(o=1),r=t.y,u+=1;while(0===o&&15>u);return u>=15?null:t},s.names=["Krovak","krovak"]}),i("proj4/projCode/cass",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.sphere||(this.e0=i.e0fn(this.es),this.e1=i.e1fn(this.es),this.e2=i.e2fn(this.es),this.e3=i.e3fn(this.es),this.ml0=this.a*i.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0))},s.forward=function(t){var s,a,h=t.x,e=t.y;if(h=i.adjust_lon(h-this.long0),this.sphere)s=this.a*Math.asin(Math.cos(e)*Math.sin(h)),a=this.a*(Math.atan2(Math.tan(e),Math.cos(h))-this.lat0);else{var n=Math.sin(e),r=Math.cos(e),o=i.gN(this.a,this.e,n),l=Math.tan(e)*Math.tan(e),u=h*Math.cos(e),p=u*u,c=this.es*r*r/(1-this.es),m=this.a*i.mlfn(this.e0,this.e1,this.e2,this.e3,e);s=o*u*(1-p*l*(1/6-(8-l+8*c)*p/120)),a=m-this.ml0+o*n/r*p*(.5+(5-l+6*c)*p/24)}return t.x=s+this.x0,t.y=a+this.y0,t},s.inverse=function(t){t.x-=this.x0,t.y-=this.y0;var s,a,h=t.x/this.a,e=t.y/this.a;if(this.sphere){var n=e+this.lat0;s=Math.asin(Math.sin(n)*Math.cos(h)),a=Math.atan2(Math.tan(h),Math.cos(n))}else{var r=this.ml0/this.a+e,o=i.imlfn(r,this.e0,this.e1,this.e2,this.e3);if(Math.abs(Math.abs(o)-i.HALF_PI)<=i.EPSLN)return t.x=this.long0,t.y=i.HALF_PI,0>e&&(t.y*=-1),t;var l=i.gN(this.a,this.e,Math.sin(o)),u=l*l*l/this.a/this.a*(1-this.es),p=Math.pow(Math.tan(o),2),c=h*this.a/l,m=c*c;s=o-l*Math.tan(o)/u*c*c*(.5-(1+3*p)*c*c/24),a=c*(1-m*(p/3+(1+3*p)*p*m/15))/Math.cos(o)}return t.x=i.adjust_lon(a+this.long0),t.y=i.adjust_lat(s),t},s.names=["Cassini","Cassini_Soldner","cass"]}),i("proj4/projCode/laea",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.S_POLE=1,s.N_POLE=2,s.EQUIT=3,s.OBLIQ=4,s.init=function(){var t=Math.abs(this.lat0);if(this.mode=Math.abs(t-i.HALF_PI)<i.EPSLN?this.lat0<0?this.S_POLE:this.N_POLE:Math.abs(t)<i.EPSLN?this.EQUIT:this.OBLIQ,this.es>0){var s;switch(this.qp=i.qsfnz(this.e,1),this.mmf=.5/(1-this.es),this.apa=this.authset(this.es),this.mode){case this.N_POLE:this.dd=1;break;case this.S_POLE:this.dd=1;break;case this.EQUIT:this.rq=Math.sqrt(.5*this.qp),this.dd=1/this.rq,this.xmf=1,this.ymf=.5*this.qp;break;case this.OBLIQ:this.rq=Math.sqrt(.5*this.qp),s=Math.sin(this.lat0),this.sinb1=i.qsfnz(this.e,s)/this.qp,this.cosb1=Math.sqrt(1-this.sinb1*this.sinb1),this.dd=Math.cos(this.lat0)/(Math.sqrt(1-this.es*s*s)*this.rq*this.cosb1),this.ymf=(this.xmf=this.rq)/this.dd,this.xmf*=this.dd}}else this.mode===this.OBLIQ&&(this.sinph0=Math.sin(this.lat0),this.cosph0=Math.cos(this.lat0))},s.forward=function(t){var s,a,h,e,n,r,o,l,u,p,c=t.x,m=t.y;if(c=i.adjust_lon(c-this.long0),this.sphere){if(n=Math.sin(m),p=Math.cos(m),h=Math.cos(c),this.mode===this.OBLIQ||this.mode===this.EQUIT){if(a=this.mode===this.EQUIT?1+p*h:1+this.sinph0*n+this.cosph0*p*h,a<=i.EPSLN)return null;a=Math.sqrt(2/a),s=a*p*Math.sin(c),a*=this.mode===this.EQUIT?n:this.cosph0*n-this.sinph0*p*h}else if(this.mode===this.N_POLE||this.mode===this.S_POLE){if(this.mode===this.N_POLE&&(h=-h),Math.abs(m+this.phi0)<i.EPSLN)return null;a=i.FORTPI-.5*m,a=2*(this.mode===this.S_POLE?Math.cos(a):Math.sin(a)),s=a*Math.sin(c),a*=h}}else{switch(o=0,l=0,u=0,h=Math.cos(c),e=Math.sin(c),n=Math.sin(m),r=i.qsfnz(this.e,n),(this.mode===this.OBLIQ||this.mode===this.EQUIT)&&(o=r/this.qp,l=Math.sqrt(1-o*o)),this.mode){case this.OBLIQ:u=1+this.sinb1*o+this.cosb1*l*h;break;case this.EQUIT:u=1+l*h;break;case this.N_POLE:u=i.HALF_PI+m,r=this.qp-r;break;case this.S_POLE:u=m-i.HALF_PI,r=this.qp+r}if(Math.abs(u)<i.EPSLN)return null;switch(this.mode){case this.OBLIQ:case this.EQUIT:u=Math.sqrt(2/u),a=this.mode===this.OBLIQ?this.ymf*u*(this.cosb1*o-this.sinb1*l*h):(u=Math.sqrt(2/(1+l*h)))*o*this.ymf,s=this.xmf*u*l*e;break;case this.N_POLE:case this.S_POLE:r>=0?(s=(u=Math.sqrt(r))*e,a=h*(this.mode===this.S_POLE?u:-u)):s=a=0}}return t.x=this.a*s+this.x0,t.y=this.a*a+this.y0,t},s.inverse=function(t){t.x-=this.x0,t.y-=this.y0;var s,a,h,e,n,r,o,l=t.x/this.a,u=t.y/this.a;if(this.sphere){var p,c=0,m=0;if(p=Math.sqrt(l*l+u*u),a=.5*p,a>1)return null;switch(a=2*Math.asin(a),(this.mode===this.OBLIQ||this.mode===this.EQUIT)&&(m=Math.sin(a),c=Math.cos(a)),this.mode){case this.EQUIT:a=Math.abs(p)<=i.EPSLN?0:Math.asin(u*m/p),l*=m,u=c*p;break;case this.OBLIQ:a=Math.abs(p)<=i.EPSLN?this.phi0:Math.asin(c*this.sinph0+u*m*this.cosph0/p),l*=m*this.cosph0,u=(c-Math.sin(a)*this.sinph0)*p;break;case this.N_POLE:u=-u,a=i.HALF_PI-a;break;case this.S_POLE:a-=i.HALF_PI}s=0!==u||this.mode!==this.EQUIT&&this.mode!==this.OBLIQ?Math.atan2(l,u):0}else{if(o=0,this.mode===this.OBLIQ||this.mode===this.EQUIT){if(l/=this.dd,u*=this.dd,r=Math.sqrt(l*l+u*u),r<i.EPSLN)return t.x=0,t.y=this.phi0,t;e=2*Math.asin(.5*r/this.rq),h=Math.cos(e),l*=e=Math.sin(e),this.mode===this.OBLIQ?(o=h*this.sinb1+u*e*this.cosb1/r,n=this.qp*o,u=r*this.cosb1*h-u*this.sinb1*e):(o=u*e/r,n=this.qp*o,u=r*h)}else if(this.mode===this.N_POLE||this.mode===this.S_POLE){if(this.mode===this.N_POLE&&(u=-u),n=l*l+u*u,!n)return t.x=0,t.y=this.phi0,t;o=1-n/this.qp,this.mode===this.S_POLE&&(o=-o)}s=Math.atan2(l,u),a=this.authlat(Math.asin(o),this.apa)}return t.x=i.adjust_lon(this.long0+s),t.y=a,t},s.P00=.3333333333333333,s.P01=.17222222222222222,s.P02=.10257936507936508,s.P10=.06388888888888888,s.P11=.0664021164021164,s.P20=.016415012942191543,s.authset=function(t){var s,i=[];return i[0]=t*this.P00,s=t*t,i[0]+=s*this.P01,i[1]=s*this.P10,s*=t,i[0]+=s*this.P02,i[1]+=s*this.P11,i[2]=s*this.P20,i},s.authlat=function(t,s){var i=t+t;return t+s[0]*Math.sin(i)+s[1]*Math.sin(i+i)+s[2]*Math.sin(i+i+i)},s.names=["Lambert Azimuthal Equal Area","Lambert_Azimuthal_Equal_Area","laea"]}),i("proj4/projCode/merc",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){var t=this.b/this.a;this.es=1-t*t,this.e=Math.sqrt(this.es),this.lat_ts?this.k0=this.sphere?Math.cos(this.lat_ts):i.msfnz(this.e,Math.sin(this.lat_ts),Math.cos(this.lat_ts)):this.k0||(this.k0=this.k?this.k:1)},s.forward=function(t){var s=t.x,a=t.y;if(a*i.R2D>90&&a*i.R2D<-90&&s*i.R2D>180&&s*i.R2D<-180)return null;var h,e;if(Math.abs(Math.abs(a)-i.HALF_PI)<=i.EPSLN)return null;if(this.sphere)h=this.x0+this.a*this.k0*i.adjust_lon(s-this.long0),e=this.y0+this.a*this.k0*Math.log(Math.tan(i.FORTPI+.5*a));else{var n=Math.sin(a),r=i.tsfnz(this.e,a,n);h=this.x0+this.a*this.k0*i.adjust_lon(s-this.long0),e=this.y0-this.a*this.k0*Math.log(r)}return t.x=h,t.y=e,t},s.inverse=function(t){var s,a,h=t.x-this.x0,e=t.y-this.y0;if(this.sphere)a=i.HALF_PI-2*Math.atan(Math.exp(-e/(this.a*this.k0)));else{var n=Math.exp(-e/(this.a*this.k0));if(a=i.phi2z(this.e,n),-9999===a)return null}return s=i.adjust_lon(this.long0+h/(this.a*this.k0)),t.x=s,t.y=a,t},s.names=["Mercator","Popular Visualisation Pseudo Mercator","Mercator_1SP","Mercator_Auxiliary_Sphere","merc"]}),i("proj4/projCode/aea",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){Math.abs(this.lat1+this.lat2)<i.EPSLN||(this.temp=this.b/this.a,this.es=1-Math.pow(this.temp,2),this.e3=Math.sqrt(this.es),this.sin_po=Math.sin(this.lat1),this.cos_po=Math.cos(this.lat1),this.t1=this.sin_po,this.con=this.sin_po,this.ms1=i.msfnz(this.e3,this.sin_po,this.cos_po),this.qs1=i.qsfnz(this.e3,this.sin_po,this.cos_po),this.sin_po=Math.sin(this.lat2),this.cos_po=Math.cos(this.lat2),this.t2=this.sin_po,this.ms2=i.msfnz(this.e3,this.sin_po,this.cos_po),this.qs2=i.qsfnz(this.e3,this.sin_po,this.cos_po),this.sin_po=Math.sin(this.lat0),this.cos_po=Math.cos(this.lat0),this.t3=this.sin_po,this.qs0=i.qsfnz(this.e3,this.sin_po,this.cos_po),this.ns0=Math.abs(this.lat1-this.lat2)>i.EPSLN?(this.ms1*this.ms1-this.ms2*this.ms2)/(this.qs2-this.qs1):this.con,this.c=this.ms1*this.ms1+this.ns0*this.qs1,this.rh=this.a*Math.sqrt(this.c-this.ns0*this.qs0)/this.ns0)},s.forward=function(t){var s=t.x,a=t.y;this.sin_phi=Math.sin(a),this.cos_phi=Math.cos(a);var h=i.qsfnz(this.e3,this.sin_phi,this.cos_phi),e=this.a*Math.sqrt(this.c-this.ns0*h)/this.ns0,n=this.ns0*i.adjust_lon(s-this.long0),r=e*Math.sin(n)+this.x0,o=this.rh-e*Math.cos(n)+this.y0;return t.x=r,t.y=o,t},s.inverse=function(t){var s,a,h,e,n,r;return t.x-=this.x0,t.y=this.rh-t.y+this.y0,this.ns0>=0?(s=Math.sqrt(t.x*t.x+t.y*t.y),h=1):(s=-Math.sqrt(t.x*t.x+t.y*t.y),h=-1),e=0,0!==s&&(e=Math.atan2(h*t.x,h*t.y)),h=s*this.ns0/this.a,this.sphere?r=Math.asin((this.c-h*h)/(2*this.ns0)):(a=(this.c-h*h)/this.ns0,r=this.phi1z(this.e3,a)),n=i.adjust_lon(e/this.ns0+this.long0),t.x=n,t.y=r,t},s.phi1z=function(t,s){var a,h,e,n,r,o=i.asinz(.5*s);if(t<i.EPSLN)return o;for(var l=t*t,u=1;25>=u;u++)if(a=Math.sin(o),h=Math.cos(o),e=t*a,n=1-e*e,r=.5*n*n/h*(s/(1-l)-a/n+.5/t*Math.log((1-e)/(1+e))),o+=r,Math.abs(r)<=1e-7)return o;return null},s.names=["Albers_Conic_Equal_Area","Albers","aea"]}),i("proj4/projCode/gnom",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.sin_p14=Math.sin(this.lat0),this.cos_p14=Math.cos(this.lat0),this.infinity_dist=1e3*this.a,this.rc=1},s.forward=function(t){var s,a,h,e,n,r,o,l,u=t.x,p=t.y;return h=i.adjust_lon(u-this.long0),s=Math.sin(p),a=Math.cos(p),e=Math.cos(h),r=this.sin_p14*s+this.cos_p14*a*e,n=1,r>0||Math.abs(r)<=i.EPSLN?(o=this.x0+this.a*n*a*Math.sin(h)/r,l=this.y0+this.a*n*(this.cos_p14*s-this.sin_p14*a*e)/r):(o=this.x0+this.infinity_dist*a*Math.sin(h),l=this.y0+this.infinity_dist*(this.cos_p14*s-this.sin_p14*a*e)),t.x=o,t.y=l,t},s.inverse=function(t){var s,a,h,e,n,r;return t.x=(t.x-this.x0)/this.a,t.y=(t.y-this.y0)/this.a,t.x/=this.k0,t.y/=this.k0,(s=Math.sqrt(t.x*t.x+t.y*t.y))?(e=Math.atan2(s,this.rc),a=Math.sin(e),h=Math.cos(e),r=i.asinz(h*this.sin_p14+t.y*a*this.cos_p14/s),n=Math.atan2(t.x*a,s*this.cos_p14*h-t.y*this.sin_p14*a),n=i.adjust_lon(this.long0+n)):(r=this.phic0,n=0),t.x=n,t.y=r,t},s.names=["gnom"]}),i("proj4/projCode/cea",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.sphere||(this.k0=i.msfnz(this.e,Math.sin(this.lat_ts),Math.cos(this.lat_ts)))},s.forward=function(t){var s,a,h=t.x,e=t.y,n=i.adjust_lon(h-this.long0);if(this.sphere)s=this.x0+this.a*n*Math.cos(this.lat_ts),a=this.y0+this.a*Math.sin(e)/Math.cos(this.lat_ts);else{var r=i.qsfnz(this.e,Math.sin(e));s=this.x0+this.a*this.k0*n,a=this.y0+.5*this.a*r/this.k0}return t.x=s,t.y=a,t},s.inverse=function(t){t.x-=this.x0,t.y-=this.y0;var s,a;return this.sphere?(s=i.adjust_lon(this.long0+t.x/this.a/Math.cos(this.lat_ts)),a=Math.asin(t.y/this.a*Math.cos(this.lat_ts))):(a=i.iqsfnz(this.e,2*t.y*this.k0/this.a),s=i.adjust_lon(this.long0+t.x/(this.a*this.k0))),t.x=s,t.y=a,t},s.names=["cea"]}),i("proj4/projCode/eqc",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.x0=this.x0||0,this.y0=this.y0||0,this.lat0=this.lat0||0,this.long0=this.long0||0,this.lat_ts=this.lat_t||0,this.title=this.title||"Equidistant Cylindrical (Plate Carre)",this.rc=Math.cos(this.lat_ts)},s.forward=function(t){var s=t.x,a=t.y,h=i.adjust_lon(s-this.long0),e=i.adjust_lat(a-this.lat0);return t.x=this.x0+this.a*h*this.rc,t.y=this.y0+this.a*e,t},s.inverse=function(t){var s=t.x,a=t.y;return t.x=i.adjust_lon(this.long0+(s-this.x0)/(this.a*this.rc)),t.y=i.adjust_lat(this.lat0+(a-this.y0)/this.a),t},s.names=["Equirectangular","Equidistant_Cylindrical","eqc"]}),i("proj4/projCode/poly",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.temp=this.b/this.a,this.es=1-Math.pow(this.temp,2),this.e=Math.sqrt(this.es),this.e0=i.e0fn(this.es),this.e1=i.e1fn(this.es),this.e2=i.e2fn(this.es),this.e3=i.e3fn(this.es),this.ml0=this.a*i.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0)},s.forward=function(t){var s,a,h,e=t.x,n=t.y,r=i.adjust_lon(e-this.long0);if(h=r*Math.sin(n),this.sphere)Math.abs(n)<=i.EPSLN?(s=this.a*r,a=-1*this.a*this.lat0):(s=this.a*Math.sin(h)/Math.tan(n),a=this.a*(i.adjust_lat(n-this.lat0)+(1-Math.cos(h))/Math.tan(n)));else if(Math.abs(n)<=i.EPSLN)s=this.a*r,a=-1*this.ml0;else{var o=i.gN(this.a,this.e,Math.sin(n))/Math.tan(n);s=o*Math.sin(h),a=this.a*i.mlfn(this.e0,this.e1,this.e2,this.e3,n)-this.ml0+o*(1-Math.cos(h))}return t.x=s+this.x0,t.y=a+this.y0,t},s.inverse=function(t){var s,a,h,e,n,r,o,l,u;if(h=t.x-this.x0,e=t.y-this.y0,this.sphere)if(Math.abs(e+this.a*this.lat0)<=i.EPSLN)s=i.adjust_lon(h/this.a+this.long0),a=0;else{r=this.lat0+e/this.a,o=h*h/this.a/this.a+r*r,l=r;var p;for(n=i.MAX_ITER;n;--n)if(p=Math.tan(l),u=-1*(r*(l*p+1)-l-.5*(l*l+o)*p)/((l-r)/p-1),l+=u,Math.abs(u)<=i.EPSLN){a=l;break}s=i.adjust_lon(this.long0+Math.asin(h*Math.tan(l)/this.a)/Math.sin(a))}else if(Math.abs(e+this.ml0)<=i.EPSLN)a=0,s=i.adjust_lon(this.long0+h/this.a);else{r=(this.ml0+e)/this.a,o=h*h/this.a/this.a+r*r,l=r;var c,m,M,f,d;for(n=i.MAX_ITER;n;--n)if(d=this.e*Math.sin(l),c=Math.sqrt(1-d*d)*Math.tan(l),m=this.a*i.mlfn(this.e0,this.e1,this.e2,this.e3,l),M=this.e0-2*this.e1*Math.cos(2*l)+4*this.e2*Math.cos(4*l)-6*this.e3*Math.cos(6*l),f=m/this.a,u=(r*(c*f+1)-f-.5*c*(f*f+o))/(this.es*Math.sin(2*l)*(f*f+o-2*r*f)/(4*c)+(r-f)*(c*M-2/Math.sin(2*l))-M),l-=u,Math.abs(u)<=i.EPSLN){a=l;break}c=Math.sqrt(1-this.es*Math.pow(Math.sin(a),2))*Math.tan(a),s=i.adjust_lon(this.long0+Math.asin(h*c/this.a)/Math.sin(a))}return t.x=s,t.y=a,t},s.names=["Polyconic","poly"]}),i("proj4/projCode/nzmg",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.iterations=1,s.init=function(){this.A=[],this.A[1]=.6399175073,this.A[2]=-.1358797613,this.A[3]=.063294409,this.A[4]=-.02526853,this.A[5]=.0117879,this.A[6]=-.0055161,this.A[7]=.0026906,this.A[8]=-.001333,this.A[9]=67e-5,this.A[10]=-34e-5,this.B_re=[],this.B_im=[],this.B_re[1]=.7557853228,this.B_im[1]=0,this.B_re[2]=.249204646,this.B_im[2]=.003371507,this.B_re[3]=-.001541739,this.B_im[3]=.04105856,this.B_re[4]=-.10162907,this.B_im[4]=.01727609,this.B_re[5]=-.26623489,this.B_im[5]=-.36249218,this.B_re[6]=-.6870983,this.B_im[6]=-1.1651967,this.C_re=[],this.C_im=[],this.C_re[1]=1.3231270439,this.C_im[1]=0,this.C_re[2]=-.577245789,this.C_im[2]=-.007809598,this.C_re[3]=.508307513,this.C_im[3]=-.112208952,this.C_re[4]=-.15094762,this.C_im[4]=.18200602,this.C_re[5]=1.01418179,this.C_im[5]=1.64497696,this.C_re[6]=1.9660549,this.C_im[6]=2.5127645,this.D=[],this.D[1]=1.5627014243,this.D[2]=.5185406398,this.D[3]=-.03333098,this.D[4]=-.1052906,this.D[5]=-.0368594,this.D[6]=.007317,this.D[7]=.0122,this.D[8]=.00394,this.D[9]=-.0013},s.forward=function(t){var s,a=t.x,h=t.y,e=h-this.lat0,n=a-this.long0,r=1e-5*(e/i.SEC_TO_RAD),o=n,l=1,u=0;for(s=1;10>=s;s++)l*=r,u+=this.A[s]*l;var p,c,m=u,M=o,f=1,d=0,_=0,y=0;for(s=1;6>=s;s++)p=f*m-d*M,c=d*m+f*M,f=p,d=c,_=_+this.B_re[s]*f-this.B_im[s]*d,y=y+this.B_im[s]*f+this.B_re[s]*d;return t.x=y*this.a+this.x0,t.y=_*this.a+this.y0,t},s.inverse=function(t){var s,a,h,e=t.x,n=t.y,r=e-this.x0,o=n-this.y0,l=o/this.a,u=r/this.a,p=1,c=0,m=0,M=0;for(s=1;6>=s;s++)a=p*l-c*u,h=c*l+p*u,p=a,c=h,m=m+this.C_re[s]*p-this.C_im[s]*c,M=M+this.C_im[s]*p+this.C_re[s]*c;for(var f=0;f<this.iterations;f++){var d,_,y=m,j=M,x=l,g=u;for(s=2;6>=s;s++)d=y*m-j*M,_=j*m+y*M,y=d,j=_,x+=(s-1)*(this.B_re[s]*y-this.B_im[s]*j),g+=(s-1)*(this.B_im[s]*y+this.B_re[s]*j);y=1,j=0;var v=this.B_re[1],P=this.B_im[1];for(s=2;6>=s;s++)d=y*m-j*M,_=j*m+y*M,y=d,j=_,v+=s*(this.B_re[s]*y-this.B_im[s]*j),P+=s*(this.B_im[s]*y+this.B_re[s]*j);var b=v*v+P*P;m=(x*v+g*P)/b,M=(g*v-x*P)/b}var C=m,S=M,N=1,I=0;for(s=1;9>=s;s++)N*=C,I+=this.D[s]*N;var A=this.lat0+1e5*I*i.SEC_TO_RAD,E=this.long0+S;return t.x=E,t.y=A,t},s.names=["New_Zealand_Map_Grid","nzmg"]}),i("proj4/projCode/mill",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){},s.forward=function(t){var s=t.x,a=t.y,h=i.adjust_lon(s-this.long0),e=this.x0+this.a*h,n=this.y0+1.25*this.a*Math.log(Math.tan(i.PI/4+a/2.5));return t.x=e,t.y=n,t},s.inverse=function(t){t.x-=this.x0,t.y-=this.y0;var s=i.adjust_lon(this.long0+t.x/this.a),a=2.5*(Math.atan(Math.exp(.8*t.y/this.a))-i.PI/4);return t.x=s,t.y=a,t},s.names=["Miller_Cylindrical","mill"]}),i("proj4/projCode/sinu",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.sphere?(this.n=1,this.m=0,this.es=0,this.C_y=Math.sqrt((this.m+1)/this.n),this.C_x=this.C_y/(this.m+1)):this.en=i.pj_enfn(this.es)},s.forward=function(t){var s,a,h=t.x,e=t.y;if(h=i.adjust_lon(h-this.long0),this.sphere){if(this.m)for(var n=this.n*Math.sin(e),r=i.MAX_ITER;r;--r){var o=(this.m*e+Math.sin(e)-n)/(this.m+Math.cos(e));if(e-=o,Math.abs(o)<i.EPSLN)break}else e=1!==this.n?Math.asin(this.n*Math.sin(e)):e;s=this.a*this.C_x*h*(this.m+Math.cos(e)),a=this.a*this.C_y*e}else{var l=Math.sin(e),u=Math.cos(e);a=this.a*i.pj_mlfn(e,l,u,this.en),s=this.a*h*u/Math.sqrt(1-this.es*l*l)}return t.x=s,t.y=a,t},s.inverse=function(t){var s,a,h,e;return t.x-=this.x0,h=t.x/this.a,t.y-=this.y0,s=t.y/this.a,this.sphere?(s/=this.C_y,h/=this.C_x*(this.m+Math.cos(s)),this.m?s=i.asinz((this.m*s+Math.sin(s))/this.n):1!==this.n&&(s=i.asinz(Math.sin(s)/this.n)),h=i.adjust_lon(h+this.long0),s=i.adjust_lat(s)):(s=i.pj_inv_mlfn(t.y/this.a,this.es,this.en),e=Math.abs(s),e<i.HALF_PI?(e=Math.sin(s),a=this.long0+t.x*Math.sqrt(1-this.es*e*e)/(this.a*Math.cos(s)),h=i.adjust_lon(a)):e-i.EPSLN<i.HALF_PI&&(h=this.long0)),t.x=h,t.y=s,t},s.names=["Sinusoidal","sinu"]}),i("proj4/projCode/moll",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){},s.forward=function(t){for(var s=t.x,a=t.y,h=i.adjust_lon(s-this.long0),e=a,n=i.PI*Math.sin(a),r=0;!0;r++){var o=-(e+Math.sin(e)-n)/(1+Math.cos(e));if(e+=o,Math.abs(o)<i.EPSLN)break}e/=2,i.PI/2-Math.abs(a)<i.EPSLN&&(h=0);var l=.900316316158*this.a*h*Math.cos(e)+this.x0,u=1.4142135623731*this.a*Math.sin(e)+this.y0;return t.x=l,t.y=u,t},s.inverse=function(t){var s,a;t.x-=this.x0,t.y-=this.y0,a=t.y/(1.4142135623731*this.a),Math.abs(a)>.999999999999&&(a=.999999999999),s=Math.asin(a);var h=i.adjust_lon(this.long0+t.x/(.900316316158*this.a*Math.cos(s)));h<-i.PI&&(h=-i.PI),h>i.PI&&(h=i.PI),a=(2*s+Math.sin(2*s))/i.PI,Math.abs(a)>1&&(a=1);var e=Math.asin(a);return t.x=h,t.y=e,t},s.names=["Mollweide","moll"]}),i("proj4/projCode/eqdc",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){return Math.abs(this.lat1+this.lat2)<i.EPSLN?(i.reportError("eqdc:init: Equal Latitudes"),void 0):(this.lat2=this.lat2||this.lat1,this.temp=this.b/this.a,this.es=1-Math.pow(this.temp,2),this.e=Math.sqrt(this.es),this.e0=i.e0fn(this.es),this.e1=i.e1fn(this.es),this.e2=i.e2fn(this.es),this.e3=i.e3fn(this.es),this.sinphi=Math.sin(this.lat1),this.cosphi=Math.cos(this.lat1),this.ms1=i.msfnz(this.e,this.sinphi,this.cosphi),this.ml1=i.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat1),Math.abs(this.lat1-this.lat2)<i.EPSLN?this.ns=this.sinphi:(this.sinphi=Math.sin(this.lat2),this.cosphi=Math.cos(this.lat2),this.ms2=i.msfnz(this.e,this.sinphi,this.cosphi),this.ml2=i.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat2),this.ns=(this.ms1-this.ms2)/(this.ml2-this.ml1)),this.g=this.ml1+this.ms1/this.ns,this.ml0=i.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0),this.rh=this.a*(this.g-this.ml0),void 0)
},s.forward=function(t){var s,a=t.x,h=t.y;if(this.sphere)s=this.a*(this.g-h);else{var e=i.mlfn(this.e0,this.e1,this.e2,this.e3,h);s=this.a*(this.g-e)}var n=this.ns*i.adjust_lon(a-this.long0),r=this.x0+s*Math.sin(n),o=this.y0+this.rh-s*Math.cos(n);return t.x=r,t.y=o,t},s.inverse=function(t){t.x-=this.x0,t.y=this.rh-t.y+this.y0;var s,a,h,e;this.ns>=0?(a=Math.sqrt(t.x*t.x+t.y*t.y),s=1):(a=-Math.sqrt(t.x*t.x+t.y*t.y),s=-1);var n=0;if(0!==a&&(n=Math.atan2(s*t.x,s*t.y)),this.sphere)return e=i.adjust_lon(this.long0+n/this.ns),h=i.adjust_lat(this.g-a/this.a),t.x=e,t.y=h,t;var r=this.g-a/this.a;return h=i.imlfn(r,this.e0,this.e1,this.e2,this.e3),e=i.adjust_lon(this.long0+n/this.ns),t.x=e,t.y=h,t},s.names=["Equidistant_Conic","eqdc"]}),i("proj4/projCode/vandg",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.R=this.a},s.forward=function(t){var s,a,h=t.x,e=t.y,n=i.adjust_lon(h-this.long0);Math.abs(e)<=i.EPSLN&&(s=this.x0+this.R*n,a=this.y0);var r=i.asinz(2*Math.abs(e/i.PI));(Math.abs(n)<=i.EPSLN||Math.abs(Math.abs(e)-i.HALF_PI)<=i.EPSLN)&&(s=this.x0,a=e>=0?this.y0+i.PI*this.R*Math.tan(.5*r):this.y0+i.PI*this.R*-Math.tan(.5*r));var o=.5*Math.abs(i.PI/n-n/i.PI),l=o*o,u=Math.sin(r),p=Math.cos(r),c=p/(u+p-1),m=c*c,M=c*(2/u-1),f=M*M,d=i.PI*this.R*(o*(c-f)+Math.sqrt(l*(c-f)*(c-f)-(f+l)*(m-f)))/(f+l);0>n&&(d=-d),s=this.x0+d;var _=l+c;return d=i.PI*this.R*(M*_-o*Math.sqrt((f+l)*(l+1)-_*_))/(f+l),a=e>=0?this.y0+d:this.y0-d,t.x=s,t.y=a,t},s.inverse=function(t){var s,a,h,e,n,r,o,l,u,p,c,m,M;return t.x-=this.x0,t.y-=this.y0,c=i.PI*this.R,h=t.x/c,e=t.y/c,n=h*h+e*e,r=-Math.abs(e)*(1+n),o=r-2*e*e+h*h,l=-2*r+1+2*e*e+n*n,M=e*e/l+(2*o*o*o/l/l/l-9*r*o/l/l)/27,u=(r-o*o/3/l)/l,p=2*Math.sqrt(-u/3),c=3*M/u/p,Math.abs(c)>1&&(c=c>=0?1:-1),m=Math.acos(c)/3,a=t.y>=0?(-p*Math.cos(m+i.PI/3)-o/3/l)*i.PI:-(-p*Math.cos(m+i.PI/3)-o/3/l)*i.PI,s=Math.abs(h)<i.EPSLN?this.long0:i.adjust_lon(this.long0+i.PI*(n-1+Math.sqrt(1+2*(h*h-e*e)+n*n))/2/h),t.x=s,t.y=a,t},s.names=["Van_der_Grinten_I","VanDerGrinten","vandg"]}),i("proj4/projCode/aeqd",["require","exports","module","proj4/common"],function(t,s){var i=t("proj4/common");s.init=function(){this.sin_p12=Math.sin(this.lat0),this.cos_p12=Math.cos(this.lat0)},s.forward=function(t){var s,a,h,e,n,r,o,l,u,p,c,m,M,f,d,_,y,j,x,g,v,P,b,C=t.x,S=t.y,N=Math.sin(t.y),I=Math.cos(t.y),A=i.adjust_lon(C-this.long0);return this.sphere?Math.abs(this.sin_p12-1)<=i.EPSLN?(t.x=this.x0+this.a*(i.HALF_PI-S)*Math.sin(A),t.y=this.y0-this.a*(i.HALF_PI-S)*Math.cos(A),t):Math.abs(this.sin_p12+1)<=i.EPSLN?(t.x=this.x0+this.a*(i.HALF_PI+S)*Math.sin(A),t.y=this.y0+this.a*(i.HALF_PI+S)*Math.cos(A),t):(j=this.sin_p12*N+this.cos_p12*I*Math.cos(A),_=Math.acos(j),y=_/Math.sin(_),t.x=this.x0+this.a*y*I*Math.sin(A),t.y=this.y0+this.a*y*(this.cos_p12*N-this.sin_p12*I*Math.cos(A)),t):(s=i.e0fn(this.es),a=i.e1fn(this.es),h=i.e2fn(this.es),e=i.e3fn(this.es),Math.abs(this.sin_p12-1)<=i.EPSLN?(n=this.a*i.mlfn(s,a,h,e,i.HALF_PI),r=this.a*i.mlfn(s,a,h,e,S),t.x=this.x0+(n-r)*Math.sin(A),t.y=this.y0-(n-r)*Math.cos(A),t):Math.abs(this.sin_p12+1)<=i.EPSLN?(n=this.a*i.mlfn(s,a,h,e,i.HALF_PI),r=this.a*i.mlfn(s,a,h,e,S),t.x=this.x0+(n+r)*Math.sin(A),t.y=this.y0+(n+r)*Math.cos(A),t):(o=N/I,l=i.gN(this.a,this.e,this.sin_p12),u=i.gN(this.a,this.e,N),p=Math.atan((1-this.es)*o+this.es*l*this.sin_p12/(u*I)),c=Math.atan2(Math.sin(A),this.cos_p12*Math.tan(p)-this.sin_p12*Math.cos(A)),x=0===c?Math.asin(this.cos_p12*Math.sin(p)-this.sin_p12*Math.cos(p)):Math.abs(Math.abs(c)-i.PI)<=i.EPSLN?-Math.asin(this.cos_p12*Math.sin(p)-this.sin_p12*Math.cos(p)):Math.asin(Math.sin(A)*Math.cos(p)/Math.sin(c)),m=this.e*this.sin_p12/Math.sqrt(1-this.es),M=this.e*this.cos_p12*Math.cos(c)/Math.sqrt(1-this.es),f=m*M,d=M*M,g=x*x,v=g*x,P=v*x,b=P*x,_=l*x*(1-g*d*(1-d)/6+v/8*f*(1-2*d)+P/120*(d*(4-7*d)-3*m*m*(1-7*d))-b/48*f),t.x=this.x0+_*Math.sin(c),t.y=this.y0+_*Math.cos(c),t))},s.inverse=function(t){t.x-=this.x0,t.y-=this.y0;var s,a,h,e,n,r,o,l,u,p,c,m,M,f,d,_,y,j,x,g,v,P,b;if(this.sphere){if(s=Math.sqrt(t.x*t.x+t.y*t.y),s>2*i.HALF_PI*this.a)return;return a=s/this.a,h=Math.sin(a),e=Math.cos(a),n=this.long0,Math.abs(s)<=i.EPSLN?r=this.lat0:(r=i.asinz(e*this.sin_p12+t.y*h*this.cos_p12/s),o=Math.abs(this.lat0)-i.HALF_PI,n=Math.abs(o)<=i.EPSLN?this.lat0>=0?i.adjust_lon(this.long0+Math.atan2(t.x,-t.y)):i.adjust_lon(this.long0-Math.atan2(-t.x,t.y)):i.adjust_lon(this.long0+Math.atan2(t.x*h,s*this.cos_p12*e-t.y*this.sin_p12*h))),t.x=n,t.y=r,t}return l=i.e0fn(this.es),u=i.e1fn(this.es),p=i.e2fn(this.es),c=i.e3fn(this.es),Math.abs(this.sin_p12-1)<=i.EPSLN?(m=this.a*i.mlfn(l,u,p,c,i.HALF_PI),s=Math.sqrt(t.x*t.x+t.y*t.y),M=m-s,r=i.imlfn(M/this.a,l,u,p,c),n=i.adjust_lon(this.long0+Math.atan2(t.x,-1*t.y)),t.x=n,t.y=r,t):Math.abs(this.sin_p12+1)<=i.EPSLN?(m=this.a*i.mlfn(l,u,p,c,i.HALF_PI),s=Math.sqrt(t.x*t.x+t.y*t.y),M=s-m,r=i.imlfn(M/this.a,l,u,p,c),n=i.adjust_lon(this.long0+Math.atan2(t.x,t.y)),t.x=n,t.y=r,t):(s=Math.sqrt(t.x*t.x+t.y*t.y),_=Math.atan2(t.x,t.y),f=i.gN(this.a,this.e,this.sin_p12),y=Math.cos(_),j=this.e*this.cos_p12*y,x=-j*j/(1-this.es),g=3*this.es*(1-x)*this.sin_p12*this.cos_p12*y/(1-this.es),v=s/f,P=v-x*(1+x)*Math.pow(v,3)/6-g*(1+3*x)*Math.pow(v,4)/24,b=1-x*P*P/2-v*P*P*P/6,d=Math.asin(this.sin_p12*Math.cos(P)+this.cos_p12*Math.sin(P)*y),n=i.adjust_lon(this.long0+Math.asin(Math.sin(_)*Math.sin(P)/Math.cos(d))),r=Math.atan((1-this.es*b*this.sin_p12/Math.sin(d))*Math.tan(d)/(1-this.es)),t.x=n,t.y=r,t)},s.names=["Azimuthal_Equidistant","aeqd"]}),i("proj4/projCode/longlat",["require","exports","module"],function(t,s){function i(t){return t}s.init=function(){},s.forward=i,s.inverse=i,s.names=["longlat","identity"]}),i("proj4/projections",["require","exports","module","proj4/projCode/tmerc","proj4/projCode/utm","proj4/projCode/sterea","proj4/projCode/stere","proj4/projCode/somerc","proj4/projCode/omerc","proj4/projCode/lcc","proj4/projCode/krovak","proj4/projCode/cass","proj4/projCode/laea","proj4/projCode/merc","proj4/projCode/aea","proj4/projCode/gnom","proj4/projCode/cea","proj4/projCode/eqc","proj4/projCode/poly","proj4/projCode/nzmg","proj4/projCode/mill","proj4/projCode/sinu","proj4/projCode/moll","proj4/projCode/eqdc","proj4/projCode/vandg","proj4/projCode/aeqd","proj4/projCode/longlat"],function(t,s){function i(t,s){var i=e.length;return t.names?(e[i]=t,t.names.forEach(function(t){h[t.toLowerCase()]=i}),this):(console.log(s),!0)}var a=[t("proj4/projCode/tmerc"),t("proj4/projCode/utm"),t("proj4/projCode/sterea"),t("proj4/projCode/stere"),t("proj4/projCode/somerc"),t("proj4/projCode/omerc"),t("proj4/projCode/lcc"),t("proj4/projCode/krovak"),t("proj4/projCode/cass"),t("proj4/projCode/laea"),t("proj4/projCode/merc"),t("proj4/projCode/aea"),t("proj4/projCode/gnom"),t("proj4/projCode/cea"),t("proj4/projCode/eqc"),t("proj4/projCode/poly"),t("proj4/projCode/nzmg"),t("proj4/projCode/mill"),t("proj4/projCode/sinu"),t("proj4/projCode/moll"),t("proj4/projCode/eqdc"),t("proj4/projCode/vandg"),t("proj4/projCode/aeqd"),t("proj4/projCode/longlat")],h={},e=[];s.add=i,s.get=function(t){if(!t)return!1;var s=t.toLowerCase();return"undefined"!=typeof h[s]&&e[h[s]]?e[h[s]]:void 0},s.start=function(){a.forEach(i)}}),i("proj4/Proj",["require","proj4/extend","proj4/common","proj4/defs","proj4/constants","proj4/datum","proj4/projections","proj4/wkt","proj4/projString"],function(t){function s(t){if(!(this instanceof s))return new s(t);this.srsCodeInput=t,this.x0=0,this.y0=0;var a;"string"==typeof t?t in h?(this.deriveConstants(h[t]),i(this,h[t])):t.indexOf("GEOGCS")>=0||t.indexOf("GEOCCS")>=0||t.indexOf("PROJCS")>=0||t.indexOf("LOCAL_CS")>=0?(a=o(t),this.deriveConstants(a),i(this,a)):"+"===t[0]&&(a=l(t),this.deriveConstants(a),i(this,a)):(this.deriveConstants(t),i(this,t)),this.initTransforms(this.projName)}var i=t("proj4/extend"),a=t("proj4/common"),h=t("proj4/defs"),e=t("proj4/constants"),n=t("proj4/datum"),r=t("proj4/projections"),o=t("proj4/wkt"),l=t("proj4/projString");return s.projections=r,s.projections.start(),s.prototype={initTransforms:function(t){var a=s.projections.get(t);if(!a)throw"unknown projection "+t;i(this,a),this.init()},deriveConstants:function(t){if(t.nadgrids&&0===t.nadgrids.length&&(t.nadgrids=null),t.nadgrids){t.grids=t.nadgrids.split(",");var s=null,h=t.grids.length;if(h>0)for(var r=0;h>r;r++){s=t.grids[r];var o=s.split("@");""!==o[o.length-1]&&(t.grids[r]={mandatory:1===o.length,name:o[o.length-1],grid:e.grids[o[o.length-1]]},t.grids[r].mandatory&&!t.grids[r].grid)}}if(t.datumCode&&"none"!==t.datumCode){var l=e.Datum[t.datumCode];l&&(t.datum_params=l.towgs84?l.towgs84.split(","):null,t.ellps=l.ellipse,t.datumName=l.datumName?l.datumName:t.datumCode)}if(!t.a){var u=e.Ellipsoid[t.ellps]?e.Ellipsoid[t.ellps]:e.Ellipsoid.WGS84;i(t,u)}t.rf&&!t.b&&(t.b=(1-1/t.rf)*t.a),(0===t.rf||Math.abs(t.a-t.b)<a.EPSLN)&&(t.sphere=!0,t.b=t.a),t.a2=t.a*t.a,t.b2=t.b*t.b,t.es=(t.a2-t.b2)/t.a2,t.e=Math.sqrt(t.es),t.R_A&&(t.a*=1-t.es*(a.SIXTH+t.es*(a.RA4+t.es*a.RA6)),t.a2=t.a*t.a,t.b2=t.b*t.b,t.es=0),t.ep2=(t.a2-t.b2)/t.b2,t.k0||(t.k0=1),t.axis||(t.axis="enu"),t.datum=n(t)}},s}),i("proj4/datum_transform",["require","proj4/common"],function(t){var s=t("proj4/common");return function(t,i,a){function h(t){return t===s.PJD_3PARAM||t===s.PJD_7PARAM}var e,n,r;if(t.compare_datums(i))return a;if(t.datum_type===s.PJD_NODATUM||i.datum_type===s.PJD_NODATUM)return a;var o=t.a,l=t.es,u=i.a,p=i.es,c=t.datum_type;if(c===s.PJD_GRIDSHIFT)if(0===this.apply_gridshift(t,0,a))t.a=s.SRS_WGS84_SEMIMAJOR,t.es=s.SRS_WGS84_ESQUARED;else{if(!t.datum_params)return t.a=o,t.es=t.es,a;for(e=1,n=0,r=t.datum_params.length;r>n;n++)e*=t.datum_params[n];if(0===e)return t.a=o,t.es=t.es,a;c=t.datum_params.length>3?s.PJD_7PARAM:s.PJD_3PARAM}return i.datum_type===s.PJD_GRIDSHIFT&&(i.a=s.SRS_WGS84_SEMIMAJOR,i.es=s.SRS_WGS84_ESQUARED),(t.es!==i.es||t.a!==i.a||h(c)||h(i.datum_type))&&(t.geodetic_to_geocentric(a),h(t.datum_type)&&t.geocentric_to_wgs84(a),h(i.datum_type)&&i.geocentric_from_wgs84(a),i.geocentric_to_geodetic(a)),i.datum_type===s.PJD_GRIDSHIFT&&this.apply_gridshift(i,1,a),t.a=o,t.es=l,i.a=u,i.es=p,a}}),i("proj4/adjust_axis",[],function(){return function(t,s,i){var a,h,e,n=i.x,r=i.y,o=i.z||0;for(e=0;3>e;e++)if(!s||2!==e||void 0!==i.z)switch(0===e?(a=n,h="x"):1===e?(a=r,h="y"):(a=o,h="z"),t.axis[e]){case"e":i[h]=a;break;case"w":i[h]=-a;break;case"n":i[h]=a;break;case"s":i[h]=-a;break;case"u":void 0!==i[h]&&(i.z=a);break;case"d":void 0!==i[h]&&(i.z=-a);break;default:return null}return i}}),i("proj4/transform",["require","proj4/common","proj4/datum_transform","proj4/adjust_axis","proj4/Proj"],function(t){var s=t("proj4/common"),i=t("proj4/datum_transform"),a=t("proj4/adjust_axis"),h=t("proj4/Proj");return function e(t,n,r){function o(t,i){return(t.datum.datum_type===s.PJD_3PARAM||t.datum.datum_type===s.PJD_7PARAM)&&"WGS84"!==i.datumCode}var l;return t.datum&&n.datum&&(o(t,n)||o(n,t))&&(l=new h("WGS84"),e(t,l,r),t=l),"enu"!==t.axis&&a(t,!1,r),"longlat"===t.projName?(r.x*=s.D2R,r.y*=s.D2R):(t.to_meter&&(r.x*=t.to_meter,r.y*=t.to_meter),t.inverse(r)),t.from_greenwich&&(r.x+=t.from_greenwich),r=i(t.datum,n.datum,r),n.from_greenwich&&(r.x-=n.from_greenwich),"longlat"===n.projName?(r.x*=s.R2D,r.y*=s.R2D):(n.forward(r),n.to_meter&&(r.x/=n.to_meter,r.y/=n.to_meter)),"enu"!==n.axis&&a(n,!0,r),r}}),i("proj4/core",["require","proj4/Point","proj4/Proj","proj4/transform"],function(t){function s(t,s,i){var h;return Array.isArray(i)?(h=e(t,s,a(i)),3===i.length?[h.x,h.y,h.z]:[h.x,h.y]):e(t,s,i)}function i(t){return t instanceof h?t:t.oProj?t.oProj:h(t)}var a=t("proj4/Point"),h=t("proj4/Proj"),e=t("proj4/transform"),n=h("WGS84");return function(t,a,h){t=i(t);var e,r=!1;return"undefined"==typeof a?(a=t,t=n,r=!0):("undefined"!=typeof a.x||Array.isArray(a))&&(h=a,a=t,t=n,r=!0),a=i(a),h?s(t,a,h):(e={forward:function(i){return s(t,a,i)},inverse:function(i){return s(a,t,i)}},r&&(e.oProj=a),e)}}),i("proj4/version",[],function(){return"1.4.1"}),i("proj4",["require","proj4/core","proj4/Proj","proj4/Point","proj4/defs","proj4/transform","proj4/mgrs","proj4/version"],function(t){var s=t("proj4/core");return s.defaultDatum="WGS84",s.Proj=t("proj4/Proj"),s.WGS84=new s.Proj("WGS84"),s.Point=t("proj4/Point"),s.defs=t("proj4/defs"),s.transform=t("proj4/transform"),s.mgrs=t("proj4/mgrs"),s.version=t("proj4/version"),s}),s("proj4")});
});
require.register("shp/lib/index.js", function(exports, require, module){
var proj4 = require('proj4');
var unzip = require('unzip');
var binaryAjax = require('binaryajax');
var parseShp = require('parseShp');
var parseDbf = require('parseDbf');
var promise = require('lie');

function shp(base, whiteList) {
	return shp.getShapefile(base, whiteList);
}
shp.combine = function(arr) {
	var out = {};
	out.type = "FeatureCollection";
	out.features = [];
	var i = 0;
	var len = arr[0].length;
	while (i < len) {
		out.features.push({
			"type": "Feature",
			"geometry": arr[0][i],
			"properties": arr[1][i]
		});
		i++;
	}
	return out;
};
shp.parseZip = function(buffer, whiteList) {
	var key;
	var zip = unzip(buffer);
	var names = [];
	whiteList = whiteList || [];
	for (key in zip) {
		if (key.slice(-3).toLowerCase() === "shp") {
			names.push(key.slice(0, - 4));
		}
		else if (key.slice(-3).toLowerCase() === "dbf") {
			zip[key] = parseDbf(zip[key]);
		}
		else if (key.slice(-3).toLowerCase() === "prj") {
			zip[key] = proj4(zip[key]);
		}
		else if (key.slice(-4).toLowerCase() === "json" || whiteList.indexOf(key.split('.').pop()) > -1) {
			names.push(key);
		}
	}
	var geojson = names.map(function(name) {
		var parsed;
		if (name.slice(-4).toLowerCase() === "json") {
			parsed = JSON.parse(zip[name]);
			parsed.fileName = name.slice(0, name.lastIndexOf('.'));
		}
		else if (whiteList.indexOf(name.slice(name.lastIndexOf('.') + 1)) > -1) {
			parsed = zip[name];
			parsed.fileName = name;
		}
		else {
			parsed = shp.combine([parseShp(zip[name + '.shp'], zip[name + '.prj']), zip[name + '.dbf']]);
			parsed.fileName = name;
		}
		return parsed;
	});
	if (geojson.length === 1) {
		return geojson[0];
	}
	else {
		return geojson;
	}
};

function getZip(base, whiteList) {
	return binaryAjax(base).then(function(a) {
		return shp.parseZip(a, whiteList);
	});
}
shp.getShapefile = function(base, whiteList) {
	if (typeof base === 'string') {
		if (base.slice(-4) === '.zip') {
			return getZip(base, whiteList);
		}
		else {
			return binaryAjax.all([
				binaryAjax.all([
				binaryAjax(base + '.shp'),
				binaryAjax(base + '.prj')]).then(function(args) {
					return parseShp(args[0], args[1] ? proj4(args[1]) : false);
				}),
				binaryAjax(base + '.dbf').then(parseDbf)
			]).then(shp.combine);
		}
	}
	else {
		return promise(function(resolve) {
			resolve(shp.parseZip(base));
		});
	}
};
module.exports = shp;

});
require.register("shp/lib/binaryajax.js", function(exports, require, module){
var promise = require('lie');
function binaryAjax(url){
	return promise(function(resolve,reject){
		var type = url.slice(-3);
		var ajax = new XMLHttpRequest();
		ajax.open("GET",url,true);
		if(type !== 'prj'){
			ajax.responseType='arraybuffer';
		}
		ajax.addEventListener("load",function(){
			if(ajax.status>399){
				if(type==='prj'){
					return resolve(false);
				}else{
					return reject(ajax.status);
				}
			}
			promise.resolve(ajax.response);
		}, false);
		ajax.send();
	});
}
binaryAjax.all = function(array) {
    return promise(function(resolve,reject){
        var len = array.length;
        var resolved = 0;
        var out = [];
        var onSuccess = function(n) {
            return function(v) {
                out[n] = v;
                resolved++;
                if (resolved === len) {
                    resolve(out);
                }
            };
        };
        array.forEach(function(v, i) {
            v.then(onSuccess(i), function(a) {
                reject(a);
            });
        });
    });
};
module.exports = binaryAjax;

});
require.register("shp/lib/parseDbf.js", function(exports, require, module){
function dbfHeader(buffer){
	var data = new DataView(buffer);
	var out = {};
	out.lastUpdated = new Date(data.getUint8(1,true)+1900,data.getUint8(2,true),data.getUint8(3,true));
	out.records = data.getUint32(4,true);
	out.headerLen = data.getUint16(8,true);
	out.recLen = data.getUint16(10,true);
	return out;
}

function dbfRowHeader(buffer){
	var data = new DataView(buffer);
	var out = [];
	var offset = 32;
	while(true){
		out.push({
			name : String.fromCharCode.apply(this,(new Uint8Array(buffer,offset,10))).replace(/\0|\s+$/g,''),
			dataType : String.fromCharCode(data.getUint8(offset+11)),
			len : data.getUint8(offset+16),
			decimal : data.getUint8(offset+17)
		});
		if(data.getUint8(offset+32)===13){
			break;
		}else{
			offset+=32;
		}
	}
	return out;
}
function rowFuncs(buffer,offset,len,type){
	var data = (new Uint8Array(buffer,offset,len));
	var textData = String.fromCharCode.apply(this,data).replace(/\0|\s+$/g,'');
	if(type === 'N'){
		return parseFloat(textData,10);
	} else if (type === 'D') {
		return new Date(textData.slice(0,4), parseInt(textData.slice(4,6),10)-1, textData.slice(6,8));
	} else {
		return textData;
	}
}
function parseRow(buffer,offset,rowHeaders){
	var out={};
	var i = 0;
	var len = rowHeaders.length;
	var field;
	var header;
	while(i<len){
		header = rowHeaders[i];
		field = rowFuncs(buffer,offset,header.len,header.dataType);
		offset += header.len;
		if(typeof field !== 'undefined'){
			out[header.name]=field;
		}
		i++;
	}
	return out;
}
module.exports = function(buffer){
	var rowHeaders = dbfRowHeader(buffer);
	var header = dbfHeader(buffer);
	var offset = ((rowHeaders.length+1)<<5)+2;
	var recLen = header.recLen;
	var records = header.records;
	var out = [];
	while(records){
		out.push(parseRow(buffer,offset,rowHeaders));
		offset += recLen;
		records--;
	}
	return out;
};

});
require.register("shp/lib/parseShp.js", function(exports, require, module){
function parseHeader(buffer){
	var view = new DataView(buffer,0,100) ;
	return {
		length : view.getInt32(6<<2,false),
		version : view.getInt32(7<<2,true),
		shpCode : view.getInt32(8<<2,true),
		bbox : [
			view.getFloat64(9<<2,true),
			view.getFloat64(11<<2,true),
			view.getFloat64(13<<2,true),
			view.getFloat64(13<<2,true)
		]
	};
}
function isClockWise(array){
	var sum = 0;
	var i = 1;
	var len = array.length;
	var prev,cur;
	while(i<len){
		prev = cur||array[0];
		cur = array[i];
		sum += ((cur[0]-prev[0])*(cur[1]+prev[1]));
		i++;
	}
	return sum > 0;
}
function polyReduce(a,b){
	if(isClockWise(b)||!a.length){
		a.push([b]);
	}else{
		a[a.length-1].push(b);
	}
	return a;
}
function parsePoint(data,trans){
	return {
		"type": "Point",
		"coordinates":trans(data,0)
	};
}
function parseZPoint(data,trans){
	var pointXY = parsePoint(data,trans);
	pointXY.coordinates.push(trans(data,16));
	return pointXY;
}
function parsePointArray(data,offset,num,trans){
	var out = [];
	var done = 0;
	while(done<num){
		out.push(trans(data,offset));
		offset += 16;
		done++;
	}
	return out;
}
function parseZPointArray(data,zOffset,num,coordinates){
	var i = 0;
	while(i<num){
		coordinates[i].push(data.getFloat64(zOffset,true));
		i++;
		zOffset += 8;
	}
	return coordinates;
}
function parseArrayGroup(data,offset,partOffset,num,tot,trans){
	var out = [];
	var done = 0;
	var curNum,nextNum=0,pointNumber;
	while(done<num){
		done++;
		partOffset += 4;
		curNum = nextNum;
		if(done===num){
			nextNum = tot;
		}else{
			nextNum = data.getInt32(partOffset,true);
		}
		pointNumber = nextNum - curNum;
		if(!pointNumber){
			continue;
		}
		out.push(parsePointArray(data,offset,pointNumber,trans));
		offset += (pointNumber<<4);
	}
	return out;
}
function parseZArrayGroup(data,zOffset,num,coordinates){
	var i = 0;
	while(i<num){
		coordinates[i] = parseZPointArray(data,zOffset,coordinates[i].length,coordinates[i]);
		zOffset += (coordinates[i].length<<3);
		i++;
	}
	return coordinates;
}
function parseMultiPoint(data,trans){
	var out = {};
	out.bbox = [
		data.getFloat64(0,true),
		data.getFloat64(8,true),
		data.getFloat64(16,true),
		data.getFloat64(24,true)
	];
	var num = data.getInt32(32,true);
	var offset = 36;
	if(num===1){
		out.type = "Point";
		out.coordinates = trans(data,offset);
	}else{
		out.type = "MultiPoint";
		out.coordinates = parsePointArray(data,offset,num,trans);
	}
	return out;
}
function parseZMultiPoint(data,trans){
	var geoJson = parseMultiPoint(data,trans);
	var num;
	if(geoJson.type === "Point"){
		geoJson.coordinates.push(data.getFloat64(72,true));
		return geoJson;
	}else{
		num = geoJson.coordinates.length;
	}
	var zOffset = 56 + (num<<4);
	geoJson.coordinates =  parseZPointArray(data,zOffset,num,geoJson.coordinates);
	return geoJson;
}
function parsePolyline(data,trans){
	var out = {};
	out.bbox = [
		data.getFloat64(0,true),
		data.getFloat64(8,true),
		data.getFloat64(16,true),
		data.getFloat64(24,true)
	];
	var numParts = data.getInt32(32,true);
	var num = data.getInt32(36,true);
	var offset,partOffset;
	if(numParts === 1){
		out.type = "LineString";
		offset = 44;
		out.coordinates = parsePointArray(data,offset,num,trans);
	}else{
		out.type = "MultiLineString";
		offset = 40 + (numParts<<2);
		partOffset = 40;
		out.coordinates = parseArrayGroup(data,offset,partOffset,numParts,num,trans);
	}
	return out;
}
function parseZPolyline(data,trans){
	var geoJson = parsePolyline(data,trans);
	var num = geoJson.coordinates.length;
	var zOffset = 60 + (num<<4);
	if(geoJson.type === "LineString"){
		geoJson.coordinates =  parseZPointArray(data,zOffset,num,geoJson.coordinates);
		return geoJson;
	}else{
		geoJson.coordinates =  parseZArrayGroup(data,zOffset,num,geoJson.coordinates);
		return geoJson;
	}
}
function polyFuncs(out){
	if(out.type === "LineString"){
		out.type = "Polygon";
		out.coordinates = [out.coordinates];
		return out;
	}else{
		out.coordinates = out.coordinates.reduce(polyReduce,[]);
		if(out.coordinates.length === 1){
			out.type = "Polygon";
			out.coordinates = out.coordinates[0];
			return out;
		}else{
			out.type = "MultiPolygon";
			return out;
		}
	}
}
function parsePolygon(data,trans){
	return polyFuncs(parsePolyline(data,trans));
}
function parseZPolygon(data,trans){
	return polyFuncs(parseZPolyline(data,trans));
}
var shpFuncObj = {
	1:parsePoint,
	3:parsePolyline,
	5:parsePolygon,
	8:parseMultiPoint,
	11:parseZPoint,
	13:parseZPolyline,
	15:parseZPolygon,
	18:parseZMultiPoint
};
function shpFuncs (num,tran){
	if(num>20){
		num -= 20;
	}
	if(!(num in shpFuncObj)){
		console.log("I don't know that shp type");
		return function(){
			return function(){};
		};
	}
	var shpFunc = shpFuncObj[num];
	var parseCoord = makeParseCoord(tran);
	return function(data){
		return shpFunc(data,parseCoord);
	};
}
var getRow = function(buffer,offset){
	var view = new DataView(buffer,offset,12);
	var len = view.getInt32(4,false)<<1;
	var data = new DataView(buffer,offset+12,len-4);
	
	return {
		id:view.getInt32(0,false),
		len:len,
		data:data,
		type:view.getInt32(8,true)
	};
};

var getRows = function(buffer,parseShape){
	var offset=100;
	var len = buffer.byteLength;
	var out = [];
	var current;
	while(offset<len){
		current = getRow(buffer,offset);
		offset += 8;
		offset += current.len;
		if(current.type){
			out.push(parseShape(current.data));
		}
	}
	return out;
};
function makeParseCoord(trans){
	if(trans){
		return function(data,offset){
			return trans.inverse([data.getFloat64(offset,true),data.getFloat64(offset+8,true)]);
		};
	}else{
		return function(data,offset){
			return [data.getFloat64(offset,true),data.getFloat64(offset+8,true)];
		};
	}
}
module.exports = function(buffer,trans){
	var headers = parseHeader(buffer);
	return getRows(buffer,shpFuncs(headers.shpCode,trans));
};

});
require.register("shp/lib/unzip.js", function(exports, require, module){
var JSZip = require('jszip');
module.exports = function(buffer) {
	var zip = new JSZip(buffer);
	var files = zip.file(/.+/);
	var out = {};
	files.forEach(function(a) {
		if (a.name.slice(-3).toLowerCase() === "shp" || a.name.slice(-3).toLowerCase() === "dbf") {
			out[a.name] = a.asText();
			out[a.name] = a.asArrayBuffer();
		}
		else {
			out[a.name] = a.asText();
		}
	});
	return out;
};

});
require.alias("calvinmetcalf-lie/lie.js", "shp/deps/lie/lie.js");
require.alias("calvinmetcalf-lie/lie.js", "shp/deps/lie/index.js");
require.alias("calvinmetcalf-lie/lie.js", "lie/index.js");
require.alias("calvinmetcalf-setImmediate/lib/index.js", "calvinmetcalf-lie/deps/immediate/lib/index.js");
require.alias("calvinmetcalf-setImmediate/lib/nextTick.js", "calvinmetcalf-lie/deps/immediate/lib/nextTick.js");
require.alias("calvinmetcalf-setImmediate/lib/postMessage.js", "calvinmetcalf-lie/deps/immediate/lib/postMessage.js");
require.alias("calvinmetcalf-setImmediate/lib/messageChannel.js", "calvinmetcalf-lie/deps/immediate/lib/messageChannel.js");
require.alias("calvinmetcalf-setImmediate/lib/stateChange.js", "calvinmetcalf-lie/deps/immediate/lib/stateChange.js");
require.alias("calvinmetcalf-setImmediate/lib/timeout.js", "calvinmetcalf-lie/deps/immediate/lib/timeout.js");
require.alias("calvinmetcalf-setImmediate/lib/global.js", "calvinmetcalf-lie/deps/immediate/lib/global.js");
require.alias("calvinmetcalf-setImmediate/lib/mutation.js", "calvinmetcalf-lie/deps/immediate/lib/mutation.js");
require.alias("calvinmetcalf-setImmediate/lib/realSetImmediate.js", "calvinmetcalf-lie/deps/immediate/lib/realSetImmediate.js");
require.alias("calvinmetcalf-setImmediate/lib/index.js", "calvinmetcalf-lie/deps/immediate/index.js");
require.alias("calvinmetcalf-setImmediate/lib/index.js", "calvinmetcalf-setImmediate/index.js");

require.alias("calvinmetcalf-lie/lie.js", "calvinmetcalf-lie/index.js");

require.alias("calvinmetcalf-jszip/lib/base64.js", "shp/deps/jszip/lib/base64.js");
require.alias("calvinmetcalf-jszip/lib/compressedObject.js", "shp/deps/jszip/lib/compressedObject.js");
require.alias("calvinmetcalf-jszip/lib/compressions.js", "shp/deps/jszip/lib/compressions.js");
require.alias("calvinmetcalf-jszip/lib/dataReader.js", "shp/deps/jszip/lib/dataReader.js");
require.alias("calvinmetcalf-jszip/lib/defaults.js", "shp/deps/jszip/lib/defaults.js");
require.alias("calvinmetcalf-jszip/lib/index.js", "shp/deps/jszip/lib/index.js");
require.alias("calvinmetcalf-jszip/lib/load.js", "shp/deps/jszip/lib/load.js");
require.alias("calvinmetcalf-jszip/lib/nodeBufferReader.js", "shp/deps/jszip/lib/nodeBufferReader.js");
require.alias("calvinmetcalf-jszip/lib/object.js", "shp/deps/jszip/lib/object.js");
require.alias("calvinmetcalf-jszip/lib/signature.js", "shp/deps/jszip/lib/signature.js");
require.alias("calvinmetcalf-jszip/lib/stringReader.js", "shp/deps/jszip/lib/stringReader.js");
require.alias("calvinmetcalf-jszip/lib/support.js", "shp/deps/jszip/lib/support.js");
require.alias("calvinmetcalf-jszip/lib/uint8ArrayReader.js", "shp/deps/jszip/lib/uint8ArrayReader.js");
require.alias("calvinmetcalf-jszip/lib/utils.js", "shp/deps/jszip/lib/utils.js");
require.alias("calvinmetcalf-jszip/lib/zipEntries.js", "shp/deps/jszip/lib/zipEntries.js");
require.alias("calvinmetcalf-jszip/lib/zipEntry.js", "shp/deps/jszip/lib/zipEntry.js");
require.alias("calvinmetcalf-jszip/lib/flate/index.js", "shp/deps/jszip/lib/flate/index.js");
require.alias("calvinmetcalf-jszip/lib/flate/deflate.js", "shp/deps/jszip/lib/flate/deflate.js");
require.alias("calvinmetcalf-jszip/lib/flate/inflate.js", "shp/deps/jszip/lib/flate/inflate.js");
require.alias("calvinmetcalf-jszip/lib/index.js", "shp/deps/jszip/index.js");
require.alias("calvinmetcalf-jszip/lib/index.js", "jszip/index.js");
require.alias("calvinmetcalf-jszip/lib/index.js", "calvinmetcalf-jszip/index.js");

require.alias("proj4js-proj4js/dist/proj4.js", "shp/deps/proj4/dist/proj4.js");
require.alias("proj4js-proj4js/dist/proj4.js", "shp/deps/proj4/index.js");
require.alias("proj4js-proj4js/dist/proj4.js", "proj4/index.js");
require.alias("proj4js-proj4js/dist/proj4.js", "proj4js-proj4js/index.js");

require.alias("shp/lib/index.js", "shp/index.js");

if (typeof exports == "object") {
  module.exports = require("shp");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("shp"); });
} else {
  this["shp"] = require("shp");
}})();