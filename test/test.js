var shp = require('../');
var chai = require('chai');
chai.should();
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe('Shp', function(){
  describe('park and rides not zipped', function(){
  		var pandr =  shp('http://localhost:3000/files/pandr');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features;}).should.eventually.have.length(80);
    });
  });
  describe('park and rides zipped', function(){
  		var pandr =  shp('http://localhost:3000/files/pandr.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(80);
    });
  });
  describe('senate unzipped', function(){
  		var pandr =  shp('http://localhost:3000/test/data/senate');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(40);
    });
  });
  describe('mixed case zipped', function(){
  		var pandr =  shp('http://localhost:3000/test/data/mixedcase.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(40);
    });
  });
  describe('senate zipped', function(){
      var pandr =  shp('http://localhost:3000/test/data/senate.zip');
    it('should have the right keys', function(){
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
      return pandr.then(function(a){return a.features}).should.eventually.have.length(40);
    });
  });
  describe('county unzipped', function(){
  		var pandr =  shp('http://localhost:3000/test/data/counties');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(14);
    });
  });
  describe('county zipped', function(){
  		var pandr =  shp('http://localhost:3000/test/data/counties.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(14);
    });
  });
  describe('trains zipped', function(){
  		var pandr =  shp('http://localhost:3000/test/data/train_stations.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(361);
    });
  });
  describe('z', function(){
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
  describe('row callback', function(){
    var newPoint = { type: 'Point', coordinates: [0, 1] };
    var pandr =  shp('http://localhost:3000/files/pandr', null, function row(geometry, i) {
      if (i === 0 && geometry.type == 'Point') {
        return newPoint;
      }
    });
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features;}).should.eventually.have.length(80);
    });
    it('should have the manipulated result from the row callback',function(){
      return pandr.then(function(a){return a.features[0].geometry;})
      .should.eventually.deep.equal(newPoint);
    });
    it('should have the original result when the row callback did not gave anything new',function(){
      return pandr.then(function(a){return a.features[1].geometry;})
      .should.eventually.deep.equal({
        type: 'Point',
        coordinates: [-71.0766222509774, 41.80337948642367]
      });
    });
  });
  describe('empty attributes table', function(){
      var pandr =  shp('http://localhost:3000/files/empty-shp.zip');
    it('should have the right keys', function(){
      return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
      return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
      return pandr.then(function(a){return a.features}).should.eventually.have.length(2);
    });
  });
  describe('errors', function(){
    it('bad file should be rejected', function(){
      return shp('http://localhost:3000/test/data/bad').should.be.rejected;
    });
    it('imaginary file file should be rejected', function(done){
      shp('http://localhost:3000/test/data/notthere').then(function () {
        done(true);
      }, function () {
        done();
      });
    });
    it('bad zip be rejected', function(){
      return shp('http://localhost:3000/test/data/badzip.zip').should.be.rejected;
    });
    it('no shp in zip', function(){
      return shp('http://localhost:3000/test/data/noshp.zip').should.be.rejected;
    });
  });
  describe('encoding', function () {
    it('should work for utf.zip', function(){
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
    it('should work for utf', function(){
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
    it('should work for codepage.zip', function(){
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
    it('should work for codepage', function(){
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
  });
});
