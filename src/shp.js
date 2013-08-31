define(['proj4','jszip','binaryajax','parseShp','dbf'],function(proj4,unzip,binaryAjax,parseShp,parseDbf){
function shp(base){
    return shp.getShapefile(base);
};
shp.combine=function(arr){
	var out = {};
	out.type="FeatureCollection";
	out.features=[];
	var i = 0;
	var len = arr[0].length;
	while(i<len){
		out.features.push({
			"type": "Feature",
			"geometry": arr[0][i],
			"properties": arr[1][i]
		});
		i++;
	}
	return out;
}
shp.parseZip = function(buffer){
		var key;
		var zip=unzip(buffer);
		var names = [];
		for(key in zip){
			if(key.slice(-3).toLowerCase()==="shp"){
				names.push(key.slice(0,-4));
			}else if(key.slice(-3).toLowerCase()==="dbf"){
				zip[key]=parseDbf(zip[key]);
			}else if(key.slice(-3).toLowerCase()==="prj"){
				zip[key]=proj4(String.fromCharCode.apply(null,new Uint8Array(zip[key])));
			}else if(key.slice(-7).toLowerCase()==="geojson"){
				names.push(key);
			}
		}
	var geojson = names.map(function(name){
		var parsed
		if(name.slice(-7).toLowerCase()==="geojson"){
			parsed = JSON.parse(zip[name]);
			parsed.fileName = name.slice(0,-8);
		}else{
			parsed =  shp.combine([parseShp(zip[name +'.shp'],zip[name +'.prj']),zip[name +'.dbf']]);
			parsed.fileName = name;
		}
		return parsed;
	});
	if(geojson.length === 1){
		return geojson[0];
	}else{
		return geojson;
	}
};
function getZip(base){
	return binaryAjax(base).then(shp.parseZip);
}
shp.getShapefile = function(base){
	if(typeof base === 'string'){
		if(base.slice(-4)==='.zip'){
			return getZip(base);
		}else{ 
		return shp.all([
			binaryAjax(base+'.shp').then(shp.parseShp),
			binaryAjax(base+'.dbf').then(shp.parseDbf)
		]).then(shp.combine)}
	}else{
		return shp.resolve(shp.parseZip(base));
	}
}
return shp;
});
