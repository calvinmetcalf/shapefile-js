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
  describe('world boundaries unzipped', function(){
  		var pandr =  shp('../files/TM_WORLD_BORDERS_SIMPL-0.3');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(246);
    });
    it('should have the right things',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.deep.equal(WB.features);
    });
  });
  describe('world boundaries zipped', function(){
  		var pandr =  shp('../files/TM_WORLD_BORDERS_SIMPL-0.3.zip');
    it('should have the right keys', function(){
    	return pandr.should.eventually.contain.keys('type', 'features');
    });
    it('should be the right type',function(){
    	return pandr.should.eventually.have.property('type', 'FeatureCollection');
    });
    it('should have the right number of features',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.have.length(246);
    });
    it('should have the right things',function(){
    	return pandr.then(function(a){return a.features}).should.eventually.deep.equal(WB.features);
    });
  });
});