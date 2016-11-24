module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    babel: {
      options: {plugins: ['lodash'], presets: ['es2015'], compact: true},
      dist: {files: {'dist/<%= pkg.name %>.js': 'tmp/<%= pkg.name %>.js'}}
    },
    browserify: {
      options: {browserifyOptions: {standalone: 'jsmf', fullPaths: true}},
      files: {files: {'tmp/<%= pkg.name %>.js': 'src/index.js'}}
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    }
  })

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-babel')
  grunt.loadNpmTasks('grunt-browserify')

  // Default task(s).
  grunt.registerTask('default', ['browserify','babel','uglify'])

};
