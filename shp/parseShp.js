define(function(){
var parseHeader = function(buffer){
	var view = new DataView(buffer,0,100) 
	//if(view.getInt32(0,false)!==9994){
	//	return shp.reject("wrong type");
	//}
	return /*shp.resolve(*/{
		length : view.getInt32(6<<2,false),
		version : view.getInt32(7<<2,true),
		shpCode : view.getInt32(8<<2,true),
		bbox : [
			view.getFloat64(9<<2,true),
			view.getFloat64(11<<2,true),
			view.getFloat64(13<<2,true),
			view.getFloat64(13<<2,true)
		]
	}/*)*/;
}
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
	if(isClockWise(b)){
		a.push([b]);
	}else{
		a[a.length-1].push(b);
	}
	return a;
}
function parsePoint(data,trans){
	return {
		"type": "Point",
		"coordinates":trans(data,0)
	};
}
function parseZPoint(data,trans){
	var pointXY = parsePoint(data,trans);
	pointXY.coordinates.push(trans(data,16));
	return pointXY;
}
function parsePointArray(data,offset,num,trans){
	var out = [];
	var done = 0;
	while(done<num){
		out.push(trans(data,offset));
		offset += 16;
		done++;
	}
	return out;
}
function parseZPointArray(data,zOffset,num,coordinates){
	var i = 0;
	while(i<num){
		coordinates[i].push(data.getFloat64(zOffset,true));
		i++;
		zOffset += 8;
	}
	return coordinates;
}
function parseArrayGroup(data,offset,partOffset,num,tot,trans){
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
		out.push(parsePointArray(data,offset,pointNumber,trans));
		offset += (pointNumber<<4);
	}
	return out;
}
function parseZArrayGroup(data,zOffset,num,coordinates){
	var i = 0;
	while(i<num){
		coordinates[i] = parseZPointArray(data,zOffset,coordinates[i].length,coordinates[i]);
		zOffset += (coordinates[i].length<<3);
		i++;
	}
	return coordinates;
}
function parseMultiPoint(data,trans){
	var out = {};
	out.bbox = [
		data.getFloat64(0,true),
		data.getFloat64(8,true),
		data.getFloat64(16,true),
		data.getFloat64(24,true)
	];
	var num = data.getInt32(32,true);
	var offset = 36;
	if(num===1){
		out.type = "Point";
		out.coordinates = trans(data,offset);
	}else{
		out.type = "MultiPoint";
		out.coordinates = parsePointArray(data,offset,num,trans);
	}
	return out;
}
function parseZMultiPoint(data,trans){
	var geoJson = parseMultiPoint(data,trans);
	var num;
	if(geoJson.type === "Point"){
		geoJson.coordinates.push(data.getFloat64(72,true));
		return geoJson;
	}else{
		num = geoJson.coordinates.length;
	}
	var zOffset = 56 + (num<<4);
	geoJson.coordinates =  parseZPointArray(data,zOffset,num,geoJson.coordinates);
	return geoJson;
}
function parsePolyline(data,trans){
	var out = {};
	out.bbox = [
		data.getFloat64(0,true),
		data.getFloat64(8,true),
		data.getFloat64(16,true),
		data.getFloat64(24,true)
	];
	var numParts = data.getInt32(32,true);
	var num = data.getInt32(36,true);
	var offset,partOffset;
	if(numParts === 1){
		out.type = "LineString";
		offset = 44;
		out.coordinates = parsePointArray(data,offset,num,trans);
	}else{
		out.type = "MultiLineString";
		offset = 40 + (numParts<<2);
		partOffset = 40;
		out.coordinates = parseArrayGroup(data,offset,partOffset,numParts,num,trans);
	}
	return out;
}
function parseZPolyline(data,trans){
	var geoJson = parsePolyline(data,trans);
	var num = geoJson.coordinates.length;
	var zOffset = 60 + (num<<4);
	if(geoJson.type === "LineString"){
		geoJson.coordinates =  parseZPointArray(data,zOffset,num,geoJson.coordinates);
		return geoJson;
	}else{
		geoJson.coordinates =  parseZArrayGroup(data,zOffset,num,geoJson.coordinates);
		return geoJson;
	}
}
function polyFuncs(out){
	if(out.type === "LineString"){
		out.type = "Polygon";
		out.coordinates = [out.coordinates];
		return out;
	}else{
		out.coordinates = out.coordinates.reduce(polyReduce,[]);
		if(out.coordinates.length === 1){
			out.type = "Polygon";
			out.coordinates = out.coordinates[0];
			return out;
		}else{
			out.type = "MultiPolygon";
			return out;
		}
	}
}
function parsePolygon(data,trans){
	return polyFuncs(parsePolyline(data,trans));
}
function parseZPolygon(data,trans){
	return polyFuncs(parseZPolyline(data,trans));
}
var shpFuncObj = {
	1:parsePoint,
	3:parsePolyline,
	5:parsePolygon,
	8:parseMultiPoint,
	11:parseZPoint,
	13:parseZPolyline,
	15:parseZPolygon,
	18:parseZMultiPoint
};
function shpFuncs (num,tran){
	if(num>20){
		num -= 20;
	}
	if(!(num in shpFuncObj)){
		console.log("I don't know that shp type");
		return function(){
			return function(){};
		};
	}
	var shpFunc = shpFuncObj[num];
	var parseCoord = makeParseCoord(tran);
	return function(data){
		return shpFunc(data,parseCoord);
	};
}
var getRow = function(buffer,offset){
	var view = new DataView(buffer,offset,12);
	var len = view.getInt32(4,false)<<1;
	var data = new DataView(buffer,offset+12,len-4);
	
	return {
		id:view.getInt32(0,false),
		len:len,
		data:data,
		type:view.getInt32(8,true)
	};
};

var getRows = function(buffer,parseShape){
	var offset=100;
	var len = buffer.byteLength;
	var out = [];
	var current;
	while(offset<len){
		current = getRow(buffer,offset);
		offset += 8;
		offset += current.len;
		if(current.type){
			out.push(parseShape(current.data));
		}
	}
	return out;
};
function makeParseCoord(trans){
	if(trans){
		console.log(trans);
		return function(data,offset){
			return trans.inverse([data.getFloat64(offset,true),data.getFloat64(offset+8,true)]);
		}
	}else{
		console.log('no trans');
		return function(data,offset){
			return [data.getFloat64(offset,true),data.getFloat64(offset+8,true)];
		}
	}
}
return function(buffer,trans){
	console.log('trans is ',trans)
	var headers = parseHeader(buffer);
	return getRows(buffer,shpFuncs(headers.shpCode,trans));
};
});
