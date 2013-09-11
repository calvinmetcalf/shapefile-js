module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs:{
        all:{options:{
          out: "./dist/shp.js",
          baseUrl: ".",
          paths:{
          	jszip:'node_modules/jszip/jszip',
          	proj4:'node_modules/proj4js/proj4'
          },
          wrap: {
            startFile: 'almond/top.frag',
            endFile: 'almond/end.frag'
          },
          name: 'node_modules/almond/almond',
          include: ['shp'],
          optimize:'uglify2',
          //optimize:'none',
          uglify2:{
           mangle: true
          },
          preserveLicenseComments: false
        }
      }
      }
      });
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.registerTask('test', ['connect','mocha_phantomjs']);
	grunt.registerTask('default', ['requirejs']);
}
