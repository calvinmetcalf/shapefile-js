'use strict';
var Promise = require('lie');
module.exports = binaryAjax;
function binaryAjax(url){
	return new Promise(function(resolve,reject){
		var type = url.slice(-3);
		var ajax = new XMLHttpRequest();
		ajax.open('GET',url,true);
		if(type !== 'prj'){
			ajax.responseType='arraybuffer';
		}
		ajax.addEventListener('load', function (){
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