# Shapefile.js

Redoing all of this in modern JS. Promises, Typed Arrays, other hipster things, I wouldn't say it's based on [RandomEtc's version](https://github.com/RandomEtc/shapefile-js) as much as inspired by it as there is 0 code shared and I really only read the binary ajax part of his (hence why my function has the same name, they are otherwise not related). My sources were:

- [wikipedia article](https://en.wikipedia.org/wiki/Shapefile)
- [ESRI white paper](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf)
- [This page on Xbase](http://www.clicketyclick.dk/databases/xbase/format/dbf.html)

##Demos

- [Countries](http://calvinmetcalf.github.io/shapefile-js)
- [Google maps](http://calvinmetcalf.github.io/shapefile-js/map.html)
- [zip file](http://calvinmetcalf.github.io/shapefile-js/zip.html)
- [Local Zipfile](http://calvinmetcalf.github.io/shapefile-js/localfile)
- [Projected big with web workers](http://calvinmetcalf.github.io/shapefile-js/proj.html)
- [Projected small](http://calvinmetcalf.github.io/shapefile-js/proj-small.html)

##API

Has a function `shp` which accepts a string which is the path the she shapefile minus the extention and returns a promise which resolves into geojson.

```javascript
	//for the shapefiles in the files folder called pandr.shp
	shp("files/pandr").then(function(geojson){
		//do something with your geojson
	});
```
or you can call it on a .zip file which contains the shapefile

```javascript
	//for the shapefiles in the files folder called pandr.shp
	shp("files/pandr.zip").then(function(geojson){
		//do something with your geojson
	});
```

You could also load the arraybuffers some other way and call `shp.parseShp`  `shp.parseDbf` to parse the two parts and `shp.combine` to combine them into geojson or shp.parseZip if you have a zipfile as an array buffer. Lastly we have `shp.binaryAjax` which downloads a file and returns a promise for the file as an array buffer.

##Done

- Binary Ajax
- parsing the shp
- parse the dbf
- join em
- zip

##to do

- projections?
- check for geometry validity.
- file api

##LICENSE
Main library MIT license, origional version was less permisive but there is 0 code shared. Included libraries are under their respective lisenses which are:
- [JSZip](https://github.com/Stuk/jszip/) by @Stuk MIT or GPLv3
- [Promiscuous](https://github.com/RubenVerborgh/promiscuous) by @RubenVerborgh MIT 
- [setImmediate](https://github.com/NobleJS/setImmediate) by @NobleJS et al MIT
- [World Borders shapefile](http://thematicmapping.org/downloads/world_borders.php) is CC-BY-SA 3.0.
- Park and Ride shapefile is from [MassDOT](http://mass.gov/massdot) and is public domain.
- MA town boundaries from [MassGIS](http://www.mass.gov/anf/research-and-tech/it-serv-and-support/application-serv/office-of-geographic-information-massgis/) and is public domain
- NJ County Boundaries from [NJgin](https://njgin.state.nj.us/NJ_NJGINExplorer/index.jsp) and should be public domain.
- [Projforjs](https://github.com/calvinmetcalf/projforjs) easy stuff by me hard stuff by other people Apache licensed