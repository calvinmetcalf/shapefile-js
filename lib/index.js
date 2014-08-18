var proj4 = require('proj4');
var unzip = require('./unzip');
var binaryAjax = require('./binaryajax');
var all = require('lie-all');
var parseShp = require('./parseShp');
var parseDbf = require('parsedbf');
var promise = require('lie');

function shp(base, whiteList) {
	return shp.getShapefile(base, whiteList);
}
shp.combine = function(arr) {
	var out = {};
	out.type = "FeatureCollection";
	out.features = [];
	var i = 0;
	var len = arr[0].length;
	while (i < len) {
		out.features.push({
			"type": "Feature",
			"geometry": arr[0][i],
			"properties": arr[1][i]
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
		if (key.slice(-3).toLowerCase() === "shp") {
			names.push(key.slice(0, - 4));
		}
		else if (key.slice(-3).toLowerCase() === "dbf") {
			zip['dbf'] = parseDbf(zip[key]);
		}
		else if (key.slice(-3).toLowerCase() === "prj") {
			zip['prj'] = proj4(zip[key]);
		}
		else if (key.slice(-4).toLowerCase() === "json" || whiteList.indexOf(key.split('.').pop()) > -1) {
			names.push(key);
		}
	}
	if (!names.length) {
		throw new Error('no layers founds');
	}
	var geojson = names.map(function(name) {
		var parsed;
		if (name.slice(-4).toLowerCase() === "json") {
			parsed = JSON.parse(zip[name]);
			parsed.fileName = name.slice(0, name.lastIndexOf('.'));
		}
		else if (whiteList.indexOf(name.slice(name.lastIndexOf('.') + 1)) > -1) {
			parsed = zip[name];
			parsed.fileName = name;
		}
		else {
			parsed = shp.combine([parseShp(zip[name + '.shp'], zip['prj']), zip['dbf']]);
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
			return all([
				all([
				binaryAjax(base + '.shp'),
				binaryAjax(base + '.prj')]).then(function(args) {
					return parseShp(args[0], args[1] ? proj4(args[1]) : false);
				}),
				binaryAjax(base + '.dbf').then(parseDbf)
			]).then(shp.combine);
		}
	}
	else {
		return promise(function(resolve) {
			resolve(shp.parseZip(base));
		});
	}
};
module.exports = shp;
