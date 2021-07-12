'use strict';
const Promise = require('lie');
const Buffer = require('buffer').Buffer;
module.exports = binaryAjax;
function binaryAjax (url) {
  return new Promise(function (resolve, reject) {
    const type = url.slice(-3);
    const ajax = new XMLHttpRequest();
    ajax.open('GET', url, true);
    if (type !== 'prj' && type !== 'cpg') {
      ajax.responseType = 'arraybuffer';
    }
    ajax.addEventListener('load', function () {
      if (ajax.status > 399) {
        if (type === 'prj' || type === 'cpg') {
          return resolve(false);
        } else {
          return reject(new Error(ajax.status));
        }
      }
      if (type !== 'prj' && type !== 'cpg') {
        return resolve(Buffer.from(ajax.response));
      } else {
        return resolve(ajax.response);
      }
    }, false);
    ajax.send();
  });
}
