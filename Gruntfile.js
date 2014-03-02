module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		mochaTest: {
			options: {
				require: ['should'],
				timeout: 3000,
				ignoreLeaks: false,
				reporter: 'spec'
			},
			src: ['test/*_test.js']
		},
		jshint: {
			options: {
				jshintrc: true
			},
			tests: {
				options: {
					jshintrc: true
				},
				src: ['test/*_test.js']
			},
			src: ['lib/*.js']
		},
		clean: {
			src: ['tmp']
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// run tests
	grunt.registerTask('test', ['mochaTest', 'clean']);

	// Register tasks
	grunt.registerTask('default', ['jshint', 'test']);

};