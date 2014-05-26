var promise = require('lie');
(typeof XMLHttpRequest !== 'undefined') || (XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest);
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
					return reject(new Error(ajax.status));
				}
			}
			resolve(ajax.response);
		}, false);
		ajax.send();
	});
}
module.exports = binaryAjax;
