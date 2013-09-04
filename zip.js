requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: './src',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    use: {
        leaflet: {
            attach: 'leaflet'
        }
    }
});
require(['shp'],function(shp){
	 var m= L.map('map').setView([34.74161249883172,18.6328125], 2);
      var geo = L.geoJson({features:[]},{onEachFeature:function popUp(f,l){
    		var out = [];
    		if (f.properties){
        		for(var key in f.properties){
            	out.push(key+": "+f.properties[key]);
        }
        l.bindPopup(out.join("<br />"));
    }
}}).addTo(m);
      var base = 'files/TM_WORLD_BORDERS_SIMPL-0.3.zip';
      var dbf,sh;
		shp(base).then(function(data){
		geo.addData(data);
		});
	});
