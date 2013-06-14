function shp(){};/*!From setImmediate Copyright (c) 2012 Barnesandnoble.com,llc, Donavon West, and Domenic Denicola @license MIT https://github.com/NobleJS/setImmediate */
(function (attachTo,global) {
    "use strict";

    var tasks = (function () {
        function Task(handler, args) {
            this.handler = handler;
            this.args = args;
        }
        Task.prototype.run = function () {
            // See steps in section 5 of the spec.
            if (typeof this.handler === "function") {
                // Choice of `thisArg` is not in the setImmediate spec; `undefined` is in the setTimeout spec though:
                // http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html
                this.handler.apply(undefined, this.args);
            } else {
                var scriptSource = "" + this.handler;
                /*jshint evil: true */
                eval(scriptSource);
            }
        };

        var nextHandle = 1; // Spec says greater than zero
        var tasksByHandle = {};
        var currentlyRunningATask = false;

        return {
            addFromSetImmediateArguments: function (args) {
                var handler = args[0];
                var argsToHandle = Array.prototype.slice.call(args, 1);
                var task = new Task(handler, argsToHandle);

                var thisHandle = nextHandle++;
                tasksByHandle[thisHandle] = task;
                return thisHandle;
            },
            runIfPresent: function (handle) {
                // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
                // So if we're currently running a task, we'll need to delay this invocation.
                if (!currentlyRunningATask) {
                    var task = tasksByHandle[handle];
                    if (task) {
                        currentlyRunningATask = true;
                        try {
                            task.run();
                        } finally {
                            delete tasksByHandle[handle];
                            currentlyRunningATask = false;
                        }
                    }
                } else {
                    // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
                    // "too much recursion" error.
                    global.setTimeout(function () {
                        tasks.runIfPresent(handle);
                    }, 0);
                }
            },
            remove: function (handle) {
                delete tasksByHandle[handle];
            }
        };
    }());

    function canUseNextTick() {
        // Don't get fooled by e.g. browserify environments.
        return typeof process === "object" &&
               Object.prototype.toString.call(process) === "[object process]";
    }

    function canUseMessageChannel() {
        return !!global.MessageChannel;
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.

        if (!global.postMessage || global.importScripts) {
            return false;
        }

        var postMessageIsAsynchronous = true;
        var oldOnMessage = global.onmessage;
        global.onmessage = function () {
            postMessageIsAsynchronous = false;
        };
        global.postMessage("", "*");
        global.onmessage = oldOnMessage;

        return postMessageIsAsynchronous;
    }

    function canUseReadyStateChange() {
        return "document" in global && "onreadystatechange" in global.document.createElement("script");
    }

    function installNextTickImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            process.nextTick(function () {
                tasks.runIfPresent(handle);
            });

            return handle;
        };
    }

    function installMessageChannelImplementation(attachTo) {
        var channel = new global.MessageChannel();
        channel.port1.onmessage = function (event) {
            var handle = event.data;
            tasks.runIfPresent(handle);
        };
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            channel.port2.postMessage(handle);

            return handle;
        };
    }

    function installPostMessageImplementation(attachTo) {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var MESSAGE_PREFIX = "com.bn.NobleJS.setImmediate" + Math.random();

        function isStringAndStartsWith(string, putativeStart) {
            return typeof string === "string" && string.substring(0, putativeStart.length) === putativeStart;
        }

        function onGlobalMessage(event) {
            // This will catch all incoming messages (even from other windows!), so we need to try reasonably hard to
            // avoid letting anyone else trick us into firing off. We test the origin is still this window, and that a
            // (randomly generated) unpredictable identifying prefix is present.
            if (event.source === global && isStringAndStartsWith(event.data, MESSAGE_PREFIX)) {
                var handle = event.data.substring(MESSAGE_PREFIX.length);
                tasks.runIfPresent(handle);
            }
        }
        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
            // invoking our onGlobalMessage listener above.
            global.postMessage(MESSAGE_PREFIX + handle, "*");

            return handle;
        };
    }

    function installReadyStateChangeImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var scriptEl = global.document.createElement("script");
            scriptEl.onreadystatechange = function () {
                tasks.runIfPresent(handle);

                scriptEl.onreadystatechange = null;
                scriptEl.parentNode.removeChild(scriptEl);
                scriptEl = null;
            };
            global.document.documentElement.appendChild(scriptEl);

            return handle;
        };
    }

    function installSetTimeoutImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            global.setTimeout(function () {
                tasks.runIfPresent(handle);
            }, 0);

            return handle;
        };
    }

    

        if (canUseNextTick()) {
            // For Node.js before 0.9
            installNextTickImplementation(attachTo);
        } else if (canUsePostMessage()) {
            // For non-IE10 modern browsers
            installPostMessageImplementation(attachTo);
        } else if (canUseMessageChannel()) {
            // For web workers, where supported
            installMessageChannelImplementation(attachTo);
        } else if (canUseReadyStateChange()) {
            // For IE 6–8
            installReadyStateChangeImplementation(attachTo);
        } else {
            // For older browsers
            installSetTimeoutImplementation(attachTo);
        }

        attachTo.clearImmediate = tasks.remove;
    
}(shp,typeof global === "object" && global ? global : this));

/*! Promiscuous ©2013 Ruben Verborgh @license MIT https://github.com/RubenVerborgh/promiscuous*/
(function (exports) {
	var func = "function";
	// Creates a deferred: an object with a promise and corresponding resolve/reject methods
	function createDeferred() {
		// The `handler` variable points to the function that will
		// 1) handle a .then(onFulfilled, onRejected) call
		// 2) handle a .resolve or .reject call (if not fulfilled)
		// Before 2), `handler` holds a queue of callbacks.
		// After 2), `handler` is a simple .then handler.
		// We use only one function to save memory and complexity.
		var handler = function (onFulfilled, onRejected, value) {
			// Case 1) handle a .then(onFulfilled, onRejected) call
			var d;
			if (onFulfilled !== handler) {
				d = createDeferred();
				handler.c.push({ d: d, resolve: onFulfilled, reject: onRejected });
				return d.promise;
			}

			// Case 2) handle a .resolve or .reject call
			// (`onFulfilled` acts as a sentinel)
			// The actual function signature is
			// .re[ject|solve](sentinel, success, value)
			var action = onRejected ? 'resolve' : 'reject',c,deferred,callback;
			for (var i = 0, l = handler.c.length; i < l; i++) {
				c = handler.c[i];
				deferred = c.d;
				callback = c[action];
				if (typeof callback !== func) {
					deferred[action](value);
				} else {
					execute(callback, value, deferred);
				}
			}
			// Replace this handler with a simple resolved or rejected handler
			handler = createHandler(promise, value, onRejected);
		},
		promise = {
			then: function (onFulfilled, onRejected) {
				return handler(onFulfilled, onRejected);
			}
		};
		// The queue of deferreds
		handler.c = [];

		return {
			promise: promise,
			// Only resolve / reject when there is a deferreds queue
			resolve: function (value)	{
				handler.c && handler(handler, true, value);
			},
			reject : function (reason) {
				handler.c && handler(handler, false, reason);
			},
		};
	}

	// Creates a fulfilled or rejected .then function
	function createHandler(promise, value, success) {
		return function (onFulfilled, onRejected) {
			var callback = success ? onFulfilled : onRejected, result;
			if (typeof callback !== func) {
				return promise;
			}
			execute(callback, value, result = createDeferred());
			return result.promise;
		};
	}

	// Executes the callback with the specified value,
	// resolving or rejecting the deferred
	function execute(callback, value, deferred) {
		exports.setImmediate(function () {
			var result;
			try {
				result = callback(value);
				if (result && typeof result.then === func) {
					result.then(deferred.resolve, deferred.reject);
				} else {
					deferred.resolve(result);
				}
			}
			catch (error) {
				deferred.reject(error);
			}
		});
	}
 
	// Returns a resolved promise
	exports.resolve= function (value) {
		var promise = {};
		promise.then = createHandler(promise, value, true);
		return promise;
	};
	// Returns a rejected promise
	exports.reject= function (reason) {
		var promise = {};
		promise.then = createHandler(promise, reason, false);
		return promise;
	};
	// Returns a deferred
	exports.deferred= createDeferred;
	exports.all=function(array){
		var promise = exports.deferred();
		var len = array.length;
		var resolved=0;
		var out = new Array(len);
		var onSuccess=function(n){
			return function(v){
				out[n]=v;
				resolved++;
				if(resolved===len){
					promise.resolve(out);
				}
			};
		};
			array.forEach(function(v,i){
				v.then(onSuccess(i),function(a){
					promise.reject(a);
					});
			});
		return promise.promise;
	};
})(shp);

var binaryAjax = function(url){
	var promise = shp.deferred();
	var ajax = new XMLHttpRequest();
	ajax.onreadystatechange=callback;
	ajax.responseType='arraybuffer';
	ajax.open("GET",url,true);
	ajax.send();
	function callback(resp){
		if(ajax.readyState === 4 && ajax.status === 200) {
			promise.resolve(ajax.response);
		}
	}
	return promise.promise;
}

var parseHeader = function(buffer){
	var view = new DataView(buffer,0,100) 
	//if(view.getInt32(0,false)!==9994){
	//	return shp.reject("wrong type");
	//}
	return /*shp.resolve(*/{
		length : view.getInt32(6<<2,false),
		version : view.getInt32(7<<2,true),
		shpCode : view.getInt32(8<<2,true),
		bbox : [
			view.getFloat64(9<<2,true),
			view.getFloat64(11<<2,true),
			view.getFloat64(13<<2,true),
			view.getFloat64(13<<2,true)
		]
	}/*)*/;
}
var shpFuncs = [
	null,
	function(data){
		return [data.getFloat64(0,true),data.getFloat64(8,true)]
	}
	]
var getRow = function(buffer,offset){
	var view = new DataView(buffer,offset,12);
	var len = view.getInt32(4,false)<<1;
	var data = new DataView(buffer,offset+12,len-4);
	
	return {
		id:view.getInt32(0,false),
		len:len,
		data:data,
		type:view.getInt32(8,true)
	}
}

var getRows = function(buffer,parseShape){
	var offset=100;
	var len = buffer.byteLength;
	var out = {};
	var current;
	while(offset<len){
		current = getRow(buffer,offset);
		offset += 8;
		offset += current.len;
		if(current.type){
			out[current.id]=parseShape(current.data);
		}
	}
	return out;
}

var parseShp = function(buffer){
	var headers = parseHeader(buffer);
	return getRows(buffer,shpFuncs[headers.shpCode]);
}
