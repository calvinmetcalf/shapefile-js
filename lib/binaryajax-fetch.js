import fallback from './binaryajax-browser';
import combine from './combine';
import { Buffer } from 'buffer'

export default async function binaryAjax(_url, type) {
  if (!globalThis.fetch) {
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
