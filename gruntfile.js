/**
 * Created by Big on 18.02.2015.
 */
module.exports = function(grunt)
{
    console.log('Working dir: ' + __dirname);

	var cfg = grunt.file.readJSON('package.json');
    var dir = __dirname;

	grunt.initConfig({

		pkg: cfg,
		version: cfg.version,
		//		jshint: {
		//			options: {
		//				reporter: require('jshint-stylish'),
		//				jshintrc: true
		//			},
		//			build: {
		//				src: ['gruntfile.js', 'tasks/*.js']
		//			},
		//			src: {
		//				src: 'src/**/*.js'
		//			}
		//		},
		concat: {
			options: {
				separator: '\n\n//######################################################################################\n\n'
			},
			js: {
				src: [dir + "/js/Core.js", dir + '/js/mix/**/*.js', dir + '/js/test/**/*.js'],
                dest: dir + '/app/js/mix.js'
			}
		},
		watch: {
			options: {
				spawn: false
			},
			js: {
				files: [dir + '/js/**/*.js'],
				tasks: ['concat:js']
			}
		}
	});
	// load npm tasks
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	//	grunt.loadNpmTasks('grunt-contrib-jshint');
	//	grunt.loadNpmTasks('grunt-contrib-cssmin');
	//	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', ['concat:js']); //'jshint', 'test'
}