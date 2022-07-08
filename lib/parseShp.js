'use strict';

function isClockWise (array) {
  let sum = 0;
  let i = 1;
  const len = array.length;
  let prev, cur;
  while (i < len) {
    prev = cur || array[0];
    cur = array[i];
    sum += ((cur[0] - prev[0]) * (cur[1] + prev[1]));
    i++;
  }
  return sum > 0;
}

function polyReduce (a, b) {
  if (isClockWise(b) || !a.length) {
    a.push([b]);
  } else {
    a[a.length - 1].push(b);
  }
  return a;
}
ParseShp.prototype.parsePoint = function (data) {
  return {
    type: 'Point',
    coordinates: this.parseCoord(data, 0)
  };
};
ParseShp.prototype.parseZPoint = function (data) {
  const pointXY = this.parsePoint(data);
  pointXY.coordinates.push(data.readDoubleLE(16));
  return pointXY;
};
ParseShp.prototype.parsePointArray = function (data, offset, num) {
  const out = [];
  let done = 0;
  while (done < num) {
    out.push(this.parseCoord(data, offset));
    offset += 16;
    done++;
  }
  return out;
};
ParseShp.prototype.parseZPointArray = function (data, zOffset, num, coordinates) {
  let i = 0;
  while (i < num) {
    coordinates[i].push(data.readDoubleLE(zOffset));
    i++;
    zOffset += 8;
  }
  return coordinates;
};
ParseShp.prototype.parseArrayGroup = function (data, offset, partOffset, num, tot) {
  const out = [];
  let done = 0;
  let curNum; let nextNum = 0;
  let pointNumber;
  while (done < num) {
    done++;
    partOffset += 4;
    curNum = nextNum;
    if (done === num) {
      nextNum = tot;
    } else {
      nextNum = data.readInt32LE(partOffset);
    }
    pointNumber = nextNum - curNum;
    if (!pointNumber) {
      continue;
    }
    out.push(this.parsePointArray(data, offset, pointNumber));
    offset += (pointNumber << 4);
  }
  return out;
};
ParseShp.prototype.parseZArrayGroup = function (data, zOffset, num, coordinates) {
  let i = 0;
  while (i < num) {
    coordinates[i] = this.parseZPointArray(data, zOffset, coordinates[i].length, coordinates[i]);
    zOffset += (coordinates[i].length << 3);
    i++;
  }
  return coordinates;
};
ParseShp.prototype.parseMultiPoint = function (data) {
  const out = {};
  const num = data.readInt32LE(32, true);
  if (!num) {
    return null;
  }
  const mins = this.parseCoord(data, 0);
  const maxs = this.parseCoord(data, 16);
  out.bbox = [
    mins[0],
    mins[1],
    maxs[0],
    maxs[1]
  ];
  const offset = 36;
  if (num === 1) {
    out.type = 'Point';
    out.coordinates = this.parseCoord(data, offset);
  } else {
    out.type = 'MultiPoint';
    out.coordinates = this.parsePointArray(data, offset, num);
  }
  return out;
};
ParseShp.prototype.parseZMultiPoint = function (data) {
  const geoJson = this.parseMultiPoint(data);
  if (!geoJson) {
    return null;
  }
  let num;
  if (geoJson.type === 'Point') {
    geoJson.coordinates.push(data.readDoubleLE(72));
    return geoJson;
  } else {
    num = geoJson.coordinates.length;
  }
  const zOffset = 52 + (num << 4);
  geoJson.coordinates = this.parseZPointArray(data, zOffset, num, geoJson.coordinates);
  return geoJson;
};
ParseShp.prototype.parsePolyline = function (data) {
  const out = {};
  const numParts = data.readInt32LE(32);
  if (!numParts) {
    return null;
  }
  const mins = this.parseCoord(data, 0);
  const maxs = this.parseCoord(data, 16);
  out.bbox = [
    mins[0],
    mins[1],
    maxs[0],
    maxs[1]
  ];
  const num = data.readInt32LE(36);
  let offset, partOffset;
  if (numParts === 1) {
    out.type = 'LineString';
    offset = 44;
    out.coordinates = this.parsePointArray(data, offset, num);
  } else {
    out.type = 'MultiLineString';
    offset = 40 + (numParts << 2);
    partOffset = 40;
    out.coordinates = this.parseArrayGroup(data, offset, partOffset, numParts, num);
  }
  return out;
};
ParseShp.prototype.parseZPolyline = function (data) {
  const geoJson = this.parsePolyline(data);
  if (!geoJson) {
    return null;
  }
  const num = geoJson.coordinates.length;
  let zOffset;
  if (geoJson.type === 'LineString') {
    zOffset = 60 + (num << 4);
    geoJson.coordinates = this.parseZPointArray(data, zOffset, num, geoJson.coordinates);
    return geoJson;
  } else {
    const totalPoints = geoJson.coordinates.reduce(function (a, v) {
      return a + v.length;
    }, 0);
    zOffset = 56 + (totalPoints << 4) + (num << 2);
    geoJson.coordinates = this.parseZArrayGroup(data, zOffset, num, geoJson.coordinates);
    return geoJson;
  }
};
ParseShp.prototype.polyFuncs = function (out) {
  if (!out) {
    return out;
  }
  if (out.type === 'LineString') {
    out.type = 'Polygon';
    out.coordinates = [out.coordinates];
    return out;
  } else {
    out.coordinates = out.coordinates.reduce(polyReduce, []);
    if (out.coordinates.length === 1) {
      out.type = 'Polygon';
      out.coordinates = out.coordinates[0];
      return out;
    } else {
      out.type = 'MultiPolygon';
      return out;
    }
  }
};
ParseShp.prototype.parsePolygon = function (data) {
  return this.polyFuncs(this.parsePolyline(data));
};
ParseShp.prototype.parseZPolygon = function (data) {
  return this.polyFuncs(this.parseZPolyline(data));
};
const shpFuncObj = {
  1: 'parsePoint',
  3: 'parsePolyline',
  5: 'parsePolygon',
  8: 'parseMultiPoint',
  11: 'parseZPoint',
  13: 'parseZPolyline',
  15: 'parseZPolygon',
  18: 'parseZMultiPoint'
};

function makeParseCoord (trans) {
  if (trans) {
    return function (data, offset) {
      const args = [data.readDoubleLE(offset), data.readDoubleLE(offset + 8)];
      return trans.inverse(args);
    };
  } else {
    return function (data, offset) {
      return [data.readDoubleLE(offset), data.readDoubleLE(offset + 8)];
    };
  }
}

function ParseShp (buffer, trans) {
  if (!(this instanceof ParseShp)) {
    return new ParseShp(buffer, trans);
  }
  this.buffer = buffer;
  this.headers = this.parseHeader();
  if (this.headers.length < this.buffer.byteLength) {
    this.buffer = this.buffer.slice(0, this.headers.length);
  }
  this.shpFuncs(trans);
  this.rows = this.getRows();
}
ParseShp.prototype.shpFuncs = function (tran) {
  let num = this.headers.shpCode;
  if (num > 20) {
    num -= 20;
  }
  if (!(num in shpFuncObj)) {
    throw new Error('I don\'t know that shp type');
  }
  this.parseFunc = this[shpFuncObj[num]];
  this.parseCoord = makeParseCoord(tran);
};
ParseShp.prototype.getShpCode = function () {
  return this.parseHeader().shpCode;
};
ParseShp.prototype.parseHeader = function () {
  const view = this.buffer.slice(0, 100);
  return {
    length: view.readInt32BE(6 << 2) << 1,
    version: view.readInt32LE(7 << 2),
    shpCode: view.readInt32LE(8 << 2),
    bbox: [
      view.readDoubleLE(9 << 2),
      view.readDoubleLE(11 << 2),
      view.readDoubleLE(13 << 2),
      view.readDoubleLE(13 << 2)
    ]
  };
};
ParseShp.prototype.getRows = function () {
  let offset = 100;
  const len = this.buffer.byteLength;
  const out = [];
  let current;
  while (offset < len) {
    current = this.getRow(offset);
    if (!current) {
      break;
    }
    offset += 8;
    offset += current.len;
    if (current.type) {
      out.push(this.parseFunc(current.data));
    } else {
      out.push(null);
    }
  }
  return out;
};
ParseShp.prototype.getRow = function (offset) {
  const view = this.buffer.slice(offset, offset + 12);
  const len = view.readInt32BE(4) << 1;
  const id = view.readInt32BE(0);
  if (len === 0) {
    return {
      id: id,
      len: len,
      type: 0
    };
  }
  return {
    id: id,
    len: len,
    data: this.buffer.slice(offset + 12, offset + len + 8),
    type: view.readInt32LE(8)
  };
};
module.exports = function (buffer, trans) {
  return new ParseShp(buffer, trans).rows;
};
