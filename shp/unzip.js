define(['jszip/main'],function(JSZip){
    return function(buffer){
        var zip = new JSZip(buffer);
        var files = zip.file(/.+/);
        var out = {};
        files.forEach(function(a){
	        if(a.name.slice(-7).toLowerCase()==="geojson"){
		        out[a.name]=a.asText();
	        }else{
		        out[a.name]=a.asArrayBuffer();
	        }
        });
        return out;
    };
});
