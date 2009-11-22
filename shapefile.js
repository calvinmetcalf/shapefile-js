
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

function Point(x,y) {
  this.x = x;
  this.y = y;
}

function Rectangle(x,y,w,h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
}

/**
 * Constructor.
 * @param src
 * @return
 * @throws ShpError Not a valid shape file header
 * @throws ShpError Not a valid signature
 * 
 */                     
function ShapeHeader(src, binState)
{
    if (src.getLength() < 100)
        alert("Not a valid shape file header (too small)");

    if (src.getSLongAt(binState.offset, binState.bigEndian) != 9994)
        alert("Not a valid signature. Expected 9994");
    binState.offset += 4; 
 
    // skip 5 integers;
    binState.offset += 5*4;
    
    // read file-length:
    this.fileLength = src.getSLongAt(binState.offset, binState.bigEndian);
    binState.offset += 4;
 
    // switch endian:
    binState.bigEndian = false;
    
    // read version:
    this.version = src.getSLongAt(binState.offset, binState.bigEndian);
    binState.offset += 4;

    // read shape-type:
    this.shapeType = src.getSLongAt(binState.offset, binState.bigEndian);
    binState.offset += 4;
   
    var x = src.getDoubleAt(binState.offset, binState.bigEndian);
    binState.offset += 8;
    var y = src.getDoubleAt(binState.offset, binState.bigEndian);
    binState.offset += 8;
    var w = src.getDoubleAt(binState.offset, binState.bigEndian);
    binState.offset += 8;
    var h = src.getDoubleAt(binState.offset, binState.bigEndian);
    binState.offset += 8;
 
    // read bounds:
    this.boundsXY = new Rectangle(x,y,w,h);
    
    x = src.getDoubleAt(binState.offset, binState.bigEndian);
    binState.offset += 8;
    y = src.getDoubleAt(binState.offset, binState.bigEndian);
    binState.offset += 8;
    
    this.boundsZ = new Point(x,y);
    
    x = src.getDoubleAt(binState.offset, binState.bigEndian);
    binState.offset += 8;
    y = src.getDoubleAt(binState.offset, binState.bigEndian);
    binState.offset += 8;

    this.boundsM = new Point(x,y);
}


function ShpRecord(src, binState) {
    var availableBytes = src.getLength() - binState.offset;
    
    if (availableBytes == 0) 
            throw(new ShpError("No Data", ShpError.ERROR_NODATA));
            
    if (availableBytes < 8)
            throw(new ShpError("Not a valid record header (too small)"));
    
    binState.bigEndian = true;
    
    this.number = src.getSLongAt(binState.offset, binState.bigEndian);
    binState.offset += 4;
    this.contentLength = src.getSLongAt(binState.offset, binState.bigEndian);
    binState.offset += 4;
    this.contentLengthBytes = this.contentLength*2 - 4;                      
    binState.bigEndian = false;
    var shapeOffset = binState.offset;
    this.shapeType = src.getSLongAt(binState.offset, binState.bigEndian);
    binState.offset += 4;
                    
    switch(this.shapeType) {
            case ShpType.SHAPE_POINT:
                    this.shape = new ShpPoint(src, this.contentLengthBytes, binState);
                    break;
            case ShpType.SHAPE_POINTZ:
                    this.shape = new ShpPointZ(src, this.contentLengthBytes, binState);
                    break;
            case ShpType.SHAPE_POLYGON:
                    this.shape = new ShpPolygon(src, this.contentLengthBytes, binState);
                    break;
            case ShpType.SHAPE_POLYLINE:
                    this.shape = new ShpPolyline(src, this.contentLengthBytes, binState);
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

function ShpPoint(src, size, binState) {
    this.type = ShpType.SHAPE_POINT;
    if (src) {                      
        if (src.getLength() - binState.offset < size)
            throw(new ShpError("Not a Point record (too small)"));
        this.x = (size > 0)  ? src.getDoubleAt(binState.offset, binState.bigEndian) : NaN;
        binState.offset += 8;
        this.y = (size > 0)  ? src.getDoubleAt(binState.offset, binState.bigEndian) : NaN;
        binState.offset += 8;
    }
}
function ShpPointZ(src, size, binState) {
    this.type = ShpType.SHAPE_POINTZ;
    if (src) {
        if (src.getLength() - binState.offset < size)
            throw(new ShpError("Not a Point record (too small)"));
        this.x = (size > 0)  ? src.getDoubleAt(binState.offset, binState.bigEndian) : NaN;
        binState.offset += 8;
        this.y = (size > 0)  ? src.getDoubleAt(binState.offset, binState.bigEndian) : NaN;
        binState.offset += 8;
	this.z = (size > 16) ? src.getDoubleAt(binState.offset, binState.bigEndian) : NaN;                       
        binState.offset += 8;
	this.m = (size > 24) ? src.getDoubleAt(binState.offset, binState.bigEndian) : NaN;
        binState.offset += 8;
    }
}
function ShpPolygon(src, size, binState) {
    this.type = ShpType.SHAPE_POLYGON;
    this.rings = [];             
    if (src) {                      
            if (src.getLength() - binState.offset < size)
                    throw(new ShpError("Not a Polygon record (too small)"));
            
            binState.bigEndian = false;
            
            var x = src.getDoubleAt(binState.offset, binState.bigEndian);
            binState.offset += 8;
            var y = src.getDoubleAt(binState.offset, binState.bigEndian);
            binState.offset += 8;
            var w = src.getDoubleAt(binState.offset, binState.bigEndian);
            binState.offset += 8;
            var h = src.getDoubleAt(binState.offset, binState.bigEndian);
            binState.offset += 8;
            
            this.box = new Rectangle(x,y,w,h);
                    
            var rc = src.getSLongAt(binState.offset, binState.bigEndian);
            binState.offset += 4;
            var pc = src.getSLongAt(binState.offset, binState.bigEndian);
            binState.offset += 4;
            
            var ringOffsets = [];
            while(rc--) {
                var ringOffset = src.getSLongAt(binState.offset, binState.bigEndian);
                binState.offset += 4;
                ringOffsets.push(ringOffset);
            }
            
            var points = [];                 
            while(pc--) {
                points.push(new ShpPoint(src,16,binState));
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
function ShpPolyline(src, size, binState) {
    this.type = ShpType.SHAPE_POLYLINE;
    this.rings = [];             
    if (src) {                      
            if (src.getLength() - binState.offset < size)
                    throw(new ShpError("Not a Polygon record (too small)"));
            
            binState.bigEndian = false;
            
            var x = src.getDoubleAt(binState.offset, binState.bigEndian);
            binState.offset += 8;
            var y = src.getDoubleAt(binState.offset, binState.bigEndian);
            binState.offset += 8;
            var w = src.getDoubleAt(binState.offset, binState.bigEndian);
            binState.offset += 8;
            var h = src.getDoubleAt(binState.offset, binState.bigEndian);
            binState.offset += 8;
            
            this.box = new Rectangle(x,y,w,h);
                    
            var rc = src.getSLongAt(binState.offset, binState.bigEndian);
            binState.offset += 4;
            var pc = src.getSLongAt(binState.offset, binState.bigEndian);
            binState.offset += 4;
            
            var ringOffsets = [];
            while(rc--) {
                var ringOffset = src.getSLongAt(binState.offset, binState.bigEndian);
                binState.offset += 4;
                ringOffsets.push(ringOffset);
            }
            
            var points = [];                 
            while(pc--) {
                points.push(new ShpPoint(src,16,binState));
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

/**
 * Constructor.
 * @param msg
 * @param id
 * @return 
 * 
 */     
function ShpError(msg, id) {
	this.msg = msg;
	this.id = id;
	this.toString = function() {
		return this.msg;
	};
}
/**
 * Defines the identifier value of an undefined error.  
 */     
ShpError.ERROR_UNDEFINED = 0;
/**
 * Defines the identifier value of a 'no data' error, which is thrown
 * when a ByteArray runs out of data.
 */     
ShpError.ERROR_NODATA = 1;

var ShpTools = {
    readRecords: function(src, binState) {
        var records = [];
        while (true) {                  
            try {           
                records.push(new ShpRecord(src, binState));
            }
            catch (e) {
		if (e.id !== ShpError.ERROR_NODATA) {
                	alert(e);
		}
                break;
            }
        }
        return records;
    }
};
