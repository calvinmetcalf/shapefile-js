/*! communist 2013-06-12*/
/*!©2013 Calvin Metcalf @license MIT https://github.com/calvinmetcalf/communist */
if (typeof document === "undefined") {
	self._noTransferable=true;
	self.onmessage=function(e){
		/*jslint evil: true */
		eval(e.data);
	};
} else {
(function(){
	"use strict";
/*!From setImmediate Copyright (c) 2012 Barnesandnoble.com,llc, Donavon West, and Domenic Denicola @license MIT https://github.com/NobleJS/setImmediate */
(function(attachTo,global) {
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
		// Installs an event handler on `global` for the `message` event: see
		// * https://developer.mozilla.org/en/DOM/window.postMessage
		// * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

		var MESSAGE_PREFIX = "com.communistjs.setImmediate" + Math.random();

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
	})(c,window);
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
})(c);

c.all=function(array){
	var promise = c.deferred();
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

//this is mainly so the name shows up when you look at the object in the console
var Communist = function(){};
//regex out the importScript call and move it up to the top out of the function.
function moveImports(string){
	var script;
	var match = string.match(/(importScripts\(.*\);)/);
	if(match){
		script = match[0].replace(/importScripts\((.*\.js\')\);?/,
		function(a,b){
			if(b){
				return "importScripts("+b.split(",").map(function(cc){
					return "'"+c.makeUrl(cc.slice(1,-1))+"'";
				})+");\n";
			} else {
				return "";
			}
		})+string.replace(/(importScripts\(.*\.js\'\);?)/,"\n");
	}else{
		script = string;
	}
	return script;
}

function getPath(){
	if(typeof SHIM_WORKER_PATH !== "undefined"){
		return SHIM_WORKER_PATH;
	}
	var scripts = document.getElementsByTagName("script");
		var len = scripts.length;
		var i = 0;
		while(i<len){
			if(/communist(\.min)?\.js/.test(scripts[i].src)){
				return scripts[i].src;
			}
			i++;
		}
}
//accepts an array of strings, joins them, and turns them into a worker.
function makeWorker(strings){
	var worker;
	var script =moveImports(strings.join(""));
	c.URL = c.URL||window.URL || window.webkitURL;
	try{
		worker= new Worker(c.URL.createObjectURL(new Blob([script],{type: "text/javascript"})));
	}catch(e){
		c._noTransferable=true;
		worker = new Worker(getPath());
		worker.postMessage(script);
	}finally{
		return worker;
	}
}
//special case of worker only being called once, instead of sending the data
//we can bake the data into the worker when we make it.

function single(fun,data){
	if(typeof Worker === 'undefined'){
		return multiUse(fun).data(data);
	}
	var promise = c.deferred();
	var worker = makeWorker(['var _self={};\n_self.fun = ',fun,';\n\
	_self.cb=function(data,transfer){\n\
			!self._noTransferable?self.postMessage(data,transfer):self.postMessage(data);\n\
			self.close();\n\
		};\n\
		_self.result = _self.fun(',JSON.stringify(data),',_self.cb);\n\
		if(typeof _self.result !== "undefined"){\n\
			_self.cb(_self.result);\n\
		}']);
	worker.onmessage=function(e){
		promise.resolve(e.data);
	};
	worker.onerror=function(e){
		e.preventDefault();
		promise.reject(e.message);
	};
	return promise.promise;
}

function mapWorker(fun,callback,onerr){
	if(typeof Worker === 'undefined'){
		return fakeMapWorker(fun,callback,onerr);
	}
	var w = new Communist();
	var worker = makeWorker(['\n\
	var _db={};\n\
	_db.__close__=function(){\n\
		self.close();\n\
	};\n\
	var _self={};\n\
	_db.__fun__ = ',fun,';\n\
	_self.cb=function(data,transfer){\n\
		!self._noTransferable?self.postMessage(data,transfer):self.postMessage(data);\n\
	};\n\
	self.onmessage=function(e){\n\
		_self.result = _db.__fun__(e.data,_self.cb);\n\
			if(typeof _self.result !== "undefined"){\n\
				_self.cb(_self.result);\n\
		}\n\
	}']);
	worker.onmessage = function(e){
		callback(e.data);
	};
	if(onerr){
		worker.onerror=onerr;
	}else{
		worker.onerror=function(){callback();};
	}
	w.data=function(data,transfer){
		!c._noTransferable?worker.postMessage(data,transfer):worker.postMessage(data);
		return w;
	};
	w.close=function(){
		return worker.terminate();
	};
	return w;
}
function multiUse(fun){
	return object({data:fun});
}
function fakeObject(obj){
	var w = new Communist();
	var promises = [];
	var rejectPromises = function(msg){
		if(typeof msg!=="string" && msg.preventDefault){
			msg.preventDefault();
			msg=msg.message;
		}
		promises.forEach(function(p){
			if(p){
				p.reject(msg);
			}
		});
	};
	if(!("initialize" in obj)){
		obj.initialize=function(){};
	}
	var keyFunc=function(key){
		var result;
		var out = function(data){
			var i = promises.length;
			promises[i] = c.deferred();
			var callback = function(data){
				promises[i].resolve(data);
			};
			try{
				result = obj[key](data,callback);
				if(typeof result !== "undefined"){
					callback(result);
				}
			} catch (e){
				promises[i].reject(e);
			}
			return promises[i].promise;
		};
		return out;
		};
	for(var key in obj){
		w[key]=keyFunc(key);
	}
	w._close = function(){
		return c.resolve();
	};
	if(!('close' in w)){
		w.close=w._close;
	}
w.initialize();
	return w;
}

function fakeMapWorker(fun,callback,onerr){
	var w = new Communist();
	var worker = fakeObject({data:fun});
	w.data=function(data){
		worker.data(data).then(callback,onerr);
		return w;
	};
	w.close=worker.close;
	return w;
}

function fakeReducer(fun,callback){
	var w = new Communist();
	var accum;
	w.data=function(data){
		accum=accum?fun(accum,data):data;
		return w;
	};
	w.fetch=function(){
		callback(accum);
		return w;
	};
	w.close=function(silent){
		if(!silent){
			callback(accum);
		}
		return;
	};
	return w;
}

function object(obj){
	if(typeof Worker === 'undefined'){
		return fakeObject(obj);
	}
	var w = new Communist();
	var i = 0;
	var promises = [];
	var rejectPromises = function(msg){
		if(typeof msg!=="string" && msg.preventDefault){
			msg.preventDefault();
			msg=msg.message;
		}
		promises.forEach(function(p){
			if(p){
				p.reject(msg);
			}
		});
	};
	if(!("initialize" in obj)){
		obj.initialize=function(){};
	}
	var fObj="{";
	var keyFunc=function(key){
		var out = function(data, transfer){
			var i = promises.length;
			promises[i] = c.deferred();
			!c._noTransferable?worker.postMessage([i,key,data],transfer):worker.postMessage([i,key,data]);
			return promises[i].promise;
		};
		return out;
		};
	for(var key in obj){
		if(i!==0){
			fObj=fObj+",";
		}else{
			i++;
		}
		fObj=fObj+key+":"+obj[key].toString();
		w[key]=keyFunc(key);
	}
	fObj=fObj+"}";
	
	var worker = makeWorker(['\n\
	var _db='+fObj+';\n\
	self.onmessage=function(e){\n\
	var cb=function(data,transfer){\n\
		!self._noTransferable?self.postMessage([e.data[0],data],transfer):self.postMessage([e.data[0],data]);\n\
	};\n\
		var result = _db[e.data[1]](e.data[2],cb);\n\
			if(typeof result !== "undefined"){\n\
				cb(result);\n\
			}\n\
	}\n\
	_db.initialize()']);
	worker.onmessage= function(e){
			promises[e.data[0]].resolve(e.data[1]);
			promises[e.data[0]]=0;
	};
	worker.onerror=rejectPromises;
	w._close = function(){
		worker.terminate();
		rejectPromises("closed");
		return c.resolve();
	};
	if(!('close' in w)){
		w.close=w._close;
	}

	return w;
}

function queue(obj,n,dumb){
	var w = new Communist();
	w.__batchcb__=new Communist();
	w.__batchtcb__=new Communist();
	w.batch = function(cb){
		w.__batchcb__.__cb__=cb;
		return w.__batchcb__;
	};
	w.batchTransfer = function(cb){
		w.__batchtcb__.__cb__=cb;
		return w.__batchtcb__;
	};
	var workers = new Array(n);
	var numIdle=0;
	var idle=[];
	var que=[];
	var queueLen=0;
	while(numIdle<n){
		workers[numIdle]=object(obj);
		idle.push(numIdle);
		numIdle++;
	}
	function keyFunc(k){
		return function(data,transfer){
			return doStuff(k,data,transfer);
		};
	}
	function keyFuncBatch(k){
		return function(array){
			return c.all(array.map(function(data){
				return doStuff(k,data);
			}));
		};
	}
	function keyFuncBatchCB(k){
		return function(array){
			var self = this;
			return c.all(array.map(function(data){
				return doStuff(k,data).then(self.__cb__);
			}));
		};
	}
	function keyFuncBatchTransfer(k){
		return function(array){
			return c.all(array.map(function(data){
				return doStuff(k,data[0],data[1]);
			}));
		};
	}
	function keyFuncBatchTransferCB(k){
		return function(array){
			var self = this;
			return c.all(array.map(function(data){
				return doStuff(k,data[0],data[1]).then(self.__cb__);
			}));
		};
	}
	obj._close=function(){};
	for(var key in obj){
		w[key]=keyFunc(key);
		w.batch[key]=keyFuncBatch(key);
		w.__batchcb__[key]=keyFuncBatchCB(key);
		w.batchTransfer[key]=keyFuncBatchTransfer(key);
		w.__batchtcb__[key]=keyFuncBatchTransferCB(key);
	}
	function done(num){
		var data;
		if(queueLen){
			data = que.shift();
			queueLen--;
			workers[num][data[0]](data[1],data[2]).then(function(d){
				done(num);
				data[3].resolve(d);
			},function(d){
				done(num);
				data[3].reject(d);
			});
		}else{
			numIdle++;
			idle.push(num);
		}
	}
	function doStuff(key,data,transfer){//srsly better name!
		if(dumb){
			return workers[~~(Math.random()*n)][key](data,transfer);
			}
		var promise = c.deferred(),num;
		if(!queueLen && numIdle){
			num = idle.pop();
			numIdle--;
			workers[num][key](data,transfer).then(function(d){
				done(num);
				promise.resolve(d);
			},function(d){
				done(num);
				promise.reject(d);
			});
		}else if(queueLen||!numIdle){
			queueLen=que.push([key,data,transfer,promise]);
		}
		return promise.promise;
	}
	if(!('close' in w)){
		w.close=w._close;
	}
	return w;
}

function rWorker(fun,callback){
	if(typeof Worker === 'undefined'){
		return fakeReducer(fun,callback);
	}
	var w = new Communist();
	var func = 'function(dat,cb){ var fun = '+fun+';\n\
		switch(dat[0]){\n\
			case "data":\n\
				if(!this._r){\n\
					this._r = dat[1];\n\
				}else{\n\
					this._r = fun(this._r,dat[1]);\n\
				}\n\
				break;\n\
			case "get":\n\
				return cb(this._r);\n\
			case "close":\n\
				cb(this._r);\n\
				this.__close__();\n\
				break;\n\
		}\n\
	};';
	var cb =function(data){
		callback(data);
	};
	var worker = mapWorker(func,cb);
	w.data=function(data,transfer){
		!c._noTransferable?worker.data(["data",data],transfer):worker.data(["data",data]);
		return w;
	};
	w.fetch=function(){
		worker.data(["get"]);
		return w;
	};
	w.close=function(silent){
		if(silent){
			callback=function(){};
		}
		worker.data(["close"]);
		return;
	};
	return w;
}

function incrementalMapReduce(threads){
	var w = new Communist();
	var len = 0;
	var promise;
	var workers = [];
	var data=[];
	var idle = threads;
	var reducer;
	var waiting=false;
	var closing=false;
	var status = {
		map:false,
		reduce:false,
		data:false
	};
	var checkStatus = function(){
		if(status.map && status.reduce && status.data){
			return go();
		}else{
			return w;
		}
	};
	w.map=function(fun, t){
		if(status.map){
			return w;
		}
		var i = 0;
		function makeMapWorker(){
				var dd;
				var mw = mapWorker(fun, function(d){
					if(typeof d !== undefined){
						reducer.data(d);
					}
					if(len>0){
						len--;
						dd = data.pop();
						if(t){
							mw.data(dd,[dd]);
						}else{
						mw.data(dd);
						}
					}else{
						idle++;
						if(idle===threads){
							status.data=false;
						if(closing){
							closeUp();
							}else if(waiting){
								waiting = false;
								reducer.fetch();
							}
						}
					}
				});
			workers.push(mw);
			}
		while(i<threads){
			makeMapWorker();
			i++;
		}
		status.map=true;
		return checkStatus();
	};
	w.reduce=function(fun){
		if(status.reduce){
			return w;
		}
		reducer = rWorker(fun,function(d){
			if(promise){
				promise.resolve(d);
				promise = false;
			}
		});
		status.reduce=true;
		return checkStatus();
	};
	w.data = function(d){
		if(closing){
			return;
		}
		len = len + d.length;
		data = data.concat(d);
		status.data=true;
		return checkStatus();
	};
	function go(){
		var i = 0;
		var wlen = workers.length;
		while(i<wlen && len>0 && idle>0){
			len--;
			workers[i].data(data.pop());
			i++;
			idle--;
		}
		return w;
	}
	w.fetch=function(now){
		if(!promise){
			promise = c.deferred();
		}
		if(idle<threads && !now){
			waiting=true;
		}else{
			reducer.fetch();
		}
		return promise.promise;
	};
	w.close=function(){
		if(!promise){
			promise = c.deferred();
		}
		if(idle<threads){
			closing=true;
		}else{
			closeUp();
		}
		return promise.promise;
	};
	function closeUp(){
		reducer.close();
		workers.forEach(function(v){
			v.close();
		});
	}
	return w;
}
function nonIncrementalMapReduce(threads){
	var w = new Communist();
	var worker = incrementalMapReduce(threads);
	var steps = {data:false,map:false,reduce:false};
	w.map = function(f,t){
		steps.map=true;
		worker.map(f,t);
		return check();
	};
	w.reduce = function(f){
		steps.reduce=true;
		worker.reduce(f);
		return check();
	};
	w.data = function(d){
		steps.data=true;
		worker.data(d);
		return check();
	};
	
	function check(){
		if(steps.data&&steps.map&&steps.reduce){
			return worker.close();
		}else{
			return w;
		}
	}
	return w;
}
function c(a,b,d){
	if(typeof a !== "number" && typeof b === "function"){
		return mapWorker(a,b,d);
	}else if(typeof a === "object" && !Array.isArray(a)){
		if(typeof b === "number"){
			return queue(a,b,d);
		}else{
			return object(a);
		}
	}else if(typeof a !== "number"){
		return b ? single(a,b):multiUse(a);
	}else if(typeof a === "number"){
		return !b ? incrementalMapReduce(a):nonIncrementalMapReduce(a);
	}
}
c.reducer = rWorker;
c.worker = makeWorker;
c.makeUrl = function (fileName) {
	var link = document.createElement("link");
	link.href = fileName;
	return link.href;
};
c.ajax = function(url,after,notjson){
	var txt=!notjson?'JSON.parse(request.responseText)':"request.responseText";
	var resp = after?"("+after.toString()+")("+txt+",_cb)":txt;
	var func = 'function (url, _cb) {\n\
		var request = new XMLHttpRequest();\n\
		request.open("GET", url);\n\
			request.onreadystatechange = function() {\n\
				var _resp;\n\
				if (request.readyState === 4 && request.status === 200) {\n'+
					'_resp = '+resp+';\n\
					if(typeof _resp!=="undefined"){_cb(_resp);}\n\
					}\n\
			};\n\
			request.onerror=function(e){throw(e);}\n\
		request.send();\n\
	}';
	return c(func,c.makeUrl(url));
};
if(typeof module === "undefined"){
	window.communist=c;
} else {
	module.exports=c;
}
})();}