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
		var temp = {};
		for(key in zip){
			if(key.slice(-3)==="shp"){
				names.push(key.slice(0,-4));
				temp[key]=zip[key];
			}else if(key.slice(-3)==="dbf"){
				temp[key]=shp.parseDbf(zip[key]);
			}else if(key.slice(-3)==="prj"){
				temp[key]=shp.proj(String.fromCharCode.apply(this,new Uint8Array(zip[key])));
			}
		}
	var tshp = temp[names[0]+'.shp'];
	var tprj = temp[names[0]+'.prj'];
	var tdbf = temp[names[0]+'.dbf'];
	return shp.combine([shp.parseShp(tshp,tprj),tdbf]);
	}
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