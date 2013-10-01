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
			resolve(ajax.response);
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
