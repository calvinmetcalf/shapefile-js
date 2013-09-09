define(['shp/jszip/flate/inflate','shp/jszip/flate/deflate'],function(inflate,deflate){

var USE_TYPEDARRAY =
      (typeof Uint8Array !== 'undefined') &&
      (typeof Uint16Array !== 'undefined') &&
      (typeof Uint32Array !== 'undefined');
      return {
		magic: "\x08\x00",
		uncompressInputType : USE_TYPEDARRAY ? "uint8array" : "array",
		uncompress:inflate,
		compressInputType : USE_TYPEDARRAY ? "uint8array" : "array",
		compress:deflate
      };
      
});