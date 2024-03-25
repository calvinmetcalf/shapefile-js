import shp, { combine, getShapefile, parseDbf, parseZip, parseShp, } from './index.js';

shp.combine = combine;
shp.parseDbf = parseDbf;
shp.parseZip = parseZip;
shp.parseShp = parseShp;
export default shp;