'use strict';
var proj4 = require('proj4');
if (proj4.default) {
  proj4 = proj4.default;
}
var unzip = require('./unzip');
var binaryAjax = require('./binaryajax');
var parseShp = require('./parseShp');
var parseDbf = require('parsedbf');
var Promise = require('lie');
var Cache = require('lru-cache');
var cache = new Cache({
  max: 20
});

function toBuffer(b) {
  if (!b) {
    throw new Error('forgot to pass buffer');
  }
  if (Buffer.isBuffer(b)) {
    return b;
  }
  if (b instanceof global.ArrayBuffer) {
    return new Buffer(b);
  }
  if (b.buffer instanceof global.ArrayBuffer) {
    if (b.BYTES_PER_ELEMENT === 1) {
      return new Buffer(b);
    }
    return new Buffer(b.buffer);
  }
}

function shp(base, whiteList) {
  if (typeof base === 'string' && cache.has(base)) {
    return Promise.resolve(cache.get(base));
  }
  return shp.getShapefile(base, whiteList).then(function(resp) {
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
    // exclude empty shapes
    if (arr[0][i] !== null) {
      out.features.push({
        'type': 'Feature',
        'geometry': arr[0][i],
        'properties': arr[1][i]
      });
    }
    i++;
  }
  return out;
};
/**
 * Parse the zip file buffer for shapefile contents.
 * @param {File} buffer
 * @param {type} whiteList
 * @param {Object} options may contain the following: {
 *    //function that if defined, will be called with the string contents of the
 *    //shapefile prj file.  If the function return false, then no CRS conversion
 *    //will take place and the parsed geoJson is returned unconverted along with
 *    //an attribute 'prjfile' that includes the prj string content.
 *    //If the function returns true, then the normal CRS conversion will be
 *    //allowed to proceed where the geoJson is returned as standard WGS84.
 *    allowCrsConvert: function(prjBody) { return true; }
 *  }
 * @returns {shp_L17541.shp.parseZip.geojson}Parse teh
 */
shp.parseZip = function(buffer, whiteList, options) {
  var key;
  buffer = toBuffer(buffer);
  var zip = unzip(buffer);
  var names = [];
  whiteList = whiteList || [];
  for (key in zip) {
    if (key.indexOf('__MACOSX') !== -1) {
      continue;
    }
    if (key.slice(-3).toLowerCase() === 'shp') {
      names.push(key.slice(0, -4));
      zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = zip[key];
    } else if (key.slice(-3).toLowerCase() === 'prj') {
      if(options && options.allowCrsConvert && options.allowCrsConvert(zip[key])) {
				zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = proj4(zip[key]);
			} else {
				zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = zip[key];
			}
    } else if (key.slice(-4).toLowerCase() === 'json' || whiteList.indexOf(key.split('.').pop()) > -1) {
      names.push(key.slice(0, -3) + key.slice(-3).toLowerCase());
    } else if (key.slice(-3).toLowerCase() === 'dbf' || key.slice(-3).toLowerCase() === 'cpg') {
      zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = zip[key];
    }
  }
  if (!names.length) {
    throw new Error('no layers founds');
  }
  var geojson = names.map(function(name) {
    var parsed, dbf, prjfile;
    var lastDotIdx = name.lastIndexOf('.');
    if (lastDotIdx > -1 && name.slice(lastDotIdx).indexOf('json') > -1) {
      parsed = JSON.parse(zip[name]);
      parsed.fileName = name.slice(0, lastDotIdx);
    } else if (whiteList.indexOf(name.slice(lastDotIdx + 1)) > -1) {
      parsed = zip[name];
      parsed.fileName = name;
    } else {
      if (zip[name + '.dbf']) {
        dbf = parseDbf(zip[name + '.dbf'], zip[name + '.cpg']);
      }
      //if zip is still the raw prj text/string it means no crs conversion
      if(typeof zip[name+'.prj'] !== 'string') {
        prjfile = zip[name + '.prj'];
      }
      parsed = shp.combine([parseShp(zip[name + '.shp'], prjfile), dbf]);
      parsed.fileName = name;
      //if ignoring proj then return it with the geoJson only
      if(!prjfile) {
        parsed.prjfile = zip[name + '.prj'];
      }
    }
    return parsed;
  });
  if (geojson.length === 1) {
    return geojson[0];
  } else {
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
    if (base.slice(-4).toLowerCase() === '.zip') {
      return getZip(base, whiteList);
    } else {
      return Promise.all([
        Promise.all([
          binaryAjax(base + '.shp'),
          binaryAjax(base + '.prj')
        ]).then(function(args) {
          return parseShp(args[0], args[1] ? proj4(args[1]) : false);
        }),
        Promise.all([
          binaryAjax(base + '.dbf'),
          binaryAjax(base + '.cpg')
        ]).then(function(args) {
          return parseDbf(args[0], args[1]);
        })
      ]).then(shp.combine);
    }
  } else {
    return new Promise(function(resolve) {
      resolve(shp.parseZip(base));
    });
  }
};
shp.parseShp = function(shp, prj) {
  shp = toBuffer(shp);
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
shp.parseDbf = function(dbf, cpg) {
  dbf = toBuffer(dbf);
  return parseDbf(dbf, cpg);
};
module.exports = shp;
