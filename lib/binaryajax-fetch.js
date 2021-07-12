'use strict';
const fallback = require('./binaryajax-browser');
const Buffer = require('buffer').Buffer;
module.exports = async function binaryAjax (url) {
  if (!global.fetch) {
    return fallback(url);
  }
  const type = url.slice(-3).toLowerCase();
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
    if (isOptionalTxt) {
      return false;
    }
    throw e;
  }
};
