define(['jam/lie'],function(deferred){
return function(url){
    var promise = deferred();
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
});
