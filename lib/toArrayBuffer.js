'use strict';
module.exports = toArrayBuffer;
function toArrayBuffer(buffer) {
    var arrayBuffer = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(arrayBuffer);
    var i = -1;
    var len = buffer.length;
    while (++i < len) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
}