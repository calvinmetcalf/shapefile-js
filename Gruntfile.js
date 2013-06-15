module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat:{
			all:{
				options:{
					banner:"function shp(base){\n\
					return shp.all([\n\
						shp.binaryAjax(base+'.shp').then(shp.parseShp),\n\
						shp.binaryAjax(base+'.dbf').then(shp.parseDbf)]\n\
					).then(shp.combine)}"
				},
				src:['./setImmediate.js','./promiscuous.js','./shp-src.js'],
				dest:'./shp.js'
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default', ['concat']);
}
