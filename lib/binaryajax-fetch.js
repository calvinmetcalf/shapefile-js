'use strict';
const fallback = require('./binaryajax-browser');
const combine = require('./combine');
const Buffer = require('buffer').Buffer;
module.exports = async function binaryAjax (_url, type) {
  if (!global.fetch) {
    return fallback(_url, type);
  }
  const url = combine(_url, type);
  const isOptionalTxt = type === 'prj' || type === 'cpg';
  try {
    const resp = await fetch(url);
    if (resp.status > 399) {
      throw new Error(resp.statusText);
    }
    if (isOptionalTxt) {
      return resp.text();
    }
    const parsed = await resp.arrayBuffer();
    return Buffer.from(parsed);
  } catch (e) {
    console.log('ERROR', e, type);
    if (isOptionalTxt || type === 'dbf') {
      return false;
    }
    throw e;
  }
};
