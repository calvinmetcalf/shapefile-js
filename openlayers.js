window.onload = function () {
    var map = new OpenLayers.Map('map');
    var osm = new OpenLayers.Layer.OSM();
    var shpLayer = new OpenLayers.Layer.Vector()
    map.addLayers([osm, shpLayer]);
    map.setCenter(new OpenLayers.LonLat(0, 0), 5)
    
    // load the shapefile
    getOpenLayersFeatures('shp/red0sample', function (fs) {
	shpLayer.addFeatures(fs);
    });
}