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
function parsePoint(data,offset,trans){
	if(trans){
		return trans([data.getFloat64(offset,true),data.getFloat64(offset+8,true)]);
	}
	return [data.getFloat64(offset,true),data.getFloat64(offset+8,true)];
	}
function parsePointArray(data,offset,num,trans){
	var out = [];
	var done = 0;
	while(done<num){
		out.push(parsePoint(data,offset,trans));
		offset += 16;
		done++;
	}
	return out;
}
function parseArrayGroup(data,offset,partOffset,num,tot,trans){
	var out = [];
	var done = 0;
	var curNum,nextNum=0,pointNumber;
	while(done<num){
		done++
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
		out.coordinates = parsePoint(data,offset,trans);
	}else{
		out.type = "MultiPoint";
		out.coordinates = parsePointArray(data,offset,num,trans);
	}
	return out;
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
function parsePolygon(data,trans){
	var out = parsePolyline(data,trans);
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
var shpFuncs = [
	null,
	function(data,trans){
		return {
			"type": "Point",
			"coordinates":parsePoint(data,0,trans)
		};
	},
	null,
	parsePolyline,
	null,
	parsePolygon,
	null,
	null,
	parseMultiPoint
	];
	
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

var getRows = function(buffer,parseShape,trans){
	var offset=100;
	var len = buffer.byteLength;
	var out = [];
	var current;
	while(offset<len){
		current = getRow(buffer,offset);
		offset += 8;
		offset += current.len;
		if(current.type){
			out.push(parseShape(current.data,trans));
		}
	}
	return out;
};

shp.parseShp = function(buffer,trans){
	var headers = parseHeader(buffer);
	return getRows(buffer,shpFuncs[headers.shpCode],trans);
};
