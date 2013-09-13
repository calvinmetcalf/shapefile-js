
module.exports = function(grunt) {
	function rename(){
		var ast = esprima.parse(grunt.file.read('./dist/shp.js'));
		estraverse.traverse(ast,{leave:function(node, parent) {if (node.type == 'Identifier'&&node.name==='require'){node.name = '___forBrowserify___';}}});
		grunt.file.write('./dist/shp.js',escodegen.generate(ast));
	}
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
      },browserifyify:{
        all:{
            options:{
                file:"./dist/shp.js"
            }
        }
        }
      });
    grunt.loadNpmTasks('grunt-browserifyify');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.registerTask('test', ['connect','mocha_phantomjs']);
	grunt.registerTask('rename','browserifyify');
	grunt.registerTask('default', ['requirejs','rename']);
}
