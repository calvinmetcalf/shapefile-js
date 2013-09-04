module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		requirejs:{
        all:{options:{
          out: "./dist/shp.js",
          baseUrl: ".",
          wrap: {
            startFile: 'almond/top.frag',
            endFile: 'almond/end.frag'
          },
          name: 'node_modules/almond/almond',
          include: ['shp'],
          optimize:'uglify2',
          uglify2:{
           mangle: true
          },
          preserveLicenseComments: false
        }
      }
      }
      });
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.registerTask('default', ['requirejs']);
}
