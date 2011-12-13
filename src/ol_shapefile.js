// Contributed by Matt Conway <indicatrix.wordpress.com>, <github.com/mattwigway>, Dec 2011.
// Based on a copy of layer.js

/** getOpenLayersFeatures
 * @param {String} url - the base url for the shapefile, without extensions
 * @param {Function} callback Called with an array of OpenLayers.Feature.Vector for the given URL
 */
function getOpenLayersFeatures(url, callback) {
    this.shpURL = url+'.shp';
    this.dbfURL = url+'.dbf';
    this.callback = callback;

    var instance = this;
    
    // Parse into OL features
    var parseShapefile = function () {
	// we can assume that shapefile and dbf have loaded at this point, but check anyhow
	if (!(instance.dbfFile && instance.shpFile)) return;
	
	var features = [];

	var recsLen = instance.shpFile.records.length;
	for (var i = 0; i < recsLen; i++) {
	    var record = instance.shpFile.records[i];
	    var attrs = instance.dbfFile.records[i];

	    // turn shapefile geometry into WKT
	    // points are easy!
	    if (instance.shpFile.header.shapeType == ShpType.SHAPE_POINT) {
		var wkt = 'POINT(' + record.shape.x + ' ' + record.shape.y + ')'
	    }

	    // lines: not too hard--
	    else if (instance.shpFile.header.shapeType == ShpType.SHAPE_POLYLINE) {
		// prepopulate the first point
		var points = [record.shape.rings[0].x + ' ' + record.shape.rings[0].y];
		var pointsLen = record.shape.rings[0].length;
		for (var i = 0; i < pointsLen; i++) {
		    points.push(record.shape.rings[0][i].x + ' ' + record.shape.rings[0][i].x);
		}
		
		var wkt = 'LINESTRING(' + points.join + ')';
	    }

	    // polygons: donuts
	    else if (instance.shpFile.header.shapeType == ShpType.SHAPE_POLYGON) {
		// TODO
		var wkt = 'POLYGON()';
	    }

	    var the_geom = OpenLayers.Geometry.fromWKT(wkt);
	    features.push(new OpenLayers.Feature.Vector(the_geom, attrs));
	}
	callback(features);
    };	
    
    var onShpFail = function() { 
	alert('failed to load ' + instance.shpURL);
    };
    var onDbfFail = function() { 
	alert('failed to load ' + instance.dbfURL);
    }

    var onShpComplete = function(oHTTP) {
	var binFile = oHTTP.binaryResponse;
	console.log('got data for ' + instance.shpURL + ', parsing shapefile');
	instance.shpFile = new ShpFile(binFile);
	if (instance.dbfFile) parseShapefile();
    }

    var onDbfComplete = function(oHTTP) {
	var binFile = oHTTP.binaryResponse;
	console.log('got data for ' + instance.dbfURL + ', parsing dbf file');
	instance.dbfFile = new DbfFile(binFile);
	if (instance.shpFile) parseShapefile();
    }  

    this.shpLoader = new BinaryAjax(shpURL, onShpComplete, onShpFail);
    this.dbfLoader = new BinaryAjax(dbfURL, onDbfComplete, onDbfFail);
}
