describe('Shp', function(){
  describe('park and rides not zipped', function(){
  		var pandr =  shp('../files/pandr');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(80);
    });
    it('should have the right things',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.deep.equal(pData.features);
    });
  });
  describe('park and rides zipped', function(){
  		var pandr =  shp('../files/pandr.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(80);
    });
    it('should have the right things',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.deep.equal(pData.features);
    });
  });
  describe('senate unzipped', function(){
  		var pandr =  shp('data/senate');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(40);
    });
    it('should have the right things',function(){
    	return pandr.then(function(a){return a.features.slice(0,10)}).should.eventually.deep.equal(senateData.features.slice(0,10));
    });
  });
  describe('senate zipped', function(){
  		var pandr =  shp('data/senate.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(40);
    });
    it('should have the right things',function(){
    	return pandr.then(function(a){return a.features.slice(0,10)}).should.eventually.deep.equal(senateData.features.slice(0,10));
    });
  });
  describe('county unzipped', function(){
  		var pandr =  shp('data/counties');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(14);
    });
    it('should have the right things',function(){
    	return pandr.then(function(a){return a.features.slice(0,3)}).should.eventually.deep.equal(countyData.features.slice(0,3));
    });
  });
  describe('county zipped', function(){
  		var pandr =  shp('data/counties.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(14);
    });
    it('should have the right things',function(){
    	return pandr.then(function(a){return a.features.slice(0,3)}).should.eventually.deep.equal(countyData.features.slice(0,3));
    });
  });
});