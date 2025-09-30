
import shp from '../lib/index.js';
import { should as shouldRaw, use } from 'chai';
import { ParseShp } from '../lib/parseShp.js';
import chaiAsPromised from 'chai-as-promised';
const should = shouldRaw();
use(chaiAsPromised);
const get = url => fetch(url).then(resp => resp.arrayBuffer())
describe('Shp', function () {
  describe('park and rides not zipped', function () {
    const pandr = shp('http://localhost:3000/files/pandr');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(80);
    });
  });
  describe('park and rides not zipped but with suffix', function () {
    const pandr = shp('http://localhost:3000/files/pandr.shp');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(80);
    });
  });
  describe('park and rides not zipped but loaded individually', async function () {
    const pandr = Promise.all([
      get('http://localhost:3000/files/pandr.shp'),
      get('http://localhost:3000/files/pandr.dbf'),
      get('http://localhost:3000/files/pandr.prj')
    ]).then(([shapefile, dbf, prj]) => shp({
      shp: shapefile, dbf, prj
    }))
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(80);
    });
  });
  describe('park and rides zipped', function () {
    const pandr = shp('http://localhost:3000/files/pandr.zip').catch(e => console.log('ERR', e));
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(80);
    });
  });
  describe('senate unzipped', function () {
    const pandr = shp('http://localhost:3000/test/data/senate');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(40);
    });
  });
  describe('mixed case zipped', function () {
    const pandr = shp('http://localhost:3000/test/data/mixedcase.zip');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(40);
    });
  });
  describe('senate zipped', function () {
    const pandr = shp('http://localhost:3000/test/data/senate.zip');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(40);
    });
  });
  describe('county unzipped', function () {
    const pandr = shp('http://localhost:3000/test/data/counties');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(14);
    });
  });
  describe('county zipped', function () {
    return shp('http://localhost:3000/test/data/counties.zip').then(thing => {
      thing.should.contain.keys('type', 'features');
      thing.should.have.property('type', 'FeatureCollection');
      return thing.features;
    }).should.eventually.have.length(14);
  });
  describe('trains zipped', function () {
    const pandr = shp('http://localhost:3000/test/data/train_stations.zip');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(361);
    });
  });
  describe('trains zipped with query params', function () {
    const pandr = shp('http://localhost:3000/test/data/train_stations.zip?foo=bar');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(361);
    });
  });
  describe('z', function () {
    it('should work with multipoint z', function () {
      return shp('http://localhost:3000/test/data/export_multipointz').then(function (resp) {
        return resp.features[0].geometry.coordinates;
      }).should.eventually.deep.equal([
        [
          -123.00000000000001,
          48.00000000000001,
          1200
        ],
        [
          -122,
          47,
          2500
        ],
        [
          -121,
          46,
          3600
        ]
      ]);
    });
    it('should work with polyline z', function () {
      return shp('http://localhost:3000/test/data/export_polylinez').then(function (resp) {
        return resp.features[0].geometry.coordinates;
      }).should.eventually.deep.equal([
        [
          [
            -119.99999999999999,
            45,
            800
          ],
          [
            -119,
            44,
            1100
          ],
          [
            -118.00000000000001,
            43,
            2300
          ]
        ],
        [
          [
            -115,
            40,
            0
          ],
          [
            -114.00000000000001,
            39,
            0
          ],
          [
            -113,
            38,
            0
          ]
        ]
      ]);
    });
  });
  describe('empty attributes table', function () {
    const pandr = shp('http://localhost:3000/files/empty-shp.zip');
    it('should have the right keys', function () {
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type', function () {
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features', function () {
      return pandr.then(function (a) { return a.features; }).should.eventually.have.length(2);
    });
  });
  describe('errors', function () {
    it('bad file should be rejected', function () {
      return shp('http://localhost:3000/test/data/bad').should.be.rejected;
    });
    it('imaginary file file should be rejected', function (done) {
      shp('http://localhost:3000/test/data/notthere').then(function () {
        done(true);
      }, function () {
        done();
      });
    });
    it('bad zip be rejected', function () {
      return shp('http://localhost:3000/test/data/badzip.zip').should.be.rejected;
    });
    it('no shp in zip', function () {
      return shp('http://localhost:3000/test/data/noshp.zip').should.be.rejected;
    });
  });
  describe('encoding', function () {
    it('should work for utf.zip', function () {
      return shp('http://localhost:3000/test/data/utf.zip').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.map(function (feature) {
          return feature.properties.field;
        });
      }).should.eventually.deep.equal([
        '💩',
        'Hněvošický háj'
      ]);
    });
    it('should work for utf', function () {
      return shp('http://localhost:3000/test/data/utf').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.map(function (feature) {
          return feature.properties.field;
        });
      }).should.eventually.deep.equal([
        '💩',
        'Hněvošický háj'
      ]);
    });
    it('should work for codepage.zip', function () {
      return shp('http://localhost:3000/test/data/codepage.zip').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.map(function (feature) {
          return feature.properties.field;
        });
      }).should.eventually.deep.equal([
        '??',
        'Hněvošický háj'
      ]);
    });
    it('should work for codepage', function () {
      return shp('http://localhost:3000/test/data/codepage').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.map(function (feature) {
          return feature.properties.field;
        });
      }).should.eventually.deep.equal([
        '??',
        'Hněvošický háj'
      ]);
    });
    it('should work for codepage individually', function () {
      return Promise.all([
        get('http://localhost:3000/test/data/codepage.shp'),
        get('http://localhost:3000/test/data/codepage.dbf'),
        get('http://localhost:3000/test/data/codepage.prj'),
        get('http://localhost:3000/test/data/codepage.cpg')
      ]).then(([shapefile, dbf, prj, cpg]) => shp({
        shp: shapefile, dbf, prj, cpg
      })).then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.map(function (feature) {
          return feature.properties.field;
        });
      }).should.eventually.deep.equal([
        '??',
        'Hněvošický háj'
      ]);
    });
    it('should work for a stupid code page', function () {
      return shp('http://localhost:3000/test/data/htmlcpg').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.map(function (feature) {
          return feature.properties.field;
        });
      }).should.eventually.deep.equal([
        '💩',
        'Hněvošický háj'
      ]);
    });
    it('should work for a stupid prj', function () {
      return shp('http://localhost:3000/test/data/htmlprj').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.map(function (feature) {
          return feature.properties.field;
        });
      }).should.eventually.deep.equal([
        '💩',
        'Hněvošický háj'
      ]);
    });
    it('should work for a stupid prj and query params', function () {
      return shp('http://localhost:3000/test/data/htmlprj?blah=baz').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.map(function (feature) {
          return feature.properties.field;
        });
      }).should.eventually.deep.equal([
        '💩',
        'Hněvošický háj'
      ]);
    });
  });
  describe('misc stuff', function () {
    it('should work for a null geom', function () {
      return shp('http://localhost:3000/test/data/LGA_2013_AUST').then(function (item) {
        item.should.contain.keys('type', 'features');
        item.features[4].geometry.coordinates.length.should.equal(21);
        item.features[4].properties.LGA_NAME13.should.equal('Kangaroo Island (DC)');
        return item.features.length;
      }).should.eventually.equal(13);
    });
    it('should work for with this shapfile', function () {
      return shp('http://localhost:3000/test/data/T8Th4_6n.zip').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.length;
      }).should.eventually.equal(3);
    });
    it('should work for with this shapfile with a query param', function () {
      return shp('http://localhost:3000/test/data/T8Th4_6n.zip?foo=bar').then(function (item) {
        item.should.contain.keys('type', 'features');
        return item.features.length;
      }).should.eventually.equal(3);
    });
    it('file too long', function () {
      return shp('http://localhost:3000/test/data/ipra_dresden_polygon');
    });
    it('should handle missing dbf', function () {
      return shp('http://localhost:3000/test/data/no-dbf').then(thing => {
        thing.should.contain.keys('type', 'features');
        thing.should.have.property('type', 'FeatureCollection');
        return thing.features;
      }).should.eventually.have.length(14);
    });
    it('should handle missing dbf in a zip', function () {
      return shp('http://localhost:3000/test/data/no-dbf.zip').then(thing => {
        thing.should.contain.keys('type', 'features');
        thing.should.have.property('type', 'FeatureCollection');
        return thing.features;
      }).should.eventually.have.length(14);
    });
    it('should work with a line that has zero points', function () {
      return shp('http://localhost:3000/test/data/zero-len-line.zip').then(thing => {
        thing.should.contain.keys('type', 'features');
        thing.should.have.property('type', 'FeatureCollection');
        should.equal(thing.features[1].geometry, null);
        return thing.features;
      }).should.eventually.have.length(3);
    });
    it('should handle .mshp files', function () {
      return shp('http://localhost:3000/test/data/qgis.zip').then(thing => {
        thing.should.contain.keys('type', 'features');
        thing.should.have.property('type', 'FeatureCollection');
        return thing.features;
      }).should.eventually.have.length(2);
    });
    it('should handle weirdly ordered rings', function () {
      return shp('http://localhost:3000/test/data/SHP_Exclude.zip').then(thing => {
        thing.should.contain.keys('type', 'features');
        thing.should.have.property('type', 'FeatureCollection');
        return thing.features[0].geometry.coordinates;
      }).should.eventually.have.length(2);
    });
    it('should handle files that lie about their length', function () {
      return shp('http://localhost:3000/test/data/badlen.zip').then(thing => {
        thing.should.contain.keys('type', 'features');
        thing.should.have.property('type', 'FeatureCollection');
        return thing.features;
      }).should.eventually.have.length(203);
    });
    it('should handle freestanding holes', function () {
      return shp('http://localhost:3000/test/data/multi-poly-shape.zip').then(thing => {
        thing.should.contain.keys('type', 'features');
        thing.should.have.property('type', 'FeatureCollection');
        return thing.features[0].geometry.coordinates;
      }).should.eventually.have.length(2);
    });
    it('should handle freestanding holes that also have holes', function () {
      return fetch('http://localhost:3000/test/data/bad-winding.json').then((resp) => {
        resp.ok.should.equal(true);
        return resp.json();
      }).then(badWinding => {
        const polyFuncs = ParseShp.prototype.polyFuncs;
        const out = polyFuncs(badWinding);
        out.type.should.equal('Polygon')
        return out.coordinates.should.have.length(2);
      })
    });
    it('should handle nested multi polygon shapes', function () {
      return shp('http://localhost:3000/test/data/layer-cake.zip').then(thing => {
        thing.should.contain.keys('type', 'features');
        thing.should.have.property('type', 'FeatureCollection');
        return thing.features[0].geometry.coordinates[0];
      }).should.eventually.have.length(2);
    });
  });
});
