
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
