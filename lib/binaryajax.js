var Promise = require('lie');
var http = require('http');
var toArrayBuffer = require('./toArrayBuffer');
module.exports = binaryAjax;
function binaryAjax(url) {
  return new Promise(function(resolve, reject){
    var type = url.slice(-3);
    http.get(url, function (res) {
      var len = 0;
      var buffers = [];
      if(res.statusCode>200){
        if(type==='prj'){
          return resolve(false);
        }else{
          return reject(new Error(res.statusCode));
        }
      }
      res.on('data', function (d) {
        len += d.length;
        buffers.push(d);
      });
      res.on('end', function () {
        var buffer = Buffer.concat(buffers, len);
        if (type === 'prj') {
          resolve(buffer.toString());
        } else {
          resolve(toArrayBuffer(buffer));
        }
      });
    });
  });
}