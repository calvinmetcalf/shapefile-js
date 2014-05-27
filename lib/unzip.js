'use strict';

var JSZip = require('jszip');
module.exports = function(buffer) {
	var zip = new JSZip(buffer);
	var files = zip.file(/.+/);
	var out = {};
	files.forEach(function(a) {
		if (a.name.slice(-3).toLowerCase() === 'shp' || a.name.slice(-3).toLowerCase() === 'dbf') {
			out[a.name] = a.asText();
			out[a.name] = a.asArrayBuffer();
		}
		else {
			out[a.name] = a.asText();
		}
	});
	return out;
};
