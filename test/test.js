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
});
