# Shapefile.js

Redoing all of this in modern JS. Promises, Typed Arrays, other hipster things, I wouldn't say it's based on [RandomEtc's version](https://github.com/RandomEtc/shapefile-js) as much as inspired by it as there is 0 code shared and I really only read the binary ajax part of his (hence why my function has the same name, they are otherwise not related). My sources were

- [wikipedia article](http://calvinmetcalf.github.io/shapefile-js/)
- [ESRI white paper](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf)
- [This page on Xbase](http://www.clicketyclick.dk/databases/xbase/format/dbf.html)

##Done

- Binary Ajax
- parsing the shp
- parse the dbf
- join em

##to do

- projections?
- check for geometry validity.
