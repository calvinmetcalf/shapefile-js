// all the interaction stuff is copied almost verbatim from 
// http://www.openlayers.org/dev/examples/dynamic-text-layer.html

window.onload = function () {
    map = new OpenLayers.Map('map', {sphericalMercator: true});
    var osm = new OpenLayers.Layer.OSM({sphericalMercator: true});

    var shpLayer = new OpenLayers.Layer.Vector({projection: new OpenLayers.Projection('EPSG:4326')});
    map.addLayers([osm, shpLayer]);
    map.setCenter(new OpenLayers.LonLat(0, 0), 1);

    // Interaction; not needed for initial display.
    selectControl = new OpenLayers.Control.SelectFeature(shpLayer);
    map.addControl(selectControl);
    selectControl.activate();
    shpLayer.events.on({
        'featureselected': onFeatureSelect,
        'featureunselected': onFeatureUnselect
    });
    
    // load the shapefile
    var theUrl = 'naturalearthdata/cultural/110m-admin-0-countries';
    getOpenLayersFeatures(theUrl, function (fs) {
	// reproject features
	// this is ordinarily done by the format object, but since we're adding features manually we have to do it.
	var fsLen = fs.length;
	var inProj = new OpenLayers.Projection('EPSG:4326');
	var outProj = new OpenLayers.Projection('EPSG:3857');
	for (var i = 0; i < fsLen; i++) {
	    fs[i].geometry = fs[i].geometry.transform(inProj, outProj);
	}
	shpLayer.addFeatures(fs);
    });
}
			  

// Needed only for interaction, not for the display.
function onPopupClose(evt) {
    // 'this' is the popup.
    var feature = this.feature;
    if (feature.layer) { // The feature is not destroyed
	selectControl.unselect(feature);
    } else { // After "moveend" or "refresh" events on POIs layer all 
	//     features have been destroyed by the Strategy.BBOX
	this.destroy();
    }
}
function onFeatureSelect(evt) {
    feature = evt.feature;
    var table = '<table>';
    for (var attr in feature.attributes.values) {
	table += '<tr><td>' + attr + '</td><td>' + feature.attributes.values[attr] + '</td></tr>';
    }
    table += '</table>';
    popup = new OpenLayers.Popup.FramedCloud("featurePopup",
					     feature.geometry.getBounds().getCenterLonLat(),
					     new OpenLayers.Size(100,100), table, null, true, onPopupClose);
    feature.popup = popup;
    popup.feature = feature;
    map.addPopup(popup, true);
}
function onFeatureUnselect(evt) {
    feature = evt.feature;
    if (feature.popup) {
	popup.feature = null;
	map.removePopup(feature.popup);
	feature.popup.destroy();
	feature.popup = null;
    }
}