import proj4 from 'proj4'
import unzip from './unzip.js';
import binaryAjax from './binaryajax.js';
import parseShp from './parseShp.js';
import parseDbf from 'parsedbf';
import { Buffer } from 'buffer';
const URL = globalThis.URL;

function toBuffer(b) {
  if (!b) {
    throw new Error('forgot to pass buffer');
  }
  if (Buffer.isBuffer(b)) {
    return b;
  }
  if (isArrayBuffer(b)) {
    return Buffer.from(b);
  }
  if (isArrayBuffer(b.buffer)) {
    if (b.BYTES_PER_ELEMENT === 1) {
      return Buffer.from(b);
    }
    return Buffer.from(b.buffer);
  }
}

function isArrayBuffer(subject) {
  return subject instanceof globalThis.ArrayBuffer || Object.prototype.toString.call(subject) === '[object ArrayBuffer]';
}


export const combine = function ([shp, dbf]) {
  const out = {};
  out.type = 'FeatureCollection';
  out.features = [];
  let i = 0;
  const len = shp.length;
  if (!dbf) {
    dbf = [];
  }
  while (i < len) {
    out.features.push({
      type: 'Feature',
      geometry: shp[i],
      properties: dbf[i] || {}
    });
    i++;
  }
  return out;
};
export const parseZip = async function (buffer, whiteList) {
  let key;
  buffer = toBuffer(buffer);
  const zip = await unzip(buffer);
  const names = [];
  whiteList = whiteList || [];
  for (key in zip) {
    if (key.indexOf('__MACOSX') !== -1) {
      continue;
    }
    if (key.slice(-4).toLowerCase() === '.shp') {
      names.push(key.slice(0, -4));
      zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = zip[key];
    } else if (key.slice(-4).toLowerCase() === '.prj') {
      zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = proj4(zip[key]);
    } else if (key.slice(-5).toLowerCase() === '.json' || whiteList.indexOf(key.split('.').pop()) > -1) {
      names.push(key.slice(0, -3) + key.slice(-3).toLowerCase());
    } else if (key.slice(-4).toLowerCase() === '.dbf' || key.slice(-4).toLowerCase() === '.cpg') {
      zip[key.slice(0, -3) + key.slice(-3).toLowerCase()] = zip[key];
    }
  }
  if (!names.length) {
    throw new Error('no layers founds');
  }
  const geojson = names.map(function (name) {
    let parsed, dbf;
    const lastDotIdx = name.lastIndexOf('.');
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
      parsed = combine([parseShp(zip[name + '.shp'], zip[name + '.prj']), dbf]);
      parsed.fileName = name;
    }
    return parsed;
  });
  if (geojson.length === 1) {
    return geojson[0];
  } else {
    return geojson;
  }
};
async function getZip(base, whiteList) {
  const a = await binaryAjax(base);
  return parseZip(a, whiteList);
}
const handleShp = async (base) => {
  const args = await Promise.all([
    binaryAjax(base, 'shp'),
    binaryAjax(base, 'prj')
  ]);
  let prj = false;
  try {
    if (args[1]) {
      prj = proj4(args[1]);
    }
  } catch (e) {
    prj = false;
  }
  return parseShp(args[0], prj);
};
const handleDbf = async (base) => {
  const [dbf, cpg] = await Promise.all([
    binaryAjax(base, 'dbf'),
    binaryAjax(base, 'cpg')
  ]);
  if (!dbf) {
    return;
  }
  return parseDbf(dbf, cpg);
};
const checkSuffix = (base, suffix) => {
  const url = new URL(base);
  return url.pathname.slice(-4).toLowerCase() === suffix;
};
export const getShapefile = async function (base, whiteList) {
  if (typeof base !== 'string') {
    return parseZip(base);
  }
  if (checkSuffix(base, '.zip')) {
    return getZip(base, whiteList);
  }
  const results = await Promise.all([
    handleShp(base),
    handleDbf(base)
  ]);
  return combine(results);
};
const _parseShp = function (shp, prj) {
  shp = toBuffer(shp);
  if (Buffer.isBuffer(prj)) {
    prj = prj.toString();
  }
  if (typeof prj === 'string') {
    try {
      prj = proj4(prj);
    } catch (e) {
      prj = false;
    }
  }
  return parseShp(shp, prj);
};
const _parseDbf = function (dbf, cpg) {
  dbf = toBuffer(dbf);
  return parseDbf(dbf, cpg);
};
export default getShapefile;
export {
  _parseDbf as parseDbf,
  _parseShp as parseShp,
}