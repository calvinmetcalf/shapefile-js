module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat:{
			all:{
				src:['./src/top.js','./src/setImmediate.js','./src/promiscuous.js','./src/shp.js'],
				dest:'./dist/shp.js'
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default', ['concat']);
}
