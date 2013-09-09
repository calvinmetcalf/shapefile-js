define(['shp/jszip/base64','shp/jszip/zipEntries'],function(JSZipBase64,ZipEntries){
return function(data, options) {
      var files, zipEntries, i, input;
      options = options || {};
      if(options.base64) {
         data = JSZipBase64.decode(data);
      }

      zipEntries = new ZipEntries(data, options);
      files = zipEntries.files;
      for (i = 0; i < files.length; i++) {
         input = files[i];
         this.file(input.fileName, input.decompressed, {
            binary:true,
            optimizedBinaryString:true,
            date:input.date,
            dir:input.dir
         });
      }

      return this;
   };
});