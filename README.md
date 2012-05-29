A binary shapefile loader, for javascript. Many caveats:

Works in Aurora and Chrome basically I took [Random Etc's](https://github.com/RandomEtc) and consolidated it so it only requires one file, and gave it an easier api, which at the moment:

```js
var shapefile = new shp({url:"path/to/shapfile/without/extention",cb:callback});
```

Currently it will detect if it's a point feature and will probobly do others at somepoint, at the moment does not reproject but will probobly merge in some functionality from [this for state plane](https://github.com/calvinmetcalf/lcc) maybe based on the .prjfile.

there are some examples here, hopefully there will be some good examples soon (polygon.html loads a polyon, dosn't desplay anything, open web console and type "shapefile" to see what loaded, ditto for pt.html.  map.html takes point and puts it on a google map, need to replace that shapefile with one that has decent fields)

https://github.com/RandomEtc/shapefile-js is what this is based off of
http://www.nihilogic.dk/labs/binaryajax/binaryajax.js is used for loading binary data via XMLHttpRequest
http://code.google.com/p/vanrijkom-flashlibs/ was ported to js from actionscript
http://code.google.com/p/explorercanvas/ is used for IE support

dbf.js and shapefile.js are close relatives of the vanrijkom-libs code and as such are LGPL v2 as well
binarywrapper.js is new, to support parsing doubles and to keep track of binary offsets and endianness

excanvas.js is under Apache License 2.0
binaryajax.js is under MPL

world borders shapefile is from http://thematicmapping.org/downloads/world_borders.php licensed CC-BY-SA 3.0

