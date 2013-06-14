module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat:{
			all:{
				options:{
					banner:"function shp(){};"
				},
				src:['./setImmediate.js','./promiscuous.js','./shp-src.js'],
				dest:'./shp.js'
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default', ['concat']);
}
