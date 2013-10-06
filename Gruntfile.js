module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		component: {
			build: {
				options: {
					args: {
						out: 'dist',
						name: 'shp',
						standalone: 'shp'
					}
				}
			}
		},
		uglify: {
            options: {
                report: 'gzip',
                mangle: true
            },
            all: {
                src: 'dist/shp.js',
                dest: 'dist/shp.min.js'
            }
        },
        jshint: {
      		options: {
        		jshintrc: "./.jshintrc"
      		},
      		all: ['./lib/*.js']
    	}
	});
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-component');
	grunt.registerTask('default', ['jshint','component','uglify']);
};
