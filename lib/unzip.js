'use strict';

var Promise = require('lie');
var JSZip = require('jszip');
module.exports = function(buffer) {
	return JSZip.loadAsync(buffer).then(function(zip) {
		var files = zip.file(/.+/);
		var out = {};
		var promises = files.map(function(a) {
			if (a.name.slice(-3).toLowerCase() === 'shp' || a.name.slice(-3).toLowerCase() === 'dbf') {
				return a.async('nodebuffer').then(function(content) {
					out[a.name] = content;
				});
			}
			else {
				return a.async('string').then(function(content) {
					out[a.name] = content;
				});
			}
		});
		return Promise.all(promises).then(function() {
			return out;
		});
	});
};
