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
  });
  describe('trains zipped', function(){
  		var pandr =  shp('data/train_stations.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(361);
    });
 

  it('bad file should be rejected', function(){
    return shp('data/bad').should.be.rejected;
  });
});
  });