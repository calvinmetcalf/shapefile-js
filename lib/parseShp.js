'use strict';
function isClockWise(array){
	var sum = 0;
	var i = 1;
	var len = array.length;
	var prev,cur;
	while(i<len){
		prev = cur||array[0];
		cur = array[i];
		sum += ((cur[0]-prev[0])*(cur[1]+prev[1]));
		i++;
	}
	return sum > 0;
}
function polyReduce(a,b){
	if(isClockWise(b)||!a.length){
		a.push([b]);
	}else{
		a[a.length-1].push(b);
	}
	return a;
}
ParseShp.prototype.parsePoint = function (data){
	return {
		'type': 'Point',
		'coordinates': this.parseCoord(data,0)
	};
};
ParseShp.prototype.parseZPoint = function (data){
	var pointXY = this.parsePoint(data);
	pointXY.coordinates.push(this.parseCoord(data,16));
	return pointXY;
};
ParseShp.prototype.parsePointArray = function (data,offset,num){
	var out = [];
	var done = 0;
	while(done<num){
		out.push(this.parseCoord(data,offset));
		offset += 16;
		done++;
	}
	return out;
};
ParseShp.prototype.parseZPointArray = function (data,zOffset,num,coordinates){
	var i = 0;
	while(i<num){
		coordinates[i].push(data.getFloat64(zOffset,true));
		i++;
		zOffset += 8;
	}
	return coordinates;
};
ParseShp.prototype.parseArrayGroup = function (data,offset,partOffset,num,tot){
	var out = [];
	var done = 0;
	var curNum,nextNum=0,pointNumber;
	while(done<num){
		done++;
		partOffset += 4;
		curNum = nextNum;
		if(done===num){
			nextNum = tot;
		}else{
			nextNum = data.getInt32(partOffset,true);
		}
		pointNumber = nextNum - curNum;
		if(!pointNumber){
			continue;
		}
		out.push(this.parsePointArray(data,offset,pointNumber));
		offset += (pointNumber<<4);
	}
	return out;
};
ParseShp.prototype.parseZArrayGroup = function(data,zOffset,num,coordinates){
	var i = 0;
	while(i<num){
		coordinates[i] = this.parseZPointArray(data,zOffset,coordinates[i].length,coordinates[i]);
		zOffset += (coordinates[i].length<<3);
		i++;
	}
	return coordinates;
};
ParseShp.prototype.parseMultiPoint = function (data){
	var out = {};
	var mins = this.parseCoord(data,0);
	var maxs = this.parseCoord(data,16);
	out.bbox = [
		mins[0],
		mins[1],
		maxs[0],
		maxs[1]
	];
	var num = data.getInt32(32,true);
	var offset = 36;
	if(num===1){
		out.type = 'Point';
		out.coordinates = this.parseCoord(data,offset);
	}else{
		out.type = 'MultiPoint';
		out.coordinates = this.parsePointArray(data,offset,num);
	}
	return out;
};
ParseShp.prototype.parseZMultiPoint = function(data){
	var geoJson = this.parseMultiPoint(data);
	var num;
	if(geoJson.type === 'Point'){
		geoJson.coordinates.push(data.getFloat64(72,true));
		return geoJson;
	}else{
		num = geoJson.coordinates.length;
	}
	var zOffset = 56 + (num<<4);
	geoJson.coordinates =  this.parseZPointArray(data,zOffset,num,geoJson.coordinates);
	return geoJson;
};
ParseShp.prototype.parsePolyline = function (data){
	var out = {};
	var mins = this.parseCoord(data,0);
	var maxs = this.parseCoord(data,16);
	out.bbox = [
		mins[0],
		mins[1],
		maxs[0],
		maxs[1]
	];
	var numParts = data.getInt32(32,true);
	var num = data.getInt32(36,true);
	var offset,partOffset;
	if(numParts === 1){
		out.type = 'LineString';
		offset = 44;
		out.coordinates = this.parsePointArray(data,offset,num);
	}else{
		out.type = 'MultiLineString';
		offset = 40 + (numParts<<2);
		partOffset = 40;
		out.coordinates = this.parseArrayGroup(data,offset,partOffset,numParts,num);
	}
	return out;
};
ParseShp.prototype.parseZPolyline = function(data){
	var geoJson = this.parsePolyline(data);
	var num = geoJson.coordinates.length;
	var zOffset = 60 + (num<<4);
	if(geoJson.type === 'LineString'){
		geoJson.coordinates =  this.parseZPointArray(data,zOffset,num,geoJson.coordinates);
		return geoJson;
	}else{
		geoJson.coordinates =  this.parseZArrayGroup(data,zOffset,num,geoJson.coordinates);
		return geoJson;
	}
};
ParseShp.prototype.polyFuncs = function (out){
	if(out.type === 'LineString'){
		out.type = 'Polygon';
		out.coordinates = [out.coordinates];
		return out;
	}else{
		out.coordinates = out.coordinates.reduce(polyReduce,[]);
		if(out.coordinates.length === 1){
			out.type = 'Polygon';
			out.coordinates = out.coordinates[0];
			return out;
		}else{
			out.type = 'MultiPolygon';
			return out;
		}
	}
};
ParseShp.prototype.parsePolygon = function (data){
	return this.polyFuncs(this.parsePolyline(data));
};
ParseShp.prototype.parseZPolygon = function(data){
	return this.polyFuncs(this.parseZPolyline(data));
};
var shpFuncObj = {
	1:'parsePoint',
	3:'parsePolyline',
	5:'parsePolygon',
	8:'parseMultiPoint',
	11:'parseZPoint',
	13:'parseZPolyline',
	15:'parseZPolygon',
	18:'parseZMultiPoint'
};



function makeParseCoord(trans){
	if(trans){
		return function(data,offset){
			return trans.inverse([data.getFloat64(offset,true),data.getFloat64(offset+8,true)]);
		};
	}else{
		return function(data,offset){
			return [data.getFloat64(offset,true),data.getFloat64(offset+8,true)];
		};
	}
}
function ParseShp(buffer,trans){
	if(!(this instanceof ParseShp)){
		return new ParseShp(buffer,trans);
	}
	this.buffer = buffer;
	this.shpFuncs(trans);
	this.rows = this.getRows();
}
ParseShp.prototype.shpFuncs = function (tran){
	var num = this.getShpCode();
	if(num>20){
		num -= 20;
	}
	if(!(num in shpFuncObj)){
		throw new Error('I don\'t know that shp type');
	}
	this.parseFunc = this[shpFuncObj[num]];
	this.parseCoord = makeParseCoord(tran);
};
ParseShp.prototype.getShpCode = function(){
	return this.parseHeader().shpCode;
};
ParseShp.prototype.parseHeader = function (){
	var view = new DataView(this.buffer,0,100) ;
	return {
		length : view.getInt32(6<<2,false),
		version : view.getInt32(7<<2,true),
		shpCode : view.getInt32(8<<2,true),
		bbox : [
			view.getFloat64(9<<2,true),
			view.getFloat64(11<<2,true),
			view.getFloat64(13<<2,true),
			view.getFloat64(13<<2,true)
		]
	};
};
ParseShp.prototype.getRows = function(){
	var offset=100;
	var len = this.buffer.byteLength;
	var out = [];
	var current;
	while(offset<len){
		current = this.getRow(offset);
		offset += 8;
		offset += current.len;
		if(current.type){
			out.push(this.parseFunc(current.data));
		}
	}
	return out;
};
ParseShp.prototype.getRow = function(offset){
	var view = new DataView(this.buffer,offset,12);
	var len = view.getInt32(4,false) << 1;
	var data = new DataView(this.buffer,offset+12,len - 4);
	
	return {
		id:view.getInt32(0,false),
		len:len,
		data:data,
		type:view.getInt32(8,true)
	};
};
module.exports = function(buffer, trans){
	return new ParseShp(buffer, trans).rows;
};