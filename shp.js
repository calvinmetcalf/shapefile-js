//
// stateful helper for binaryajax.js's BinaryFile class
// 
// modelled on Flash's ByteArray, mostly, although some names
// (int/short/long) differ in definition
//

var BinaryFileWrapper = function BinaryFileWrapper(binFile) {
    
    this.position = 0;
    this.bigEndian = true;

    this.getByte = function() {
        var byte = binFile.getByteAt(this.position);
        this.position++;
        return byte;
    }

    this.getLength = function() {
        return binFile.getLength();
    }

    this.getSByte = function() {
        var sbyte = binFile.getSByteAt(this.position);
        this.position++;
        return sbyte;
    }

    this.getShort = function() {
        var short = binFile.getShortAt(this.position, this.bigEndian);
        this.position += 2;
        return short;
    }
    
    this.getSShort = function() {
        var sshort = binFile.getSShortAt(this.position, this.bigEndian);
        this.position += 2;
        return sshort;
    }
    
    this.getLong = function() {
        var l = binFile.getLongAt(this.position, this.bigEndian);
        this.position += 4;
        return l;
    }
    
    this.getSLong = function() {
        var l = binFile.getSLongAt(this.position, this.bigEndian);
        this.position += 4;
        return l;
    }
    
    this.getString = function(iLength) {
        var s = binFile.getStringAt(this.position, iLength);
        this.position += iLength;
        return s;
    }

    this.getDoubleAt = function(iOffset, bBigEndian) {
		// hugs stackoverflow
		// http://stackoverflow.com/questions/1597709/convert-a-string-with-a-hex-representation-of-an-ieee-754-double-into-javascript
		// TODO: check the endianness for something other than shapefiles
		// TODO: what about NaNs and Infinity?
		var a = binFile.getLongAt(iOffset + (bBigEndian ? 0 : 4), bBigEndian);
		var b = binFile.getLongAt(iOffset + (bBigEndian ? 4 : 0), bBigEndian);
		var s = a >> 31 ? -1 : 1;
		var e = (a >> 52 - 32 & 0x7ff) - 1023;
		return s * (a & 0xfffff | 0x100000) * 1.0 / Math.pow(2,52-32) * Math.pow(2, e) + b * 1.0 / Math.pow(2, 52) * Math.pow(2, e);
	}

    this.getDouble = function() {    
        var d = this.getDoubleAt(this.position, this.bigEndian);
        this.position += 8;
        return d;
    }

    this.getChar = function() {
        var c = binFile.getCharAt(this.position);
        this.position++;
        return c;
    }
};

// ported from http://code.google.com/p/vanrijkom-flashlibs/ under LGPL v2.1

var ShpFile = function ShpFile(binFile) {

    var src = new BinaryFileWrapper(binFile);

    var t1 = new Date().getTime();    
    this.header = new ShpHeader(src);

    var t2 = new Date().getTime();
    if (window.console && window.console.log) console.log('parsed header in ' + (t2-t1) + ' ms');    
        
    if (window.console && window.console.log) console.log('got header, parsing records');

    t1 = new Date().getTime();
    this.records = [];
    while (true) {                                    
        try {                     
                this.records.push(new ShpRecord(src));
        }
        catch (e) {
            if (e.id !== ShpError.ERROR_NODATA) {
                alert(e);
            }
            break;
        }
    }

    t2 = new Date().getTime();
    if (window.console && window.console.log) console.log('parsed records in ' + (t2-t1) + ' ms');    

}

/**
 * The ShpType class is a place holder for the ESRI Shapefile defined
 * shape types.
 * @author Edwin van Rijkom
 * 
 */     
var ShpType = {

    /**
     * Unknow Shape Type (for internal use) 
     */
    SHAPE_UNKNOWN : -1,
    /**
     * ESRI Shapefile Null Shape shape type.
     */     
    SHAPE_NULL : 0,
    /**
     * ESRI Shapefile Point Shape shape type.
     */
    SHAPE_POINT : 1,
    /**
     * ESRI Shapefile PolyLine Shape shape type.
     */
    SHAPE_POLYLINE : 3,
    /**
     * ESRI Shapefile Polygon Shape shape type.
     */
    SHAPE_POLYGON : 5,
    /**
     * ESRI Shapefile Multipoint Shape shape type
     * (currently unsupported).
     */
    SHAPE_MULTIPOINT : 8,
    /**
     * ESRI Shapefile PointZ Shape shape type.
     */
    SHAPE_POINTZ : 11,
    /**
     * ESRI Shapefile PolylineZ Shape shape type
     * (currently unsupported).
     */
    SHAPE_POLYLINEZ : 13,
    /**
     * ESRI Shapefile PolygonZ Shape shape type
     * (currently unsupported).
     */
    SHAPE_POLYGONZ : 15,
    /**
     * ESRI Shapefile MultipointZ Shape shape type
     * (currently unsupported).
     */
    SHAPE_MULTIPOINTZ : 18,
    /**
     * ESRI Shapefile PointM Shape shape type
     */
    SHAPE_POINTM : 21,
    /**
     * ESRI Shapefile PolyLineM Shape shape type
     * (currently unsupported).
     */
    SHAPE_POLYLINEM : 23,
    /**
     * ESRI Shapefile PolygonM Shape shape type
     * (currently unsupported).
     */
    SHAPE_POLYGONM : 25,
    /**
     * ESRI Shapefile MultiPointM Shape shape type
     * (currently unsupported).
     */
    SHAPE_MULTIPOINTM : 28,
    /**
     * ESRI Shapefile MultiPatch Shape shape type
     * (currently unsupported).
     */
    SHAPE_MULTIPATCH : 31

};


/**
 * Constructor.
 * @param src
 * @return
 * @throws ShpError Not a valid shape file header
 * @throws ShpError Not a valid signature
 * 
 */                     
var ShpHeader = function ShpHeader(src){
    if (src.getLength() < 100)
        alert("Not a valid shape file header (too small)");

    if (src.getSLong() != 9994)
        alert("Not a valid signature. Expected 9994");
 
    // skip 5 integers;
    src.position += 5*4;
    
    // read file-length:
    this.fileLength = src.getSLong();
 
    // switch endian:
    src.bigEndian = false;
    
    // read version:
    this.version = src.getSLong();

    // read shape-type:
    this.shapeType = src.getSLong();
   
    // read bounds:
    this.boundsXY = { x: src.getDouble(), 
                      y: src.getDouble(),
                      width: src.getDouble(),
                      height: src.getDouble() };
    
    this.boundsZ = { x: src.getDouble(), y: src.getDouble() };
    
    this.boundsM = { x: src.getDouble(), y: src.getDouble() };
}


var ShpRecord = function ShpRecord(src) {
    var availableBytes = src.getLength() - src.position;
    
    if (availableBytes == 0) 
        throw(new ShpError("No Data", ShpError.ERROR_NODATA));
            
    if (availableBytes < 8)
        throw(new ShpError("Not a valid record header (too small)"));
    
    src.bigEndian = true;
    
    this.number = src.getSLong();
    this.contentLength = src.getSLong();
    this.contentLengthBytes = this.contentLength*2 - 4;                      
    src.bigEndian = false;
    var shapeOffset = src.position;
    this.shapeType = src.getSLong();
                    
    switch(this.shapeType) {
        case ShpType.SHAPE_POINT:
            this.shape = new ShpPoint(src, this.contentLengthBytes);
            break;
        case ShpType.SHAPE_POINTZ:
            this.shape = new ShpPointZ(src, this.contentLengthBytes);
            break;
        case ShpType.SHAPE_POLYGON:
            this.shape = new ShpPolygon(src, this.contentLengthBytes);
            break;
        case ShpType.SHAPE_POLYLINE:
            this.shape = new ShpPolyline(src, this.contentLengthBytes);
            break;
        case ShpType.SHAPE_MULTIPATCH:
        case ShpType.SHAPE_MULTIPOINT:
        case ShpType.SHAPE_MULTIPOINTM:
        case ShpType.SHAPE_MULTIPOINTZ:
        case ShpType.SHAPE_POINTM:
        case ShpType.SHAPE_POLYGONM:
        case ShpType.SHAPE_POLYGONZ:
        case ShpType.SHAPE_POLYLINEZ:
        case ShpType.SHAPE_POLYLINEM:
            throw(new ShpError(this.shapeType+" Shape type is currently unsupported by this library"));
            break;  
        default:        
            throw(new ShpError("Encountered unknown shape type ("+this.shapeType+")"));
            break;
    }
}

var ShpPoint = function ShpPoint(src, size) {
    this.type = ShpType.SHAPE_POINT;
    if (src) {                      
        if (src.getLength() - src.position < size)
            throw(new ShpError("Not a Point record (too small)"));
        this.x = (size > 0)  ? src.getDouble() : NaN;
        this.y = (size > 0)  ? src.getDouble() : NaN;
    }
}
var ShpPointZ = function ShpPointZ(src, size) {
    this.type = ShpType.SHAPE_POINTZ;
    if (src) {
        if (src.getLength() - src.position < size)
            throw(new ShpError("Not a Point record (too small)"));
        this.x = (size > 0)  ? src.getDouble() : NaN;
        this.y = (size > 0)  ? src.getDouble() : NaN;
        this.z = (size > 16) ? src.getDouble() : NaN;                       
        this.m = (size > 24) ? src.getDouble() : NaN;
    }
}
var ShpPolygon =function ShpPolygon(src, size) {
    // for want of a super()
    ShpPolyline.apply(this, [src, size]);
    this.type = ShpType.SHAPE_POLYGON;
}
var ShpPolyline = function ShpPolyline(src, size) {
    this.type = ShpType.SHAPE_POLYLINE;
    this.rings = [];             
    if (src) {                      
        if (src.getLength() - src.position < size)
            throw(new ShpError("Not a Polygon record (too small)"));
        
        src.bigEndian = false;
        
        this.box = { x: src.getDouble(),
                     y: src.getDouble(),
                     width: src.getDouble(),
                     height: src.getDouble() };
                
        var rc = src.getSLong();
        var pc = src.getSLong();
        
        var ringOffsets = [];
        while(rc--) {
            var ringOffset = src.getSLong();
            ringOffsets.push(ringOffset);
        }
        
        var points = [];                 
        while(pc--) {
            points.push(new ShpPoint(src,16));
        }
        
        // convert points, and ringOffsets arrays to an array of rings:
        var removed = 0;
        var split;
        ringOffsets.shift();                    
        while(ringOffsets.length) {
            split = ringOffsets.shift();
            this.rings.push(points.splice(0,split-removed));
            removed = split;
        }       
        this.rings.push(points);                                     
    }
}

var ShpError = function ShpError(msg, id) {
    this.msg = msg;
    this.id = id;
    this.toString = function() {
        return this.msg;
    };
}
ShpError.ERROR_UNDEFINED = 0;
// a 'no data' error is thrown when the byte array runs out of data.
ShpError.ERROR_NODATA = 1;


// ported from http://code.google.com/p/vanrijkom-flashlibs/ under LGPL v2.1

var DbfFile = function DbfFile(binFile) {

    this.src = new BinaryFileWrapper(binFile);

    var t1 = new Date().getTime();    

    this.header = new DbfHeader(this.src);

    var t2 = new Date().getTime();
    if (window.console && window.console.log) console.log('parsed dbf header in ' + (t2-t1) + ' ms');    

    t1 = new Date().getTime();    
    
    // TODO: could maybe be smarter about this and only parse these on demand
    this.records = [];
    for (var i = 0; i < this.header.recordCount; i++) {
        var record = this.getRecord(i);
        this.records.push(record);
    }    

    t2 = new Date().getTime();
    if (window.console && window.console.log) console.log('parsed dbf records in ' + (t2-t1) + ' ms');    
    
}
DbfFile.prototype.getRecord = function(index) {

    if (index > this.header.recordCount) {
        throw(new DbfError("",DbfError.ERROR_OUTOFBOUNDS));
    }

    this.src.position = this.header.recordsOffset + index * this.header.recordSize;
    this.src.bigEndian = false;

    return new DbfRecord(this.src, this.header);
}


var DbfHeader = function DbfHeader(src) {
    
    // endian:
    src.bigEndian = false;

    this.version = src.getSByte();
    this.updateYear = 1900+src.getByte();
    this.updateMonth = src.getByte();
    this.updateDay = src.getByte();
    this.recordCount = src.getLong();
    this.headerSize = src.getShort();
    this.recordSize = src.getShort();

    //skip 2:
    src.position += 2;

    this.incompleteTransaction = src.getByte();
    this.encrypted = src.getByte();

    // skip 12:
    src.position += 12;

    this.mdx = src.getByte();
    this.language = src.getByte();

    // skip 2;
    src.position += 2;

    // iterate field descriptors:
    this.fields = [];
    while (src.getSByte() != 0x0D){
        src.position -= 1;
        this.fields.push(new DbfField(src));
    }

    this.recordsOffset = this.headerSize+1;                                                                    
    
}                

var DbfField = function DbfField(src) {

    this.name = this.readZeroTermANSIString(src);

    // fixed length: 10, so:
    src.position += (10-this.name.length);

    this.type = src.getByte();
    this.address = src.getLong();
    this.length = src.getByte();
    this.decimals = src.getByte();

    // skip 2:
    src.position += 2;

    this.id = src.getByte();

    // skip 2:
    src.position += 2;

    this.setFlag = src.getByte();

    // skip 7:
    src.position += 7;

    this.indexFlag = src.getByte();
}
DbfField.prototype.readZeroTermANSIString = function(src) {
    var r = [];
    var b;
    while (b = src.getByte()) {
        r[r.length] = String.fromCharCode(b);
    }
    return r.join('');
}

var DbfRecord = function DbfRecord(src, header) {
    this.offset = src.position;
    this.values = {}
    for (var i = 0; i < header.fields.length; i++) {
        var field = header.fields[i];
        this.values[field.name] = src.getString(field.length);
    }                             
}


/*
 * Binary Ajax 0.1.7
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * Licensed under the MPL License [http://www.nihilogic.dk/licenses/mpl-license.txt]
 */


var BinaryFile = function(strData, iDataOffset, iDataLength) {
    var data = strData;
	var dataOffset = iDataOffset || 0;
	var dataLength = 0;

	this.getRawData = function() {
		return data;
	}

	if (typeof strData == "string") {
		dataLength = iDataLength || data.length;

		this.getByteAt = function(iOffset) {
			return data.charCodeAt(iOffset + dataOffset) & 0xFF;
		}
	} else if (typeof strData == "unknown") {
		dataLength = iDataLength || IEBinary_getLength(data);

		this.getByteAt = function(iOffset) {
			return IEBinary_getByteAt(data, iOffset + dataOffset);
		}
	}

	this.getLength = function() {
		return dataLength;
	}

	this.getSByteAt = function(iOffset) {
		var iByte = this.getByteAt(iOffset);
		if (iByte > 127)
			return iByte - 256;
		else
			return iByte;
	}

	this.getShortAt = function(iOffset, bBigEndian) {
		var iShort = bBigEndian ? 
			(this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
			: (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
		if (iShort < 0) iShort += 65536;
		return iShort;
	}
	this.getSShortAt = function(iOffset, bBigEndian) {
		var iUShort = this.getShortAt(iOffset, bBigEndian);
		if (iUShort > 32767)
			return iUShort - 65536;
		else
			return iUShort;
	}
	this.getLongAt = function(iOffset, bBigEndian) {
		var iByte1 = this.getByteAt(iOffset),
			iByte2 = this.getByteAt(iOffset + 1),
			iByte3 = this.getByteAt(iOffset + 2),
			iByte4 = this.getByteAt(iOffset + 3);

		var iLong = bBigEndian ? 
			(((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
			: (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
		if (iLong < 0) iLong += 4294967296;
		return iLong;
	}
	this.getSLongAt = function(iOffset, bBigEndian) {
		var iULong = this.getLongAt(iOffset, bBigEndian);
		if (iULong > 2147483647)
			return iULong - 4294967296;
		else
			return iULong;
	}
	this.getStringAt = function(iOffset, iLength) {
		var aStr = [];
		for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
			aStr[j] = String.fromCharCode(this.getByteAt(i));
		}
		return aStr.join("");
	}

	this.getCharAt = function(iOffset) {
		return String.fromCharCode(this.getByteAt(iOffset));
	}
	this.toBase64 = function() {
		return window.btoa(data);
	}
	this.fromBase64 = function(strBase64) {
		data = window.atob(strBase64);
	}
}


var BinaryAjax = (function() {

	function createRequest() {
		var oHTTP = null;
		if (window.XMLHttpRequest) {
			oHTTP = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			oHTTP = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return oHTTP;
	}

	function getHead(strURL, fncCallback, fncError) {
		var oHTTP = createRequest();
		if (oHTTP) {
			if (fncCallback) {
				if (typeof(oHTTP.onload) != "undefined") {
					oHTTP.onload = function() {
						if (oHTTP.status == "200") {
							fncCallback(this);
						} else {
							if (fncError) fncError();
						}
						oHTTP = null;
					};
				} else {
					oHTTP.onreadystatechange = function() {
						if (oHTTP.readyState == 4) {
							if (oHTTP.status == "200") {
								fncCallback(this);
							} else {
								if (fncError) fncError();
							}
							oHTTP = null;
						}
					};
				}
			}
			oHTTP.open("HEAD", strURL, true);
			oHTTP.send(null);
		} else {
			if (fncError) fncError();
		}
	}

	function sendRequest(strURL, fncCallback, fncError, aRange, bAcceptRanges, iFileSize) {
		var oHTTP = createRequest();
		if (oHTTP) {

			var iDataOffset = 0;
			if (aRange && !bAcceptRanges) {
				iDataOffset = aRange[0];
			}
			var iDataLen = 0;
			if (aRange) {
				iDataLen = aRange[1]-aRange[0]+1;
			}

			if (fncCallback) {
				if (typeof(oHTTP.onload) != "undefined") {
					oHTTP.onload = function() {

						if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
							oHTTP.binaryResponse = new BinaryFile(oHTTP.responseText, iDataOffset, iDataLen);
							oHTTP.fileSize = iFileSize || oHTTP.getResponseHeader("Content-Length");
							fncCallback(oHTTP);
						} else {
							if (fncError) fncError();
						}
						oHTTP = null;
					};
				} else {
					oHTTP.onreadystatechange = function() {
						if (oHTTP.readyState == 4) {
							if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
								// IE6 craps if we try to extend the XHR object
								var oRes = {
									status : oHTTP.status,
									binaryResponse : new BinaryFile(oHTTP.responseBody, iDataOffset, iDataLen),
									fileSize : iFileSize || oHTTP.getResponseHeader("Content-Length")
								};
								fncCallback(oRes);
							} else {
								if (fncError) fncError();
							}
							oHTTP = null;
						}
					};
				}
			}
			oHTTP.open("GET", strURL, true);

			if (oHTTP.overrideMimeType) oHTTP.overrideMimeType('text/plain; charset=x-user-defined');

			if (aRange && bAcceptRanges) {
				oHTTP.setRequestHeader("Range", "bytes=" + aRange[0] + "-" + aRange[1]);
			}

			oHTTP.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");

			oHTTP.send(null);
		} else {
			if (fncError) fncError();
		}
	}

	return function(strURL, fncCallback, fncError, aRange) {

		if (aRange) {
			getHead(
				strURL, 
				function(oHTTP) {
					var iLength = parseInt(oHTTP.getResponseHeader("Content-Length"),10);
					var strAcceptRanges = oHTTP.getResponseHeader("Accept-Ranges");

					var iStart, iEnd;
					iStart = aRange[0];
					if (aRange[0] < 0) 
						iStart += iLength;
					iEnd = iStart + aRange[1] - 1;

					sendRequest(strURL, fncCallback, fncError, [iStart, iEnd], (strAcceptRanges == "bytes"), iLength);
				}
			);

		} else {
			sendRequest(strURL, fncCallback, fncError);
		}
	}

}());
var shp = function(params){
   params=params||{};
var url = {};
url.base = params.url;
url.shp= url.base + ".shp";
url.dbf= url.base + ".dbf";
var _name=this;
var cb = params.cb;
var _onfail = function(){
 alert("whoops");   
}
var _dbf,_shp;


var _shpData = function(data){
    _shp =  new ShpFile(data.binaryResponse);
    
    if(_dbf){
     _render();   
    }
}
var _dbfData = function(data){
    _dbf =  new DbfFile(data.binaryResponse);
       if(_shp){
     _render();   
    }
}
var _onfail = function(){
 alert("whoops");   
}
var doSomething = function(){
    if(cb){
     cb();   
    }
}
var _render = function(){
    shp = _shp;
    dbf = _dbf;
  _name.bounds={
      x:shp.header.boundsXY.x,
      y:shp.header.boundsXY.y,
      height:shp.header.boundsXY.height,
      width:shp.header.boundsXY.width,
      m:{
        x:shp.header.boundsM.x,
      y:shp.header.boundsM.y,
      },
      z:{
        x:shp.header.boundsZ.x,
      y:shp.header.boundsZ.y,
      }
      };
      _shptype = shp.header.shapeType;
      _name.type = _geotype[_shptype];
      _name.fields = [];

      for(var i = 0,len=dbf.header.fields.length;i<len;i++){
       _name.fields.push(dbf.header.fields[i].name);  
      }
       _name.shapes=[];
     if(_name.type=="Point"){
        for(var i=0,lenz=shp.records.length;i<lenz;i++){
    var record = {};
    record.point = {
        x: shp.records[i].shape.x,
         y: shp.records[i].shape.y}
  
      record.fields=dbf.records[i].values
     _name.shapes.push(record);
  };   
     }else{    
  for(var i=0,lenz=shp.records.length;i<lenz;i++){
    var record = {};
    record.geometry = shp.records[i].shape;
  
      record.fields=dbf.records[i].values
    _name.shapes.push(record);
  };
     }; 
     doSomething();
};
var _shpNums = {

    /**
     * Unknow Shape Type (for internal use) 
     */
    "-1": "unk",
    /**
     * ESRI Shapefile Null Shape shape type.
     */     
    "0": "null",
    /**
     * ESRI Shapefile Point Shape shape type.
     */
    "1": "point",
    /**
     * ESRI Shapefile PolyLine Shape shape type.
     */
    "3": "Polyline",
    /**
     * ESRI Shapefile Polygon Shape shape type.
     */
    "5":"Polygon",
    /**
     * ESRI Shapefile Multipoint Shape shape type
     * (currently unsupported).
     */
    "8":"Multipoint",
    /**
     * ESRI Shapefile PointZ Shape shape type.
     */
    "11": "Point Z",
    /**
     * ESRI Shapefile PolylineZ Shape shape type
     * (currently unsupported).
     */
    "13": "Polyline Z",
    /**
     * ESRI Shapefile PolygonZ Shape shape type
     * (currently unsupported).
     */
    "15": "Polygon Z",
    /**
     * ESRI Shapefile MultipointZ Shape shape type
     * (currently unsupported).
     */
    "18": "Multipoint Z",
    /**
     * ESRI Shapefile PointM Shape shape type
     */
    "21": "Point M",
    /**
     * ESRI Shapefile PolyLineM Shape shape type
     * (currently unsupported).
     */
    "23": "PolyLine M",
    /**
     * ESRI Shapefile PolygonM Shape shape type
     * (currently unsupported).
     */
    "25": "Polygon M",
    /**
     * ESRI Shapefile MultiPointM Shape shape type
     * (currently unsupported).
     */
   "28": "Multipoint M",
    /**
     * ESRI Shapefile MultiPatch Shape shape type
     * (currently unsupported).
     */
    "31": "Multipatch"

};

var _geotype = {

    /**
     * Unknow Shape Type (for internal use) 
     */
    "-1": "unk",
    /**
     * ESRI Shapefile Null Shape shape type.
     */     
    "0": "null",
    /**
     * ESRI Shapefile Point Shape shape type.
     */
    "1": "Point",
    /**
     * ESRI Shapefile PolyLine Shape shape type.
     */
    "3": "Polyline",
    /**
     * ESRI Shapefile Polygon Shape shape type.
     */
    "5":"Polygon",
    /**
     * ESRI Shapefile Multipoint Shape shape type
     * (currently unsupported).
     */
    "8":"Multipoint",
    /**
     * ESRI Shapefile PointZ Shape shape type.
     */
    "11": "Point",
    /**
     * ESRI Shapefile PolylineZ Shape shape type
     * (currently unsupported).
     */
    "13": "Polyline",
    /**
     * ESRI Shapefile PolygonZ Shape shape type
     * (currently unsupported).
     */
    "15": "Polygon",
    /**
     * ESRI Shapefile MultipointZ Shape shape type
     * (currently unsupported).
     */
    "18": "Multipoint",
    /**
     * ESRI Shapefile PointM Shape shape type
     */
    "21": "Point",
    /**
     * ESRI Shapefile PolyLineM Shape shape type
     * (currently unsupported).
     */
    "23": "PolyLine",
    /**
     * ESRI Shapefile PolygonM Shape shape type
     * (currently unsupported).
     */
    "25": "Polygon",
    /**
     * ESRI Shapefile MultiPointM Shape shape type
     * (currently unsupported).
     */
   "28": "Multipoint",
    /**
     * ESRI Shapefile MultiPatch Shape shape type
     * (currently unsupported).
     */
    "31": "unk"

};
var _shploader =  new BinaryAjax(url.shp,_shpData,_onfail);
var _dbfloader =  new BinaryAjax(url.dbf,_dbfData,_onfail);
};

