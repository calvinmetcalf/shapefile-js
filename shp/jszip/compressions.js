define(['shp/jszip/flate/main'],function(deflate){
	return {
   "STORE" : {
      magic : "\x00\x00",
      compress : function (content) {
         return content; // no compression
      },
      uncompress : function (content) {
         return content; // no compression
      },
       compressInputType : null,
      uncompressInputType : null
   },
   DEFLATE:deflate
};
});