var fs = require('fs'),
	path = require('path'),
	wrench = require('wrench');

var NAME = 'ti-stl-viewer',
	MODEL = 'test.stl',
	TMP_DIR = 'tmp';

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
			src: ['**/*.js']
		},
		titanium: {
			create: {
				options: {
					command: 'create',
					name: TMP_DIR,
					workspaceDir: '.'
				}
			},
			build: {
				options: {
					command: 'build',
					projectDir: TMP_DIR
				}
			}
		},
		alloy: {
			all: {
				options: {
					command: 'new',
					args: [TMP_DIR]
				}
			}
		},
		clean: {
			src: [TMP_DIR]
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-titanium');
	grunt.loadNpmTasks('grunt-alloy');

	// load test app
	grunt.registerTask('load-app', 'Load source files into example alloy app', function() {
		var srcDir = path.join('test', 'app'),
			dstDir = path.join(TMP_DIR, 'app'),
			assetsDir = path.join(dstDir, 'assets'),
			tmpAssetsDir = path.join(TMP_DIR, 'assets'),
			widgetsDir = path.join(dstDir, 'widgets', NAME);

		// copy app source files
		grunt.log.write('Copying "%s" to "%s"... ', srcDir, dstDir);
		fs.renameSync(assetsDir, tmpAssetsDir);
		wrench.copyDirSyncRecursive(srcDir, dstDir, { forceDelete: true });
		fs.renameSync(tmpAssetsDir, assetsDir);
		fs.writeFileSync(path.join(assetsDir, MODEL), fs.readFileSync(path.join('test', MODEL)));
		grunt.log.ok();

		// copy in widget
		grunt.log.write('Copying %s widget to "%s"... ', NAME, widgetsDir);
		wrench.mkdirSyncRecursive(widgetsDir);
		wrench.copyDirSyncRecursive(NAME, widgetsDir, { forceDelete: true });
		grunt.log.ok();

	});

	// run example app
	grunt.registerTask('test-run', ['clean', 'titanium:create', 'alloy', 'load-app', 'titanium:build']);

	// run tests
	grunt.registerTask('test', ['mochaTest', 'clean']);

	// Register tasks
	grunt.registerTask('default', ['jshint', 'test']);

};