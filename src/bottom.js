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

function getZip(base){
	return shp.binaryAjax(base).then(function(a){
		var key;
		var zip=shp.unzip(a);
		var temp = [];
		for(key in zip){
			if(key.slice(-3)==="shp"){
				temp[0]=shp.parseShp(zip[key]);
			}else if(key.slice(-3)==="dbf"){
				temp[1]=shp.parseDbf(zip[key]);
			}
		}
	return  shp.combine(temp);
	});
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