'use strict';
var fallback = require('./binaryajax-browser');
var Buffer = require('buffer').Buffer
module.exports = async function binaryAjax(url){
  if (!global.fetch) {
    return fallback(url)
  }
  var type = url.slice(-3).toLowerCase();
  var isOptionalTxt = type==='prj' || type === 'cpg';
  try {
    var resp = await fetch(url)
    if (resp.status > 399) {
      throw new Error(resp.statusText);
    }
    if (isOptionalTxt) {
      return resp.text();
    }
    var resp = await resp.arrayBuffer();
    return Buffer.from(resp);
  } catch (e) {
  	if(isOptionalTxt){
      return false;
    }
    throw e;
  }
}
