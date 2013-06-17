# Shapefile.js

Redoing all of this in modern JS. Promises, Typed Arrays, other hipster things, I wouldn't say it's based on [RandomEtc's version](https://github.com/RandomEtc/shapefile-js) as much as inspired by it as there is 0 code shared and I really only read the binary ajax part of his (hence why my function has the same name, they are otherwise not related). My sources were:

- [wikipedia article](http://calvinmetcalf.github.io/shapefile-js/)
- [ESRI white paper](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf)
- [This page on Xbase](http://www.clicketyclick.dk/databases/xbase/format/dbf.html)

##Demos

- [Countries](http://calvinmetcalf.github.io/shapefile-js)
- [Google maps](http://calvinmetcalf.github.io/shapefile-js/map.html)
- [zip file](http://calvinmetcalf.github.io/shapefile-js/zip.html)

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

##to do

- projections?
- check for geometry validity.
