/*! shapefile-js 2013-06-19*/
function shp(base){return shp.getShapefile(base);};
/*!From setImmediate Copyright (c) 2012 Barnesandnoble.com,llc, Donavon West, and Domenic Denicola @license MIT https://github.com/NobleJS/setImmediate */
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

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */
 // based on http://google-maps-utility-library-v3.googlecode.com/svn/trunk/arcgislink/docs/examples.html
 //by Nianwei Liu (nianwei at gmail dot com)
(function(exports){
	
function parseWKT(wkt,robj) {
	robj=robj||{};
	var projections = {
		"Lambert Tangential Conformal Conic Projection": "lcc",
		"Lambert_Conformal_Conic": "lcc",
		"Mercator": "merc",
		"Popular Visualisation Pseudo Mercator": "merc",
		"Mercator_1SP": "merc",
		"Transverse_Mercator": "tmerc",
		"Transverse Mercator": "tmerc",
		"Lambert Azimuthal Equal Area": "laea",
		"Universal Transverse Mercator System": "utm"
	};
	var wktMatch = wkt.match(/^(\w+)\[(.*)\]$/);
		if (!wktMatch){
			return;
		}
		var wktObject = wktMatch[1];
		var wktContent = wktMatch[2];
		var wktTemp = wktContent.split(",");
		var wktName;
		if (wktObject.toUpperCase() == "TOWGS84") {
			wktName = wktObject;  //no name supplied for the TOWGS84 array
		} else {
			wktName = wktTemp.shift();
		}
		wktName = wktName.replace(/^\"/,"");
		wktName = wktName.replace(/\"$/,"");

		var wktArray = [];
		var bkCount = 0;
		var obj = "";
		var token;
		for (var i=0, len = wktTemp.length; i<len; ++i) {
			token = wktTemp[i];
			for (var j=0; j<token.length; ++j) {
				if (token.charAt(j) == "["){
					++bkCount;
				}
				if (token.charAt(j) == "]"){
					--bkCount;
				}
			}
			obj += token;
			if (bkCount === 0) {
				wktArray.push(obj);
				obj = "";
			} else {
				obj += ",";
			}
		}

		//do something based on the type of the wktObject being parsed
		//add in variations in the spelling as required
		switch (wktObject) {
			case 'LOCAL_CS':
				robj.projName = 'identity';
				robj.localCS = true;
				robj.srsCode = wktName;
				break;
			case 'GEOGCS':
				robj.projName = 'longlat';
				robj.geocsCode = wktName;
				if (!robj.srsCode){
					robj.srsCode = wktName;
				}
				break;
			case 'PROJCS':
				robj.srsCode = wktName;
				break;
			case 'GEOCCS':
				break;
			case 'PROJECTION':
				robj.projName = projections[wktName];
				break;
			case 'DATUM':
				robj.datumName = wktName;
				break;
			case 'LOCAL_DATUM':
				robj.datumCode = 'none';
				break;
			case 'SPHEROID':
				robj.ellps = wktName;
				robj.a = parseFloat(wktArray.shift());
				robj.rf = parseFloat(wktArray.shift());
				break;
			case 'PRIMEM':
				robj.from_greenwich = parseFloat(wktArray.shift()); //to radians?
				break;
			case 'UNIT':
				robj.unitName = wktName;
				robj.unit = parseFloat(wktArray.shift());
				break;
			case 'PARAMETER':
				var name = wktName.toLowerCase();
				var value = parseFloat(wktArray.shift());
				//there may be many variations on the wktName values, add in case
				//statements as required
				switch (name) {
					case 'false_easting':
						robj.x0 = value;
						break;
					case 'false_northing':
						robj.y0 = value;
						break;
					case 'scale_factor':
						robj.k0 = value;
						break;
					case 'central_meridian':
						robj.long0 = value;
						break;
					case 'latitude_of_origin':
						robj.lat0 = value;
						break;
					case 'standard_parallel_1':
						robj.sp1=value;
						break;
					case 'standard_parallel_2':
						robj.sp2=value;
						break;
					default:
						break;
					}
				break;
			case 'TOWGS84':
				robj.datum_params = wktArray;
				break;
				//DGR 2010-11-12: AXIS
			case 'AXIS':
				var axisName= wktName.toLowerCase();
				var axisValue= wktArray.shift();
				switch (value) {
					case 'EAST' :
						axisValue= 'e';
						break;
					case 'WEST' :
						axisValue= 'w';
						break;
					case 'NORTH':
						axisValue= 'n';
						break;
					case 'SOUTH':
						axisValue= 's';
						break;
					case 'UP'   :
						axisValue= 'u';
						break;
					case 'DOWN' : 
						axisValue= 'd';
						break;
					//case 'OTHER': 
					default : 
						axisValue= ' ';
						break;//
				}
				if (!robj.axis) {
					robj.axis= "enu";
				}
				switch(axisName) {
					case 'x':
						robj.axis= axisValue + robj.axis.substr(1,2);
						break;
					case 'y':
						robj.axis= robj.axis.substr(0,1) + axisValue + robj.axis.substr(2,1);
						break;
					case 'z':
						robj.axis = robj.axis.substr(0,2) + axisValue;
						break;
					default :
						break;
				}
			break;
		case 'MORE_HERE':
			break;
		default:
			break;
	}
	for (var ji=0,lenj=wktArray.length; ji<lenj; ++ji) {
		parseWKT(wktArray[ji],robj);
	}
	return robj;
}
function lcc(params){
	/*
	based off http://gmaps-utility-gis.googlecode.com/svn/trunk/v3samples/customprojection.html
	*/

	/*=========parameters=================*/

	params=params||{};

	var _a = (params.a ||6378137.0 )/(params.unit||0.3048006096012192);
	var _f_i=params.rf||298.257222101;//this.
	var _phi1 = (params.sp1||34.33333333333334) * (Math.PI / 180);
	var _phi2 = (params.sp2||36.16666666666666) * (Math.PI / 180);
	var _phiF = (params.lat0||33.75) * (Math.PI / 180);
	var _lamdaF = (params.long0||-79.0)* (Math.PI / 180);
	var _FE = params.x0||2000000.002616666;//this.
	var _FN = params.y0||0.0;//this.
	/*========== functions to calc values, potentially can move outside as static methods=========*/
	var calc_m = function(phi, es){
		var sinphi = Math.sin(phi);
			return Math.cos(phi) / Math.sqrt(1 - es * sinphi * sinphi);
		};

	var calc_t = function(phi, e){
		var esinphi = e * Math.sin(phi);
		return Math.tan(Math.PI / 4 - phi / 2) / Math.pow((1 - esinphi) / (1 + esinphi), e / 2);
	};
	var calc_r = function(a, F, t, n){
		return a * F * Math.pow(t, n);
	};
	var calc_phi = function(t_i, e, phi){
		var esinphi = e * Math.sin(phi);
		return Math.PI / 2 - 2 * Math.atan(t_i * Math.pow((1 - esinphi) / (1 + esinphi), e / 2));
	};
	var solve_phi = function(t_i, e, init){
		// iteration
		var i = 0;
		var phi = init;
		var newphi = calc_phi(t_i, e, phi);//this.
		while (Math.abs(newphi - phi) > 0.000000001 && i++ < 10) {
			phi = newphi;
			newphi = calc_phi(t_i, e, phi);//this.
		}
		return newphi;
	};
	/*=========shared, not point specific params or intermediate values========*/
	var _f = 1.0 /_f_i;//this.
	/*e: eccentricity of the ellipsoid where e^2 = 2f - f^2 */
	var _es = 2 * _f - _f * _f;
	var _e = Math.sqrt(_es);
	var _m1 = calc_m(_phi1, _es);//this.
	var _m2 = calc_m(_phi2, _es);//this.
	var _tF = calc_t(_phiF, _e);//this.
	var _t1 = calc_t(_phi1, _e);//this.
	var _t2 = calc_t(_phi2, _e);//this.
	var _n = Math.log(_m1 / _m2) / Math.log(_t1 / _t2);
	var _F = _m1 / (_n * Math.pow(_t1, _n));
	var _rF = calc_r(_a, _F, _tF, _n);//this.
   /**

	* convert lat lng to coordinates 

	* @param {Array<double>} latlng array with 2 double: [lat,lng]

 */

	return function(xy){
		var E = xy[0];
		var N = xy[1];
		var theta_i = Math.atan((E - _FE) / (_rF - (N - _FN)));
		var r_i = (_n > 0 ? 1 : -1) * Math.sqrt((E - _FE) * (E - _FE) + (_rF - (N - _FN)) * (_rF - (N - _FN)));
		var t_i = Math.pow((r_i / (_a * _F)), 1 / _n);
		var phi = solve_phi(t_i, _e, 0);
		var lamda = theta_i / _n + _lamdaF;
		return  [lamda * (180 / Math.PI),phi * (180 / Math.PI)];
	


}
}
// from http://gmaps-utility-gis.googlecode.com/svn/trunk/arcgislink/src/arcgislink_code.js apache lisensed
function tmerc(params) {
	var RAD_DEG = (Math.PI / 180);
	params = params || {};
	var _a = (params.a ||6378137.0 )/(params.unit||0.3048006096012192);
	var f_i=params.rf||298.257222101;//this.
	var _k0 = params.k0;
	var phi0 = (params.lat0||33.75) * RAD_DEG;
	var _lamda0 =(params.long0||-79.0)* RAD_DEG;
	var _FE = params.x0||2000000.002616666;
	var _FN =  params.y0||0.0;//this.
	var f = 1.0 / f_i;//this.
	/*e: eccentricity of the ellipsoid where e^2  =  2f - f^2 */
	var _es = 2 * f - f * f;
	//var _e  =  Math.sqrt(_es);
	/* e^4 */
	var _ep4 = _es * _es;
	/* e^6 */
	var _ep6 = _ep4 * _es;
	/* e'  second eccentricity where e'^2  =  e^2 / (1-e^2) */
	var _eas = _es / (1 - _es);
	function _calc_m(phi, a, es, ep4, ep6) {
		return a * ((1 - es / 4 - 3 * ep4 / 64 - 5 * ep6 / 256) * phi - (3 * es / 8 + 3 * ep4 / 32 + 45 * ep6 / 1024) * Math.sin(2 * phi) + (15 * ep4 / 256 + 45 * ep6 / 1024) * Math.sin(4 * phi) - (35 * ep6 / 3072) * Math.sin(6 * phi));
	}
	var _M0 = _calc_m(phi0, _a, _es, _ep4, _ep6);
	return function(coords) {
		var E = coords[0];
		var N = coords[1];
		var e1 = (1 - Math.sqrt(1 - _es)) / (1 + Math.sqrt(1 - _es));
		var M1 = _M0 + (N - _FN) / _k0;
		var mu1 = M1 / (_a * (1 - _es / 4 - 3 * _ep4 / 64 - 5 * _ep6 / 256));
		var phi1 = mu1 + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu1) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu1) + (151 * Math.pow(e1, 3) / 6) * Math.sin(6 * mu1) + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu1);
		var C1 = _eas * Math.pow(Math.cos(phi1), 2);
		var T1 = Math.pow(Math.tan(phi1), 2);
		var N1 = _a / Math.sqrt(1 - _es * Math.pow(Math.sin(phi1), 2));
		var R1 = _a * (1 - _es) / Math.pow((1 - _es * Math.pow(Math.sin(phi1), 2)), 3 / 2);
		var D = (E - _FE) / (N1 * _k0);
		var phi = phi1 - (N1 * Math.tan(phi1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * _eas) * Math.pow(D, 4) / 24 + (61 + 90 * T1 + 28 * C1 + 45 * T1 * T1 - 252 * _eas - 3 * C1 * C1) * Math.pow(D, 6) / 720);
		var lamda = _lamda0 + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * _eas + 24 * T1 * T1) * Math.pow(D, 5) / 120) / Math.cos(phi1);
		return [lamda / RAD_DEG, phi / RAD_DEG];
	};
}
var projes = {};
projes.lcc = lcc;
projes.tmerc = tmerc;

exports.proj = function(wkt){
	var projObj = parseWKT(wkt);
	var projection = projes[projObj.projName];
	if(projection){
		return projection(projObj);
	}
};

})(shp);

(function(exports){
'use strict';
shp.binaryAjax = function(url){
    var promise = shp.deferred();
	var ajax = new XMLHttpRequest();
	ajax.onreadystatechange=callback;
	ajax.open("GET",url,true);
	ajax.responseType='arraybuffer';
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
	if(isClockWise(b)){
		a.push([b]);
	}else{
		a[a.length-1].push(b);
	}
	return a;
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
function parseArrayGroup(data,offset,partOffset,num,tot,trans){
	var out = [];
	var done = 0;
	var curNum,nextNum=0,pointNumber;
	while(done<num){
		done++
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
function parsePolygon(data,trans){
	var out = parsePolyline(data,trans);
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
var shpFuncs = [
	null,
	function(data,trans){
		return {
			"type": "Point",
			"coordinates":trans(data,0)
		};
	},
	null,
	parsePolyline,
	null,
	parsePolygon,
	null,
	null,
	parseMultiPoint
	];
	
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

var getRows = function(buffer,parseShape,trans){
	var offset=100;
	var len = buffer.byteLength;
	var out = [];
	var current;
	while(offset<len){
		current = getRow(buffer,offset);
		offset += 8;
		offset += current.len;
		if(current.type){
			out.push(parseShape(current.data,trans));
		}
	}
	return out;
};
function makeParsePoint(trans){
	if(trans){
		return function(data,offset){
			return trans([data.getFloat64(offset,true),data.getFloat64(offset+8,true)]);
		}
	}else{
		return function(data,offset){
			return [data.getFloat64(offset,true),data.getFloat64(offset+8,true)];
		}
	}
}
shp.parseShp = function(buffer,trans){
	var headers = parseHeader(buffer);
	return getRows(buffer,shpFuncs[headers.shpCode],makeParsePoint(trans));
};

function dbfHeader(buffer){
    var data = new DataView(buffer);
	var out = {}
	out.lastUpdated = new Date(data.getUint8(1,true)+1900,data.getUint8(2,true),data.getUint8(3,true));
	out.records = data.getUint32(4,true);
	out.headerLen = data.getUint16(8,true);
	out.recLen = data.getUint16(10,true)
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
var rowFuncs = function(buffer,offset,len,type){
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
shp.parseDbf = function(buffer){
	var rowHeaders = dbfRowHeader(buffer);
	var header = dbfHeader(buffer);
	var offset = ((rowHeaders.length+1)<<5)+2;
	var recLen = header.recLen;
	var records = header.records;
	var data = new DataView(buffer);
	var out = [];
	while(records){
		out.push(parseRow(buffer,offset,rowHeaders));
		offset += recLen;
		records--;
	}
	return out;
}
shp.combine=function(arr){
	var out = {};
	out.type="FeatureCollection";
	out.features=[];
	var i = 0;
	var len = arr[0].length;
	while(i<len){
		out.features.push({
			"type": "Feature",
			"geometry": arr[0][i],
			"properties": arr[1][i]
		});
		i++;
	}
	return out;
}
shp.parseZip = function(buffer){
		var key;
		var zip=shp.unzip(buffer);
		var names = [];
		for(key in zip){
			if(key.slice(-3)==="shp"){
				names.push(key.slice(0,-4));
			}else if(key.slice(-3)==="dbf"){
				zip[key]=shp.parseDbf(zip[key]);
			}else if(key.slice(-3)==="prj"){
				zip[key]=shp.proj(String.fromCharCode.apply(this,new Uint8Array(zip[key])));
			}
		}
	var geojson = {}
	names.forEach(function(name){
		geojson[name] = shp.combine([shp.parseShp(zip[name +'.shp'],zip[name +'.prj']),zip[name +'.dbf']]);
	});
	if(Object.keys(geojson).length === 1){
		return geojson[Object.keys(geojson)];
	}else{
		return geojson;
	}
};
function getZip(base){
	return shp.binaryAjax(base).then(shp.parseZip);
}
shp.getShapefile = function(base){
	if(base.slice(-4)==='.zip'){
		return getZip(base);
	}else{ 
	return shp.all([
		shp.binaryAjax(base+'.shp').then(shp.parseShp),
		shp.binaryAjax(base+'.dbf').then(shp.parseDbf)
	]).then(shp.combine)}
	}
})(shp);
shp.unzip=function(buffer){
    
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

JSZip.signature = {
   LOCAL_FILE_HEADER : "\x50\x4b\x03\x04",
   CENTRAL_FILE_HEADER : "\x50\x4b\x01\x02",
   CENTRAL_DIRECTORY_END : "\x50\x4b\x05\x06",
   ZIP64_CENTRAL_DIRECTORY_LOCATOR : "\x50\x4b\x06\x07",
   ZIP64_CENTRAL_DIRECTORY_END : "\x50\x4b\x06\x06",
   DATA_DESCRIPTOR : "\x50\x4b\x07\x08"
};

// Default properties for a new file
JSZip.defaults = {
   base64: false,
   binary: false,
   dir: false,
   date: null,
   compression: null
};


JSZip.prototype = (function () {
   /**
    * A simple object representing a file in the zip file.
    * @constructor
    * @param {string} name the name of the file
    * @param {string} data the data
    * @param {Object} options the options of the file
    */
   var ZipObject = function (name, data, options) {
      this.name = name;
      this.data = data;
      this.options = options;
   };

   ZipObject.prototype = {
      /**
       * Return the content as UTF8 string.
       * @return {string} the UTF8 string.
       */
      asText : function () {
         var result = this.data;
         if (result === null || typeof result === "undefined") {
            return "";
         }
         if (this.options.base64) {
            result = JSZipBase64.decode(result);
         }
         if (this.options.binary) {
            result = JSZip.prototype.utf8decode(result);
         }
         return result;
      },
      /**
       * Returns the binary content.
       * @return {string} the content as binary.
       */
      asBinary : function () {
         var result = this.data;
         if (result === null || typeof result === "undefined") {
            return "";
         }
         if (this.options.base64) {
            result = JSZipBase64.decode(result);
         }
         if (!this.options.binary) {
            result = JSZip.prototype.utf8encode(result);
         }
         return result;
      },
      /**
       * Returns the content as an Uint8Array.
       * @return {Uint8Array} the content as an Uint8Array.
       */
      asUint8Array : function () {
         return JSZip.utils.string2Uint8Array(this.asBinary());
      },
      /**
       * Returns the content as an ArrayBuffer.
       * @return {ArrayBuffer} the content as an ArrayBufer.
       */
      asArrayBuffer : function () {
         return JSZip.utils.string2Uint8Array(this.asBinary()).buffer;
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
      var hex = "", i;
      for(i = 0; i < bytes; i++) {
         hex += String.fromCharCode(dec&0xff);
         dec=dec>>>8;
      }
      return hex;
   };

   /**
    * Merge the objects passed as parameters into a new one.
    * @private
    * @param {...Object} var_args All objects to merge.
    * @return {Object} a new object with the data of the others.
    */
   var extend = function () {
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
   var prepareFileAttrs = function (o) {
      o = o || {};
      if (o.base64 === true && o.binary == null) {
         o.binary = true;
      }
      o = extend(o, JSZip.defaults);
      o.date = o.date || new Date();
      if (o.compression !== null) o.compression = o.compression.toUpperCase();

      return o;
   };

  /**
   * Add a file in the current folder.
   * @private
   * @param {string} name the name of the file
   * @param {String|ArrayBuffer|Uint8Array} data the data of the file
   * @param {Object} o the options of the file
   * @return {Object} the new file.
   */
   var fileAdd = function (name, data, o) {
      // be sure sub folders exist
      var parent = parentFolder(name);
      if (parent) {
         folderAdd.call(this, parent);
      }

      o = prepareFileAttrs(o);

      if (o.dir || data === null || typeof data === "undefined") {
         o.base64 = false;
         o.binary = false;
         data = null;
      } else if (JSZip.support.uint8array && data instanceof Uint8Array) {
         o.base64 = false;
         o.binary = true;
         data = JSZip.utils.uint8Array2String(data);
      } else if (JSZip.support.arraybuffer && data instanceof ArrayBuffer) {
         o.base64 = false;
         o.binary = true;
         var bufferView = new Uint8Array(data);
         data = JSZip.utils.uint8Array2String(bufferView);
      } else if (o.binary && !o.base64) {
         // optimizedBinaryString == true means that the file has already been filtered with a 0xFF mask
         if (o.optimizedBinaryString !== true) {
            // this is a string, not in a base64 format.
            // Be sure that this is a correct "binary string"
            data = JSZip.utils.string2binary(data);
         }
         // we remove this option since it's only relevant here
         delete o.optimizedBinaryString;
      }

      return this.files[name] = new ZipObject(name, data, o);
   };


   /**
    * Find the parent folder of the path.
    * @private
    * @param {string} path the path to use
    * @return {string} the parent folder, or ""
    */
   var parentFolder = function (path) {
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
   var folderAdd = function (name) {
      // Check the name ends with a /
      if (name.slice(-1) != "/") {
         name += "/"; // IE doesn't like substr(-1)
      }

      // Does this folder already exist?
      if (!this.files[name]) {
         // be sure sub folders exist
         var parent = parentFolder(name);
         if (parent) {
            folderAdd.call(this, parent);
         }

         fileAdd.call(this, name, null, {dir:true});
      }
      return this.files[name];
   };

   /**
    * Generate the data found in the local header of a zip file.
    * Do not create it now, as some parts are re-used later.
    * @private
    * @param {Object} file the file to use.
    * @param {string} utfEncodedFileName the file name, utf8 encoded.
    * @param {string} compressionType the compression to use.
    * @return {Object} an object containing header and compressedData.
    */
   var prepareLocalHeaderData = function(file, utfEncodedFileName, compressionType) {
      var useUTF8 = utfEncodedFileName !== file.name,
          data    = file.asBinary(),
          o       = file.options,
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

      var hasData = data !== null && data.length !== 0;

      compressionType = o.compression || compressionType;
      if (!JSZip.compressions[compressionType]) {
         throw compressionType + " is not a valid compression method !";
      }

      var compression    = JSZip.compressions[compressionType];
      var compressedData = hasData ? compression.compress(data) : '';

      var header = "";

      // version needed to extract
      header += "\x0A\x00";
      // general purpose bit flag
      // set bit 11 if utf8
      header += useUTF8 ? "\x00\x08" : "\x00\x00";
      // compression method
      header += hasData ? compression.magic : JSZip.compressions['STORE'].magic;
      // last mod file time
      header += decToHex(dosTime, 2);
      // last mod file date
      header += decToHex(dosDate, 2);
      // crc-32
      header += hasData ? decToHex(this.crc32(data), 4) : '\x00\x00\x00\x00';
      // compressed size
      header += hasData ? decToHex(compressedData.length, 4) : '\x00\x00\x00\x00';
      // uncompressed size
      header += hasData ? decToHex(data.length, 4) : '\x00\x00\x00\x00';
      // file name length
      header += decToHex(utfEncodedFileName.length, 2);
      // extra field length
      header += "\x00\x00";

      return {
         header:header,
         compressedData:compressedData
      };
   };


   // return the actual prototype of JSZip
   return {
      /**
       * Read an existing zip and merge the data in the current JSZip object.
       * The implementation is in jszip-load.js, don't forget to include it.
       * @param {String|ArrayBuffer|Uint8Array} stream  The stream to load
       * @param {Object} options Options for loading the stream.
       *  options.base64 : is the stream in base64 ? default : false
       * @return {JSZip} the current JSZip object
       */
      load : function (stream, options) {
         throw new Error("Load method is not defined. Is the file jszip-load.js included ?");
      },

      /**
       * Filter nested files/folders with the specified function.
       * @param {Function} search the predicate to use :
       * function (relativePath, file) {...}
       * It takes 2 arguments : the relative path and the file.
       * @return {Array} An array of matching elements.
       */
      filter : function (search) {
         var result = [], filename, relativePath, file, fileClone;
         for (filename in this.files) {
            if ( !this.files.hasOwnProperty(filename) ) { continue; }
            file = this.files[filename];
            // return a new object, don't let the user mess with our internal objects :)
            fileClone = new ZipObject(file.name, file.data, extend(file.options));
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
       * @param   {String|ArrayBuffer|Uint8Array} data  The file data, either raw or base64 encoded
       * @param   {Object} o     File options
       * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
       * a file (when searching by string) or an array of files (when searching by regex).
       */
      file : function(name, data, o) {
         if (arguments.length === 1) {
            if (name instanceof RegExp) {
               var regexp = name;
               return this.filter(function(relativePath, file) {
                  return !file.options.dir && regexp.test(relativePath);
               });
            } else { // text
               return this.filter(function (relativePath, file) {
                  return !file.options.dir && relativePath === name;
               })[0]||null;
            }
         } else { // more than one argument : we have data !
            name = this.root+name;
            fileAdd.call(this, name, data, o);
         }
         return this;
      },

      /**
       * Add a directory to the zip file, or search.
       * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
       * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
       */
      folder : function(arg) {
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
      remove : function(name) {
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
            } else {
               // folder
               var kids = this.filter(function (relativePath, file) {
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
       * @return {String|Uint8Array|ArrayBuffer|Blob} the zip file
       */
      generate : function(options) {
         options = extend(options || {}, {
            base64 : true,
            compression : "STORE",
            type : "base64"
         });
         var compression = options.compression.toUpperCase();

         if (!JSZip.compressions[compression]) {
            throw compression + " is not a valid compression method !";
         }

         // The central directory, and files data
         var directory = [], files = [], fileOffset = 0;

         for (var name in this.files) {
            if ( !this.files.hasOwnProperty(name) ) { continue; }

            var file = this.files[name];

            var utfEncodedFileName = this.utf8encode(file.name);

            var fileRecord = "",
            dirRecord = "",
            data = prepareLocalHeaderData.call(this, file, utfEncodedFileName, compression);
            fileRecord = JSZip.signature.LOCAL_FILE_HEADER + data.header + utfEncodedFileName + data.compressedData;

            dirRecord = JSZip.signature.CENTRAL_FILE_HEADER +
            // version made by (00: DOS)
            "\x14\x00" +
            // file header (common to file and central directory)
            data.header +
            // file comment length
            "\x00\x00" +
            // disk number start
            "\x00\x00" +
            // internal file attributes TODO
            "\x00\x00" +
            // external file attributes
            (this.files[name].options.dir===true?"\x10\x00\x00\x00":"\x00\x00\x00\x00")+
            // relative offset of local header
            decToHex(fileOffset, 4) +
            // file name
            utfEncodedFileName;

            fileOffset += fileRecord.length;

            files.push(fileRecord);
            directory.push(dirRecord);
         }

         var fileData = files.join("");
         var dirData = directory.join("");

         var dirEnd = "";

         // end of central dir signature
         dirEnd = JSZip.signature.CENTRAL_DIRECTORY_END +
         // number of this disk
         "\x00\x00" +
         // number of the disk with the start of the central directory
         "\x00\x00" +
         // total number of entries in the central directory on this disk
         decToHex(files.length, 2) +
         // total number of entries in the central directory
         decToHex(files.length, 2) +
         // size of the central directory   4 bytes
         decToHex(dirData.length, 4) +
         // offset of start of central directory with respect to the starting disk number
         decToHex(fileData.length, 4) +
         // .ZIP file comment length
         "\x00\x00";

         var zip = fileData + dirData + dirEnd;


         switch(options.type.toLowerCase()) {
            case "uint8array" :
               return JSZip.utils.string2Uint8Array(zip);
            case "arraybuffer" :
               return JSZip.utils.string2Uint8Array(zip).buffer;
            case "blob" :
               return JSZip.utils.string2Blob(zip);
            case "base64" :
               return (options.base64) ? JSZipBase64.encode(zip) : zip;
            default : // case "string" :
               return zip;
         }
      },

      /**
       *
       *  Javascript crc32
       *  http://www.webtoolkit.info/
       *
       */
      crc32 : function(str, crc) {

         if (str === "" || typeof str === "undefined") {
            return 0;
         }

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
            0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
         ];

         if (typeof(crc) == "undefined") { crc = 0; }
         var x = 0;
         var y = 0;

         crc = crc ^ (-1);
         for( var i = 0, iTop = str.length; i < iTop; i++ ) {
            y = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
            x = table[y];
            crc = ( crc >>> 8 ) ^ x;
         }

         return crc ^ (-1);
      },

      // Inspired by http://my.opera.com/GreyWyvern/blog/show.dml/1725165
      clone : function() {
         var newObj = new JSZip();
         for (var i in this) {
            if (typeof this[i] !== "function") {
               newObj[i] = this[i];
            }
         }
         return newObj;
      },


      /**
       * http://www.webtoolkit.info/javascript-utf8.html
       */
      utf8encode : function (string) {
         var utftext = "";

         for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
               utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
               utftext += String.fromCharCode((c >> 6) | 192);
               utftext += String.fromCharCode((c & 63) | 128);
            } else {
               utftext += String.fromCharCode((c >> 12) | 224);
               utftext += String.fromCharCode(((c >> 6) & 63) | 128);
               utftext += String.fromCharCode((c & 63) | 128);
            }

         }

         return utftext;
      },

      /**
       * http://www.webtoolkit.info/javascript-utf8.html
       */
      utf8decode : function (utftext) {
         var string = "";
         var i = 0;
         var c = 0, c1 = 0, c2 = 0, c3 = 0;

         while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
               string += String.fromCharCode(c);
               i++;
            } else if ((c > 191) && (c < 224)) {
               c2 = utftext.charCodeAt(i+1);
               string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
               i += 2;
            } else {
               c2 = utftext.charCodeAt(i+1);
               c3 = utftext.charCodeAt(i+2);
               string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
               i += 3;
            }

         }

         return string;
      }
   };
}());

/*
 * Compression methods
 * This object is filled in as follow :
 * name : {
 *    magic // the 2 bytes indentifying the compression method
 *    compress // function, take the uncompressed content and return it compressed.
 *    uncompress // function, take the compressed content and return it uncompressed.
 * }
 *
 * STORE is the default compression method, so it's included in this file.
 * Other methods should go to separated files : the user wants modularity.
 */
JSZip.compressions = {
   "STORE" : {
      magic : "\x00\x00",
      compress : function (content) {
         return content; // no compression
      },
      uncompress : function (content) {
         return content; // no compression
      }
   }
};

/*
 * List features that require a modern browser, and if the current browser support them.
 */
JSZip.support = {
   // contains true if JSZip can read/generate ArrayBuffer, false otherwise.
   arraybuffer : (function(){
      return typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
   })(),
   // contains true if JSZip can read/generate Uint8Array, false otherwise.
   uint8array : (function(){
      return typeof Uint8Array !== "undefined";
   })(),
   // contains true if JSZip can read/generate Blob, false otherwise.
   blob : (function(){
      // the spec started with BlobBuilder then replaced it with a construtor for Blob.
      // Result : we have browsers that :
      // * know the BlobBuilder (but with prefix)
      // * know the Blob constructor
      // * know about Blob but not about how to build them
      // About the "=== 0" test : if given the wrong type, it may be converted to a string.
      // Instead of an empty content, we will get "[object Uint8Array]" for example.
      if (typeof ArrayBuffer === "undefined") {
         return false;
      }
      var buffer = new ArrayBuffer(0);
      try {
         return new Blob([buffer], { type: "application/zip" }).size === 0;
      }
      catch(e) {}

      try {
         var builder = new (window.BlobBuilder || window.WebKitBlobBuilder ||
                            window.MozBlobBuilder || window.MSBlobBuilder)();
         builder.append(buffer);
         return builder.getBlob('application/zip').size === 0;
      }
      catch(e) {}

      return false;
   })()
};

JSZip.utils = {
   /**
    * Convert a string to a "binary string" : a string containing only char codes between 0 and 255.
    * @param {string} str the string to transform.
    * @return {String} the binary string.
    */
   string2binary : function (str) {
      var result = "";
      for (var i = 0; i < str.length; i++) {
         result += String.fromCharCode(str.charCodeAt(i) & 0xff);
      }
      return result;
   },
   /**
    * Create a Uint8Array from the string.
    * @param {string} str the string to transform.
    * @return {Uint8Array} the typed array.
    * @throws {Error} an Error if the browser doesn't support the requested feature.
    */
   string2Uint8Array : function (str) {
      if (!JSZip.support.uint8array) {
         throw new Error("Uint8Array is not supported by this browser");
      }
      var buffer = new ArrayBuffer(str.length);
      var bufferView = new Uint8Array(buffer);
      for(var i = 0; i < str.length; i++) {
         bufferView[i] = str.charCodeAt(i);
      }

      return bufferView;
   },

   /**
    * Create a string from the Uint8Array.
    * @param {Uint8Array} array the array to transform.
    * @return {string} the string.
    * @throws {Error} an Error if the browser doesn't support the requested feature.
    */
   uint8Array2String : function (array) {
      if (!JSZip.support.uint8array) {
         throw new Error("Uint8Array is not supported by this browser");
      }
      var result = "";
      for(var i = 0; i < array.length; i++) {
         result += String.fromCharCode(array[i]);
      }

      return result;
   },
   /**
    * Create a blob from the given string.
    * @param {string} str the string to transform.
    * @return {Blob} the string.
    * @throws {Error} an Error if the browser doesn't support the requested feature.
    */
   string2Blob : function (str) {
      if (!JSZip.support.blob) {
         throw new Error("Blob is not supported by this browser");
      }

      var buffer = JSZip.utils.string2Uint8Array(str).buffer;
      try {
         // Blob constructor
         return new Blob([buffer], { type: "application/zip" });
      }
      catch(e) {}

      try {
         // deprecated, browser only, old way
         var builder = new (window.BlobBuilder || window.WebKitBlobBuilder ||
                            window.MozBlobBuilder || window.MSBlobBuilder)();
         builder.append(buffer);
         return builder.getBlob('application/zip');
      }
      catch(e) {}

      // well, fuck ?!
      throw new Error("Bug : can't construct the Blob.");
   }
};

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 *  Hacked so that it doesn't utf8 en/decode everything
 **/
var JSZipBase64 = (function() {
   // private property
   var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

   return {
      // public method for encoding
      encode : function(input, utf8) {
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
            } else if (isNaN(chr3)) {
               enc4 = 64;
            }

            output = output +
               _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
               _keyStr.charAt(enc3) + _keyStr.charAt(enc4);

         }

         return output;
      },

      // public method for decoding
      decode : function(input, utf8) {
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

      }
   };
}());

/**

JSZip - A Javascript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2011 David Duponchel <d.duponchel@gmail.com>
Dual licenced under the MIT license or GPLv3. See LICENSE.markdown.

**/
/*global JSZip,JSZipBase64 */
(function () {

   var MAX_VALUE_16BITS = 65535;
   var MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

   /**
    * Prettify a string read as binary.
    * @param {string} str the string to prettify.
    * @return {string} a pretty string.
    */
   var pretty = function (str) {
      var res = '', code, i;
      for (i = 0; i < (str||"").length; i++) {
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
   var findCompression = function (compressionMethod) {
      for (var method in JSZip.compressions) {
         if( !JSZip.compressions.hasOwnProperty(method) ) { continue; }
         if (JSZip.compressions[method].magic === compressionMethod) {
            return JSZip.compressions[method];
         }
      }
      return null;
   };

   // class StreamReader {{{
   /**
    * Read bytes from a stream.
    * Developer tip : when debugging, a watch on pretty(this.reader.stream.slice(this.reader.index))
    * is very useful :)
    * @constructor
    * @param {String|ArrayBuffer|Uint8Array} stream the stream to read.
    */
   function StreamReader(stream) {
      this.stream = "";
      if (JSZip.support.uint8array && stream instanceof Uint8Array) {
         this.stream = JSZip.utils.uint8Array2String(stream);
      } else if (JSZip.support.arraybuffer && stream instanceof ArrayBuffer) {
         var bufferView = new Uint8Array(stream);
         this.stream = JSZip.utils.uint8Array2String(bufferView);
      } else {
         this.stream = JSZip.utils.string2binary(stream);
      }
      this.index = 0;
   }
   StreamReader.prototype = {
      /**
       * Check that the offset will not go too far.
       * @param {string} offset the additional offset to check.
       * @throws {Error} an Error if the offset is out of bounds.
       */
      checkOffset : function (offset) {
         this.checkIndex(this.index + offset);
      },
      /**
       * Check that the specifed index will not be too far.
       * @param {string} newIndex the index to check.
       * @throws {Error} an Error if the index is out of bounds.
       */
      checkIndex : function (newIndex) {
         if (this.stream.length < newIndex || newIndex < 0) {
            throw new Error("End of stream reached (stream length = " +
                            this.stream.length + ", asked index = " +
                            (newIndex) + "). Corrupted zip ?");
         }
      },
      /**
       * Change the index.
       * @param {number} newIndex The new index.
       * @throws {Error} if the new index is out of the stream.
       */
      setIndex : function (newIndex) {
         this.checkIndex(newIndex);
         this.index = newIndex;
      },
      /**
       * Skip the next n bytes.
       * @param {number} n the number of bytes to skip.
       * @throws {Error} if the new index is out of the stream.
       */
      skip : function (n) {
         this.setIndex(this.index + n);
      },
      /**
       * Get the byte at the specified index.
       * @param {number} i the index to use.
       * @return {number} a byte.
       */
      byteAt : function(i) {
         return this.stream.charCodeAt(i);
      },
      /**
       * Get the next number with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {number} the corresponding number.
       */
      readInt : function (size) {
         var result = 0, i;
         this.checkOffset(size);
         for(i = this.index + size - 1; i >= this.index; i--) {
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
      readString : function (size) {
         this.checkOffset(size);
         // this will work because the constructor applied the "& 0xff" mask.
         var result = this.stream.slice(this.index, this.index + size);
         this.index += size;
         return result;
      },
      /**
       * Get the next date.
       * @return {Date} the date.
       */
      readDate : function () {
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
   // }}} end of StreamReader

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
      isEncrypted : function () {
         // bit 1 is set
         return (this.bitFlag & 0x0001) === 0x0001;
      },
      /**
       * say if the file has utf-8 filename/comment.
       * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
       */
      useUTF8 : function () {
         // bit 11 is set
         return (this.bitFlag & 0x0800) === 0x0800;
      },
      /**
       * Read the local part of a zip file and add the info in this object.
       * @param {StreamReader} reader the reader to use.
       */
      readLocalPart : function(reader) {
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
            throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory " +
                            "(compressedSize == -1 || uncompressedSize == -1)");
         }
         this.compressedFileData = reader.readString(this.compressedSize);

         compression = findCompression(this.compressionMethod);
         if (compression === null) { // no compression found
            throw new Error("Corrupted zip : compression " + pretty(this.compressionMethod) +
                            " unknown (inner file : " + this.fileName + ")");
         }
         this.uncompressedFileData = compression.uncompress(this.compressedFileData);

         if (this.uncompressedFileData.length !== this.uncompressedSize) {
            throw new Error("Bug : uncompressed data size mismatch");
         }

         if (this.loadOptions.checkCRC32 && JSZip.prototype.crc32(this.uncompressedFileData) !== this.crc32) {
            throw new Error("Corrupted zip : CRC32 mismatch");
         }
      },

      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {StreamReader} reader the reader to use.
       */
      readCentralPart : function(reader) {
         this.versionMadeBy          = reader.readString(2);
         this.versionNeeded          = reader.readInt(2);
         this.bitFlag                = reader.readInt(2);
         this.compressionMethod      = reader.readString(2);
         this.date                   = reader.readDate();
         this.crc32                  = reader.readInt(4);
         this.compressedSize         = reader.readInt(4);
         this.uncompressedSize       = reader.readInt(4);
         this.fileNameLength         = reader.readInt(2);
         this.extraFieldsLength      = reader.readInt(2);
         this.fileCommentLength      = reader.readInt(2);
         this.diskNumberStart        = reader.readInt(2);
         this.internalFileAttributes = reader.readInt(2);
         this.externalFileAttributes = reader.readInt(4);
         this.localHeaderOffset      = reader.readInt(4);

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
       * @param {StreamReader} reader the reader to use.
       */
      parseZIP64ExtraField : function(reader) {

         if(!this.extraFields[0x0001]) {
            return;
         }

         // should be something, preparing the extra reader
         var extraReader = new StreamReader(this.extraFields[0x0001].value);

         // I really hope that these 64bits integer can fit in 32 bits integer, because js
         // won't let us have more.
         if(this.uncompressedSize === MAX_VALUE_32BITS) {
            this.uncompressedSize = extraReader.readInt(8);
         }
         if(this.compressedSize === MAX_VALUE_32BITS) {
            this.compressedSize = extraReader.readInt(8);
         }
         if(this.localHeaderOffset === MAX_VALUE_32BITS) {
            this.localHeaderOffset = extraReader.readInt(8);
         }
         if(this.diskNumberStart === MAX_VALUE_32BITS) {
            this.diskNumberStart = extraReader.readInt(4);
         }
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {StreamReader} reader the reader to use.
       */
      readExtraFields : function(reader) {
         var start = reader.index,
             extraFieldId,
             extraFieldLength,
             extraFieldValue;

         this.extraFields = this.extraFields || {};

         while (reader.index < start + this.extraFieldsLength) {
            extraFieldId     = reader.readInt(2);
            extraFieldLength = reader.readInt(2);
            extraFieldValue  = reader.readString(extraFieldLength);

            this.extraFields[extraFieldId] = {
               id:     extraFieldId,
               length: extraFieldLength,
               value:  extraFieldValue
            };
         }
      },
      /**
       * Apply an UTF8 transformation if needed.
       */
      handleUTF8 : function() {
         if (this.useUTF8()) {
            this.fileName    = JSZip.prototype.utf8decode(this.fileName);
            this.fileComment = JSZip.prototype.utf8decode(this.fileComment);
         }
      }
   };
   // }}} end of ZipEntry

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
      checkSignature : function(expectedSignature) {
         var signature = this.reader.readString(4);
         if (signature !== expectedSignature) {
            throw new Error("Corrupted zip or bug : unexpected signature " +
                            "(" + pretty(signature) + ", expected " + pretty(expectedSignature) + ")");
         }
      },
      /**
       * Read the end of the central directory.
       */
      readBlockEndOfCentral : function () {
         this.diskNumber                  = this.reader.readInt(2);
         this.diskWithCentralDirStart     = this.reader.readInt(2);
         this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
         this.centralDirRecords           = this.reader.readInt(2);
         this.centralDirSize              = this.reader.readInt(4);
         this.centralDirOffset            = this.reader.readInt(4);

         this.zipCommentLength            = this.reader.readInt(2);
         this.zipComment                  = this.reader.readString(this.zipCommentLength);
      },
      /**
       * Read the end of the Zip 64 central directory.
       * Not merged with the method readEndOfCentral :
       * The end of central can coexist with its Zip64 brother,
       * I don't want to read the wrong number of bytes !
       */
      readBlockZip64EndOfCentral : function () {
         this.zip64EndOfCentralSize       = this.reader.readInt(8);
         this.versionMadeBy               = this.reader.readString(2);
         this.versionNeeded               = this.reader.readInt(2);
         this.diskNumber                  = this.reader.readInt(4);
         this.diskWithCentralDirStart     = this.reader.readInt(4);
         this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
         this.centralDirRecords           = this.reader.readInt(8);
         this.centralDirSize              = this.reader.readInt(8);
         this.centralDirOffset            = this.reader.readInt(8);

         this.zip64ExtensibleData = {};
         var extraDataSize = this.zip64EndOfCentralSize - 44,
         index = 0,
         extraFieldId,
         extraFieldLength,
         extraFieldValue;
         while(index < extraDataSize) {
            extraFieldId     = this.reader.readInt(2);
            extraFieldLength = this.reader.readInt(4);
            extraFieldValue  = this.reader.readString(extraFieldLength);
            this.zip64ExtensibleData[extraFieldId] = {
               id:     extraFieldId,
               length: extraFieldLength,
               value:  extraFieldValue
            };
         }
      },
      /**
       * Read the end of the Zip 64 central directory locator.
       */
      readBlockZip64EndOfCentralLocator : function () {
         this.diskWithZip64CentralDirStart       = this.reader.readInt(4);
         this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
         this.disksCount                         = this.reader.readInt(4);
         if (this.disksCount > 1) {
            throw new Error("Multi-volumes zip are not supported");
         }
      },
      /**
       * Read the local files, based on the offset read in the central part.
       */
      readLocalFiles : function() {
         var i, file;
         for(i = 0; i < this.files.length; i++) {
            file = this.files[i];
            this.reader.setIndex(file.localHeaderOffset);
            this.checkSignature(JSZip.signature.LOCAL_FILE_HEADER);
            file.readLocalPart(this.reader);
            file.handleUTF8();
         }
      },
      /**
       * Read the central directory.
       */
      readCentralDir : function() {
         var file;

         this.reader.setIndex(this.centralDirOffset);
         while(this.reader.readString(4) === JSZip.signature.CENTRAL_FILE_HEADER) {
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
      readEndOfCentral : function() {
            var offset = this.reader.stream.lastIndexOf(JSZip.signature.CENTRAL_DIRECTORY_END);
            if (offset === -1) {
               throw new Error("Corrupted zip : can't find end of central directory");
            }
            this.reader.setIndex(offset);
            this.checkSignature(JSZip.signature.CENTRAL_DIRECTORY_END);
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
            if (  this.diskNumber                  === MAX_VALUE_16BITS
               || this.diskWithCentralDirStart     === MAX_VALUE_16BITS
               || this.centralDirRecordsOnThisDisk === MAX_VALUE_16BITS
               || this.centralDirRecords           === MAX_VALUE_16BITS
               || this.centralDirSize              === MAX_VALUE_32BITS
               || this.centralDirOffset            === MAX_VALUE_32BITS
            ) {
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
               offset = this.reader.stream.lastIndexOf(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
               if (offset === -1) {
                  throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
               }
               this.reader.setIndex(offset);
               this.checkSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
               this.readBlockZip64EndOfCentralLocator();

               // now the zip64 EOCD record
               this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
               this.checkSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_END);
               this.readBlockZip64EndOfCentral();
            }
      },
      /**
       * Read a zip file and create ZipEntries.
       * @param {String|ArrayBuffer|Uint8Array} data the binary string representing a zip file.
       */
      load : function(data) {
         this.reader = new StreamReader(data);

         this.readEndOfCentral();
         this.readCentralDir();
         this.readLocalFiles();
      }
   };
   // }}} end of ZipEntries

   /**
    * Implementation of the load method of JSZip.
    * It uses the above classes to decode a zip file, and load every files.
    * @param {String|ArrayBuffer|Uint8Array} data the data to load.
    * @param {Object} options Options for loading the stream.
    *  options.base64 : is the stream in base64 ? default : false
    */
   JSZip.prototype.load = function(data, options) {
      var files, zipEntries, i, input;
      options = options || {};
      if(options.base64) {
         data = JSZipBase64.decode(data);
      }

      zipEntries = new ZipEntries(data, options);
      files = zipEntries.files;
      for (i = 0; i < files.length; i++) {
         input = files[i];
         this.file(input.fileName, input.uncompressedFileData, {
            binary:true,
            optimizedBinaryString:true,
            date:input.date,
            dir:input.dir
         });
      }

      return this;
   };

}());

/*
 * Port of a script by Masanao Izumo.
 *
 * Only changes : wrap all the variables in a function and add the 
 * main function to JSZip (DEFLATE compression method).
 * Everything else was written by M. Izumo.
 *
 * Original code can be found here: http://www.onicos.com/staff/iz/amuse/javascript/expert/inflate.txt
 */

if(!JSZip) {
   throw "JSZip not defined";
}

/*
 * Original:
 *   http://www.onicos.com/staff/iz/amuse/javascript/expert/inflate.txt
 */

(function(){
  // the original implementation leaks a global variable.
  // Defining the variable here doesn't break anything.
  var zip_fixed_bd;

/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0.0.1
 * LastModified: Dec 25 1999
 */

/* Interface:
 * data = zip_inflate(src);
 */

/* constant parameters */
var zip_WSIZE = 32768;        // Sliding Window size
var zip_STORED_BLOCK = 0;
var zip_STATIC_TREES = 1;
var zip_DYN_TREES    = 2;

/* for inflate */
var zip_lbits = 9; 		// bits in base literal/length lookup table
var zip_dbits = 6; 		// bits in base distance lookup table
var zip_INBUFSIZ = 32768;	// Input buffer size
var zip_INBUF_EXTRA = 64;	// Extra buffer

/* variables (inflate) */
var zip_slide;
var zip_wp;			// current position in slide
var zip_fixed_tl = null;	// inflate static
var zip_fixed_td;		// inflate static
var zip_fixed_bl, fixed_bd;	// inflate static
var zip_bit_buf;		// bit buffer
var zip_bit_len;		// bits in bit buffer
var zip_method;
var zip_eof;
var zip_copy_leng;
var zip_copy_dist;
var zip_tl, zip_td;	// literal/length and distance decoder tables
var zip_bl, zip_bd;	// number of bits decoded by tl and td

var zip_inflate_data;
var zip_inflate_pos;


/* constant tables (inflate) */
var zip_MASK_BITS = new Array(
    0x0000,
    0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff,
    0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff);
// Tables for deflate from PKZIP's appnote.txt.
var zip_cplens = new Array( // Copy lengths for literal codes 257..285
    3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
    35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0);
/* note: see note #13 above about the 258 in this list. */
var zip_cplext = new Array( // Extra bits for literal codes 257..285
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
    3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 99, 99); // 99==invalid
var zip_cpdist = new Array( // Copy offsets for distance codes 0..29
    1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
    257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
    8193, 12289, 16385, 24577);
var zip_cpdext = new Array( // Extra bits for distance codes
    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
    7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
    12, 12, 13, 13);
var zip_border = new Array(  // Order of the bit length code lengths
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);
/* objects (inflate) */

function zip_HuftList() {
    this.next = null;
    this.list = null;
}

function zip_HuftNode() {
    this.e = 0; // number of extra bits or operation
    this.b = 0; // number of bits in this code or subcode

    // union
    this.n = 0; // literal, length base, or distance base
    this.t = null; // (zip_HuftNode) pointer to next level of table
}

function zip_HuftBuild(b,	// code lengths in bits (all assumed <= BMAX)
		       n,	// number of codes (assumed <= N_MAX)
		       s,	// number of simple-valued codes (0..s-1)
		       d,	// list of base values for non-simple codes
		       e,	// list of extra bits for non-simple codes
		       mm	// maximum lookup bits
		   ) {
    this.BMAX = 16;   // maximum bit length of any code
    this.N_MAX = 288; // maximum number of codes in any set
    this.status = 0;	// 0: success, 1: incomplete table, 2: bad input
    this.root = null;	// (zip_HuftList) starting table
    this.m = 0;		// maximum lookup bits, returns actual

/* Given a list of code lengths and a maximum table size, make a set of
   tables to decode that set of codes.	Return zero on success, one if
   the given code set is incomplete (the tables are still built in this
   case), two if the input is invalid (all zero length codes or an
   oversubscribed set of lengths), and three if not enough memory.
   The code with value 256 is special, and the tables are constructed
   so that no bits beyond that code are fetched when that code is
   decoded. */
    {
	var a;			// counter for codes of length k
	var c = new Array(this.BMAX+1);	// bit length count table
	var el;			// length of EOB code (value 256)
	var f;			// i repeats in table every f entries
	var g;			// maximum code length
	var h;			// table level
	var i;			// counter, current code
	var j;			// counter
	var k;			// number of bits in current code
	var lx = new Array(this.BMAX+1);	// stack of bits per table
	var p;			// pointer into c[], b[], or v[]
	var pidx;		// index of p
	var q;			// (zip_HuftNode) points to current table
	var r = new zip_HuftNode(); // table entry for structure assignment
	var u = new Array(this.BMAX); // zip_HuftNode[BMAX][]  table stack
	var v = new Array(this.N_MAX); // values in order of bit length
	var w;
	var x = new Array(this.BMAX+1);// bit offsets, then code stack
	var xp;			// pointer into x or c
	var y;			// number of dummy codes added
	var z;			// number of entries in current table
	var o;
	var tail;		// (zip_HuftList)

	tail = this.root = null;
	for(i = 0; i < c.length; i++)
	    c[i] = 0;
	for(i = 0; i < lx.length; i++)
	    lx[i] = 0;
	for(i = 0; i < u.length; i++)
	    u[i] = null;
	for(i = 0; i < v.length; i++)
	    v[i] = 0;
	for(i = 0; i < x.length; i++)
	    x[i] = 0;

	// Generate counts for each bit length
	el = n > 256 ? b[256] : this.BMAX; // set length of EOB code, if any
	p = b; pidx = 0;
	i = n;
	do {
	    c[p[pidx]]++;	// assume all entries <= BMAX
	    pidx++;
	} while(--i > 0);
	if(c[0] == n) {	// null input--all zero length codes
	    this.root = null;
	    this.m = 0;
	    this.status = 0;
	    return;
	}

	// Find minimum and maximum length, bound *m by those
	for(j = 1; j <= this.BMAX; j++)
	    if(c[j] != 0)
		break;
	k = j;			// minimum code length
	if(mm < j)
	    mm = j;
	for(i = this.BMAX; i != 0; i--)
	    if(c[i] != 0)
		break;
	g = i;			// maximum code length
	if(mm > i)
	    mm = i;

	// Adjust last length count to fill out codes, if needed
	for(y = 1 << j; j < i; j++, y <<= 1)
	    if((y -= c[j]) < 0) {
		this.status = 2;	// bad input: more codes than bits
		this.m = mm;
		return;
	    }
	if((y -= c[i]) < 0) {
	    this.status = 2;
	    this.m = mm;
	    return;
	}
	c[i] += y;

	// Generate starting offsets into the value table for each length
	x[1] = j = 0;
	p = c;
	pidx = 1;
	xp = 2;
	while(--i > 0)		// note that i == g from above
	    x[xp++] = (j += p[pidx++]);

	// Make a table of values in order of bit lengths
	p = b; pidx = 0;
	i = 0;
	do {
	    if((j = p[pidx++]) != 0)
		v[x[j]++] = i;
	} while(++i < n);
	n = x[g];			// set n to length of v

	// Generate the Huffman codes and for each, make the table entries
	x[0] = i = 0;		// first Huffman code is zero
	p = v; pidx = 0;		// grab values in bit order
	h = -1;			// no tables yet--level -1
	w = lx[0] = 0;		// no bits decoded yet
	q = null;			// ditto
	z = 0;			// ditto

	// go through the bit lengths (k already is bits in shortest code)
	for(; k <= g; k++) {
	    a = c[k];
	    while(a-- > 0) {
		// here i is the Huffman code of length k bits for value p[pidx]
		// make tables up to required level
		while(k > w + lx[1 + h]) {
		    w += lx[1 + h]; // add bits already decoded
		    h++;

		    // compute minimum size table less than or equal to *m bits
		    z = (z = g - w) > mm ? mm : z; // upper limit
		    if((f = 1 << (j = k - w)) > a + 1) { // try a k-w bit table
			// too few codes for k-w bit table
			f -= a + 1;	// deduct codes from patterns left
			xp = k;
			while(++j < z) { // try smaller tables up to z bits
			    if((f <<= 1) <= c[++xp])
				break;	// enough codes to use up j bits
			    f -= c[xp];	// else deduct codes from patterns
			}
		    }
		    if(w + j > el && w < el)
			j = el - w;	// make EOB code end at table
		    z = 1 << j;	// table entries for j-bit table
		    lx[1 + h] = j; // set table size in stack

		    // allocate and link in new table
		    q = new Array(z);
		    for(o = 0; o < z; o++) {
			q[o] = new zip_HuftNode();
		    }

		    if(tail == null)
			tail = this.root = new zip_HuftList();
		    else
			tail = tail.next = new zip_HuftList();
		    tail.next = null;
		    tail.list = q;
		    u[h] = q;	// table starts after link

		    /* connect to last table, if there is one */
		    if(h > 0) {
			x[h] = i;		// save pattern for backing up
			r.b = lx[h];	// bits to dump before this table
			r.e = 16 + j;	// bits in this table
			r.t = q;		// pointer to this table
			j = (i & ((1 << w) - 1)) >> (w - lx[h]);
			u[h-1][j].e = r.e;
			u[h-1][j].b = r.b;
			u[h-1][j].n = r.n;
			u[h-1][j].t = r.t;
		    }
		}

		// set up table entry in r
		r.b = k - w;
		if(pidx >= n)
		    r.e = 99;		// out of values--invalid code
		else if(p[pidx] < s) {
		    r.e = (p[pidx] < 256 ? 16 : 15); // 256 is end-of-block code
		    r.n = p[pidx++];	// simple code is just the value
		} else {
		    r.e = e[p[pidx] - s];	// non-simple--look up in lists
		    r.n = d[p[pidx++] - s];
		}

		// fill code-like entries with r //
		f = 1 << (k - w);
		for(j = i >> w; j < z; j += f) {
		    q[j].e = r.e;
		    q[j].b = r.b;
		    q[j].n = r.n;
		    q[j].t = r.t;
		}

		// backwards increment the k-bit code i
		for(j = 1 << (k - 1); (i & j) != 0; j >>= 1)
		    i ^= j;
		i ^= j;

		// backup over finished tables
		while((i & ((1 << w) - 1)) != x[h]) {
		    w -= lx[h];		// don't need to update q
		    h--;
		}
	    }
	}

	/* return actual size of base table */
	this.m = lx[1];

	/* Return true (1) if we were given an incomplete table */
	this.status = ((y != 0 && g != 1) ? 1 : 0);
    } /* end of constructor */
}


/* routines (inflate) */

function zip_GET_BYTE() {
    if(zip_inflate_data.length == zip_inflate_pos)
	return -1;
    return zip_inflate_data.charCodeAt(zip_inflate_pos++) & 0xff;
}

function zip_NEEDBITS(n) {
    while(zip_bit_len < n) {
	zip_bit_buf |= zip_GET_BYTE() << zip_bit_len;
	zip_bit_len += 8;
    }
}

function zip_GETBITS(n) {
    return zip_bit_buf & zip_MASK_BITS[n];
}

function zip_DUMPBITS(n) {
    zip_bit_buf >>= n;
    zip_bit_len -= n;
}

function zip_inflate_codes(buff, off, size) {
    /* inflate (decompress) the codes in a deflated (compressed) block.
       Return an error code or zero if it all goes ok. */
    var e;		// table entry flag/number of extra bits
    var t;		// (zip_HuftNode) pointer to table entry
    var n;

    if(size == 0)
      return 0;

    // inflate the coded data
    n = 0;
    for(;;) {			// do until end of block
	zip_NEEDBITS(zip_bl);
	t = zip_tl.list[zip_GETBITS(zip_bl)];
	e = t.e;
	while(e > 16) {
	    if(e == 99)
		return -1;
	    zip_DUMPBITS(t.b);
	    e -= 16;
	    zip_NEEDBITS(e);
	    t = t.t[zip_GETBITS(e)];
	    e = t.e;
	}
	zip_DUMPBITS(t.b);

	if(e == 16) {		// then it's a literal
	    zip_wp &= zip_WSIZE - 1;
	    buff[off + n++] = zip_slide[zip_wp++] = t.n;
	    if(n == size)
		return size;
	    continue;
	}

	// exit if end of block
	if(e == 15)
	    break;

	// it's an EOB or a length

	// get length of block to copy
	zip_NEEDBITS(e);
	zip_copy_leng = t.n + zip_GETBITS(e);
	zip_DUMPBITS(e);

	// decode distance of block to copy
	zip_NEEDBITS(zip_bd);
	t = zip_td.list[zip_GETBITS(zip_bd)];
	e = t.e;

	while(e > 16) {
	    if(e == 99)
		return -1;
	    zip_DUMPBITS(t.b);
	    e -= 16;
	    zip_NEEDBITS(e);
	    t = t.t[zip_GETBITS(e)];
	    e = t.e;
	}
	zip_DUMPBITS(t.b);
	zip_NEEDBITS(e);
	zip_copy_dist = zip_wp - t.n - zip_GETBITS(e);
	zip_DUMPBITS(e);

	// do the copy
	while(zip_copy_leng > 0 && n < size) {
	    zip_copy_leng--;
	    zip_copy_dist &= zip_WSIZE - 1;
	    zip_wp &= zip_WSIZE - 1;
	    buff[off + n++] = zip_slide[zip_wp++]
		= zip_slide[zip_copy_dist++];
	}

	if(n == size)
	    return size;
    }

    zip_method = -1; // done
    return n;
}

function zip_inflate_stored(buff, off, size) {
    /* "decompress" an inflated type 0 (stored) block. */
    var n;

    // go to byte boundary
    n = zip_bit_len & 7;
    zip_DUMPBITS(n);

    // get the length and its complement
    zip_NEEDBITS(16);
    n = zip_GETBITS(16);
    zip_DUMPBITS(16);
    zip_NEEDBITS(16);
    if(n != ((~zip_bit_buf) & 0xffff))
	return -1;			// error in compressed data
    zip_DUMPBITS(16);

    // read and output the compressed data
    zip_copy_leng = n;

    n = 0;
    while(zip_copy_leng > 0 && n < size) {
	zip_copy_leng--;
	zip_wp &= zip_WSIZE - 1;
	zip_NEEDBITS(8);
	buff[off + n++] = zip_slide[zip_wp++] =
	    zip_GETBITS(8);
	zip_DUMPBITS(8);
    }

    if(zip_copy_leng == 0)
      zip_method = -1; // done
    return n;
}

function zip_inflate_fixed(buff, off, size) {
    /* decompress an inflated type 1 (fixed Huffman codes) block.  We should
       either replace this with a custom decoder, or at least precompute the
       Huffman tables. */

    // if first time, set up tables for fixed blocks
    if(zip_fixed_tl == null) {
	var i;			// temporary variable
	var l = new Array(288);	// length list for huft_build
	var h;	// zip_HuftBuild

	// literal table
	for(i = 0; i < 144; i++)
	    l[i] = 8;
	for(; i < 256; i++)
	    l[i] = 9;
	for(; i < 280; i++)
	    l[i] = 7;
	for(; i < 288; i++)	// make a complete, but wrong code set
	    l[i] = 8;
	zip_fixed_bl = 7;

	h = new zip_HuftBuild(l, 288, 257, zip_cplens, zip_cplext,
			      zip_fixed_bl);
	if(h.status != 0) {
	    alert("HufBuild error: "+h.status);
	    return -1;
	}
	zip_fixed_tl = h.root;
	zip_fixed_bl = h.m;

	// distance table
	for(i = 0; i < 30; i++)	// make an incomplete code set
	    l[i] = 5;
	zip_fixed_bd = 5;

	h = new zip_HuftBuild(l, 30, 0, zip_cpdist, zip_cpdext, zip_fixed_bd);
	if(h.status > 1) {
	    zip_fixed_tl = null;
	    alert("HufBuild error: "+h.status);
	    return -1;
	}
	zip_fixed_td = h.root;
	zip_fixed_bd = h.m;
    }

    zip_tl = zip_fixed_tl;
    zip_td = zip_fixed_td;
    zip_bl = zip_fixed_bl;
    zip_bd = zip_fixed_bd;
    return zip_inflate_codes(buff, off, size);
}

function zip_inflate_dynamic(buff, off, size) {
    // decompress an inflated type 2 (dynamic Huffman codes) block.
    var i;		// temporary variables
    var j;
    var l;		// last length
    var n;		// number of lengths to get
    var t;		// (zip_HuftNode) literal/length code table
    var nb;		// number of bit length codes
    var nl;		// number of literal/length codes
    var nd;		// number of distance codes
    var ll = new Array(286+30); // literal/length and distance code lengths
    var h;		// (zip_HuftBuild)

    for(i = 0; i < ll.length; i++)
	ll[i] = 0;

    // read in table lengths
    zip_NEEDBITS(5);
    nl = 257 + zip_GETBITS(5);	// number of literal/length codes
    zip_DUMPBITS(5);
    zip_NEEDBITS(5);
    nd = 1 + zip_GETBITS(5);	// number of distance codes
    zip_DUMPBITS(5);
    zip_NEEDBITS(4);
    nb = 4 + zip_GETBITS(4);	// number of bit length codes
    zip_DUMPBITS(4);
    if(nl > 286 || nd > 30)
      return -1;		// bad lengths

    // read in bit-length-code lengths
    for(j = 0; j < nb; j++)
    {
	zip_NEEDBITS(3);
	ll[zip_border[j]] = zip_GETBITS(3);
	zip_DUMPBITS(3);
    }
    for(; j < 19; j++)
	ll[zip_border[j]] = 0;

    // build decoding table for trees--single level, 7 bit lookup
    zip_bl = 7;
    h = new zip_HuftBuild(ll, 19, 19, null, null, zip_bl);
    if(h.status != 0)
	return -1;	// incomplete code set

    zip_tl = h.root;
    zip_bl = h.m;

    // read in literal and distance code lengths
    n = nl + nd;
    i = l = 0;
    while(i < n) {
	zip_NEEDBITS(zip_bl);
	t = zip_tl.list[zip_GETBITS(zip_bl)];
	j = t.b;
	zip_DUMPBITS(j);
	j = t.n;
	if(j < 16)		// length of code in bits (0..15)
	    ll[i++] = l = j;	// save last length in l
	else if(j == 16) {	// repeat last length 3 to 6 times
	    zip_NEEDBITS(2);
	    j = 3 + zip_GETBITS(2);
	    zip_DUMPBITS(2);
	    if(i + j > n)
		return -1;
	    while(j-- > 0)
		ll[i++] = l;
	} else if(j == 17) {	// 3 to 10 zero length codes
	    zip_NEEDBITS(3);
	    j = 3 + zip_GETBITS(3);
	    zip_DUMPBITS(3);
	    if(i + j > n)
		return -1;
	    while(j-- > 0)
		ll[i++] = 0;
	    l = 0;
	} else {		// j == 18: 11 to 138 zero length codes
	    zip_NEEDBITS(7);
	    j = 11 + zip_GETBITS(7);
	    zip_DUMPBITS(7);
	    if(i + j > n)
		return -1;
	    while(j-- > 0)
		ll[i++] = 0;
	    l = 0;
	}
    }

    // build the decoding tables for literal/length and distance codes
    zip_bl = zip_lbits;
    h = new zip_HuftBuild(ll, nl, 257, zip_cplens, zip_cplext, zip_bl);
    if(zip_bl == 0)	// no literals or lengths
	h.status = 1;
    if(h.status != 0) {
	if(h.status == 1)
	    ;// **incomplete literal tree**
	return -1;		// incomplete code set
    }
    zip_tl = h.root;
    zip_bl = h.m;

    for(i = 0; i < nd; i++)
	ll[i] = ll[i + nl];
    zip_bd = zip_dbits;
    h = new zip_HuftBuild(ll, nd, 0, zip_cpdist, zip_cpdext, zip_bd);
    zip_td = h.root;
    zip_bd = h.m;

    if(zip_bd == 0 && nl > 257) {   // lengths but no distances
	// **incomplete distance tree**
	return -1;
    }

    if(h.status == 1) {
	;// **incomplete distance tree**
    }
    if(h.status != 0)
	return -1;

    // decompress until an end-of-block code
    return zip_inflate_codes(buff, off, size);
}

function zip_inflate_start() {
    var i;

    if(zip_slide == null)
	zip_slide = new Array(2 * zip_WSIZE);
    zip_wp = 0;
    zip_bit_buf = 0;
    zip_bit_len = 0;
    zip_method = -1;
    zip_eof = false;
    zip_copy_leng = zip_copy_dist = 0;
    zip_tl = null;
}

function zip_inflate_internal(buff, off, size) {
    // decompress an inflated entry
    var n, i;

    n = 0;
    while(n < size) {
	if(zip_eof && zip_method == -1)
	    return n;

	if(zip_copy_leng > 0) {
	    if(zip_method != zip_STORED_BLOCK) {
		// STATIC_TREES or DYN_TREES
		while(zip_copy_leng > 0 && n < size) {
		    zip_copy_leng--;
		    zip_copy_dist &= zip_WSIZE - 1;
		    zip_wp &= zip_WSIZE - 1;
		    buff[off + n++] = zip_slide[zip_wp++] =
			zip_slide[zip_copy_dist++];
		}
	    } else {
		while(zip_copy_leng > 0 && n < size) {
		    zip_copy_leng--;
		    zip_wp &= zip_WSIZE - 1;
		    zip_NEEDBITS(8);
		    buff[off + n++] = zip_slide[zip_wp++] = zip_GETBITS(8);
		    zip_DUMPBITS(8);
		}
		if(zip_copy_leng == 0)
		    zip_method = -1; // done
	    }
	    if(n == size)
		return n;
	}

	if(zip_method == -1) {
	    if(zip_eof)
		break;

	    // read in last block bit
	    zip_NEEDBITS(1);
	    if(zip_GETBITS(1) != 0)
		zip_eof = true;
	    zip_DUMPBITS(1);

	    // read in block type
	    zip_NEEDBITS(2);
	    zip_method = zip_GETBITS(2);
	    zip_DUMPBITS(2);
	    zip_tl = null;
	    zip_copy_leng = 0;
	}

	switch(zip_method) {
	  case 0: // zip_STORED_BLOCK
	    i = zip_inflate_stored(buff, off + n, size - n);
	    break;

	  case 1: // zip_STATIC_TREES
	    if(zip_tl != null)
		i = zip_inflate_codes(buff, off + n, size - n);
	    else
		i = zip_inflate_fixed(buff, off + n, size - n);
	    break;

	  case 2: // zip_DYN_TREES
	    if(zip_tl != null)
		i = zip_inflate_codes(buff, off + n, size - n);
	    else
		i = zip_inflate_dynamic(buff, off + n, size - n);
	    break;

	  default: // error
	    i = -1;
	    break;
	}

	if(i == -1) {
	    if(zip_eof)
		return 0;
	    return -1;
	}
	n += i;
    }
    return n;
}

function zip_inflate(str) {
    var out, buff;
    var i, j;

    zip_inflate_start();
    zip_inflate_data = str;
    zip_inflate_pos = 0;

    buff = new Array(1024);
    out = "";
    while((i = zip_inflate_internal(buff, 0, buff.length)) > 0) {
	for(j = 0; j < i; j++)
	    out += String.fromCharCode(buff[j]);
    }
    zip_inflate_data = null; // G.C.
    return out;
}

//
// end of the script of Masanao Izumo.
//

// we add the compression method for JSZip
if(!JSZip.compressions["DEFLATE"]) {
  JSZip.compressions["DEFLATE"] = {
    magic : "\x08\x00",
    uncompress : zip_inflate
  }
} else {
  JSZip.compressions["DEFLATE"].uncompress = zip_inflate;
}

})();

var zip = new JSZip(buffer);
var files = zip.file(/.+/);
var out = {};
files.forEach(function(a){
    out[a.name]=a.asArrayBuffer();
});
return out;
}