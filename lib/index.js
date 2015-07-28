'use strict';
var proj4 = require('proj4');
var unzip = require('./unzip');
var binaryAjax = require('./binaryajax');
var parseShp = require('./parseShp');
var toArrayBuffer = require('./toArrayBuffer');
var parseDbf = require('parsedbf');
var Promise = require('lie');
var Cache = require('lru-cache');
var cache = new Cache({
	max: 20
});
function shp(base, whiteList) {
	if (typeof base === 'string' && cache.has(base)) {
		return Promise.resolve(cache.get(base));
	}
	return shp.getShapefile(base, whiteList).then(function (resp) {
		if (typeof base === 'string') {
			cache.set(base, resp);
		}
		return resp;
	});
}
shp.combine = function(arr) {
	var out = {};
	out.type = 'FeatureCollection';
	out.features = [];
	var i = 0;
	var len = arr[0].length;
	while (i < len) {
		out.features.push({
			'type': 'Feature',
			'geometry': arr[0][i],
			'properties': arr[1][i]
		});
		i++;
	}
	return out;
};
shp.parseZip = function(buffer, whiteList) {
	var key;
	var zip = unzip(buffer);
	var names = [];
	whiteList = whiteList || [];
	for (key in zip) {
		if (key.indexOf('__MACOSX') !== -1) {
			continue;
		}
		if (key.slice(-3).toLowerCase() === 'shp') {
			names.push(key.slice(0, - 4));
		}
		else if (key.slice(-3).toLowerCase() === 'dbf') {
			zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = parseDbf(zip[key]);
		}
		else if (key.slice(-3).toLowerCase() === 'prj') {
			zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = proj4(zip[key]);
		}
		else if (key.slice(-4).toLowerCase() === 'json' || whiteList.indexOf(key.split('.').pop()) > -1) {
			names.push(key.slice(0, -3) + key.slice(-3).toLowerCase());
		}
	}
	if (!names.length) {
		throw new Error('no layers founds');
	}
	var geojson = names.map(function(name) {
		var parsed;
		if (name.slice(-4).toLowerCase() === 'json') {
			parsed = JSON.parse(zip[name]);
			parsed.fileName = name.slice(0, name.lastIndexOf('.'));
		}
		else if (whiteList.indexOf(name.slice(name.lastIndexOf('.') + 1)) > -1) {
			parsed = zip[name];
			parsed.fileName = name;
		}
		else {
			parsed = shp.combine([parseShp(zip[name + '.shp'], zip[name + '.prj']), zip[name + '.dbf']]);
			parsed.fileName = name;
		}
		return parsed;
	});
	if (geojson.length === 1) {
		return geojson[0];
	}
	else {
		return geojson;
	}
};

function getZip(base, whiteList) {
	return binaryAjax(base).then(function(a) {
		return shp.parseZip(a, whiteList);
	});
}
shp.getShapefile = function(base, whiteList) {
	if (typeof base === 'string') {
		if (base.slice(-4) === '.zip') {
			return getZip(base, whiteList);
		}
		else {
			return Promise.all([
				Promise.all([
					binaryAjax(base + '.shp'),
					binaryAjax(base + '.prj')
				]).then(function(args) {
					return parseShp(args[0], args[1] ? proj4(args[1]) : false);
				}),
				binaryAjax(base + '.dbf').then(parseDbf)
			]).then(shp.combine);
		}
	}
	else {
		return new Promise(function(resolve) {
			resolve(shp.parseZip(base));
		});
	}
};
shp.parseShp = function (shp, prj) {
	if (Buffer.isBuffer(shp)) {
		shp = toArrayBuffer(shp);
	}
	if (Buffer.isBuffer(prj)) {
		prj = prj.toString();
	}
	if (typeof prj === 'string') {
		prj = proj4(prj);
		return parseShp(shp, prj);
	} else {
		return parseShp(shp);
	}
};
shp.parseDbf = function (dbf) {
	if (Buffer.isBuffer(dbf)) {
		dbf = toArrayBuffer(dbf);
	}
	return parseDbf(dbf);
};
module.exports = shp;
