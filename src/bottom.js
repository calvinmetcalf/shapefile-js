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
		var zip=shp.unzip(buffer);
		var names = [];
		for(key in zip){
			if(key.slice(-3)==="shp"){
				names.push(key.slice(0,-4));
			}else if(key.slice(-3)==="dbf"){
				zip[key]=shp.parseDbf(zip[key]);
			}else if(key.slice(-3)==="prj"){
				zip[key]=shp.proj(String.fromCharCode.apply(this,new Uint8Array(zip[key])));
			}
		}
	var geojson = {}
	names.forEach(function(name){
		geojson[name] = shp.combine([shp.parseShp(zip[name +'.shp'],zip[name +'.prj']),zip[name +'.dbf']]);
	});
	if(Object.keys(geojson).length === 1){
		return geojson[Object.keys(geojson)];
	}else{
		return geojson;
	}
};
function getZip(base){
	return shp.binaryAjax(base).then(shp.parseZip);
}
shp.getShapefile = function(base){
	if(base.slice(-4)==='.zip'){
		return getZip(base);
	}else{ 
	return shp.all([
		shp.binaryAjax(base+'.shp').then(shp.parseShp),
		shp.binaryAjax(base+'.dbf').then(shp.parseDbf)
	]).then(shp.combine)}
	}
})(shp);