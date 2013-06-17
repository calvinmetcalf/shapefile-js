module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat:{
			all:{
                options:{
                    banner:'/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>*/\nfunction shp(base){return shp.getShapefile(base);};\n'
                },
				src:['./src/setImmediate.js','./src/promiscuous.js','./src/top.js','./src/shp.js','./src/dbf.js','./src/bottom.js','./src/jszip.js'],
				dest:'./dist/shp.js'
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default', ['concat']);
}
