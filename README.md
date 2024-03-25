# Shapefile.js

If you are having encoding issues in internet explorer please include [this script](https://cdn.rawgit.com/calvinmetcalf/text-encoding/4aff951959085f74a5872aeed8d79ec95b6c74c3/lib/encoding-indexes.js) as well.

Redoing all of this in modern JS. Promises, Typed Arrays, other hipster things, I wouldn't say it's based on [RandomEtc's version](https://github.com/RandomEtc/shapefile-js) as much as inspired by it as there is 0 code shared and I really only read the binary ajax part of his (hence why my function has the same name, they are otherwise not related). My sources were:

- [wikipedia article](https://en.wikipedia.org/wiki/Shapefile)
- [ESRI white paper](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf)
- [This page on Xbase](http://www.clicketyclick.dk/databases/xbase/format/dbf.html)

## Demos

- [Countries/zipfile](http://calvinmetcalf.github.io/shapefile-js)
- [Google maps](http://calvinmetcalf.github.io/shapefile-js/site/map.html)
- [Local Zipfile](http://leaflet.calvinmetcalf.com)
- [Projected big with web workers](http://calvinmetcalf.github.io/shapefile-js/site/proj.html)
- [Projected small](http://calvinmetcalf.github.io/shapefile-js/site/proj-small.html)

## Usage

Fore use in rollup, node and where ever ESM modules are used we have a lovely package you can install via npm or yarn or whatever.

    npm install shpjs --save

If you need a stand alone file to include in your webpage the old fation when then you can grab the built version that's either included in the repo or you can use unpkg.

    https://unpkg.com/shpjs@latest/dist/shp.js

## API

Has a function `shp` which accepts a string which is the path the she shapefile minus the extension and returns a promise which resolves into geojson.

```javascript
	import shp from 'shpjs';
	//for the shapefiles in the folder called 'files' with the name pandr.shp
	const geojson = await shp("files/pandr");
```
or you can call it on a .zip file which contains the shapefile

```javascript
	//for the shapefiles in the files folder called pandr.shp
	const geojson = await shp("files/pandr.zip");
	//see bellow for whats here this internally call shp.parseZip()
```

or if you got the zip some other way (like the [File API](https://developer.mozilla.org/en-US/docs/Web/API/File)) then with the arrayBuffer you can call

```javascript
const geojson = await shp(buffer);
```
If there is only one shp in the zipefile it returns geojson, if there are multiple then it will be an array.  All of the geojson objects have an extra key `fileName` the value of which is the
name of the shapefile minus the extension (I.E. the part of the name that's the same for all of them)


## Advanced API
There are also a few internal methods that are exposed for if you have to do some more complicated stuff.  These are named exports in the ESM version or properties on the main `shp` function in the bundled version.

- `parseShape`: takes a buffer containing the contents of a `.shp` file and optionally a `.prj` STRING and returns geometries.
- `parseDbf`: just a shortcut to [parseDBF](https://github.com/calvinmetcalf/parsedbf) takes the same arguments, though will do some type coertion that the stand alone library won't.
- `combine`: takes the results of the two aformentioned functions and combines them into a geojson document.

```javascript
import {combine, parseShp, parseDbf} from shpjs;
combine([parseShp(shpBuffer, /*optional prj str*/),parseDbf(dbfBuffer)]);
```

## LICENSE
Main library MIT license, original version was less permissive but there is 0 code shared. Included libraries are under their respective lisenses which are:
- [JSZip](https://github.com/Stuk/jszip/) by @Stuk MIT or GPLv3
- [lie](https://github.com/calvinmetcalf/lie) by me and @RubenVerborgh MIT
- [setImmediate](https://github.com/NobleJS/setImmediate) by @NobleJS et al MIT
- [World Borders shapefile](http://thematicmapping.org/downloads/world_borders.php) is CC-BY-SA 3.0.
- Park and Ride shapefile is from [MassDOT](http://mass.gov/massdot) and is public domain.
- MA town boundaries from [MassGIS](http://www.mass.gov/anf/research-and-tech/it-serv-and-support/application-serv/office-of-geographic-information-massgis/) and is public domain
- NJ County Boundaries from [NJgin](https://njgin.state.nj.us/NJ_NJGINExplorer/index.jsp) and should be public domain.
- [Proj4js](https://github.com/proj4js/proj4js) by me et al MIT

[![Dependency Status](https://david-dm.org/calvinmetcalf/shapefile-js.svg)](https://david-dm.org/calvinmetcalf/shapefile-js)
[![devDependency Status](https://david-dm.org/calvinmetcalf/shapefile-js/dev-status.svg)](https://david-dm.org/calvinmetcalf/shapefile-js#info=devDependencies)
[![peerDependency Status](https://david-dm.org/calvinmetcalf/shapefile-js/peer-status.svg)](https://david-dm.org/calvinmetcalf/shapefile-js#info=peerDependencies)
