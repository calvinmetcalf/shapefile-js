module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat:{
			all:{
				options:{
					banner:"function shp(base){return shp.all([shp.getShp(base),shp.getDbf(base)]).then(shp.make)}"
				},
				src:['./setImmediate.js','./promiscuous.js','./shp-src.js'],
				dest:'./shp.js'
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default', ['concat']);
}
