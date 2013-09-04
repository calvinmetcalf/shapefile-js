define(['./lie'],function(deferred){
return function(url){
    var promise = deferred();
    var type = url.slice(-3);
	var ajax = new XMLHttpRequest();
	ajax.open("GET",url,true);
	if(type !== 'prj'){
		ajax.responseType='arraybuffer';
	}
	ajax.addEventListener("load",function(){
		if(ajax.status>399){
			if(type==='prj'){
				return promise.resolve(false);
			}else{
				return promise.reject(ajax.status);
			}
		}
		promise.resolve(ajax.response);
	}, false);
	ajax.send();
	return promise.promise;
};
});
