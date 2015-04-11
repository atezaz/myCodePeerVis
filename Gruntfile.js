'use strict';
module.exports = function (grunt) {
  // load all grunt tasks
  grunt.loadNpmTasks('grunt-bowercopy');

  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  grunt.initConfig({
    bowercopy: {
      options: {
        srcPrefix: 'bower_components'
      },
      scripts: {
        options: {
          destPrefix: 'public'
        },
        files: {
          'angular/angular.min.js': 'angular/angular.min.js',
          'angular/angular.min.js.map': 'angular/angular.min.js.map',

          'angular/angular-resource.min.js': 'angular-resource/angular-resource.min.js',
          'angular/angular-resource.min.js.map': 'angular-resource/angular-resource.min.js.map',

          'angular/angular-route.min.js': 'angular-route/angular-route.min.js',
          'angular/angular-route.min.js.map': 'angular-route/angular-route.min.js.map',

          'angular/angular-cookies.min.js': 'angular-cookies/angular-cookies.min.js',
          'angular/angular-cookies.min.js.map': 'angular-cookies/angular-cookies.min.js.map',

          'd3/d3.min.js': 'd3/d3.min.js'
        }
      }
    },

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'modules/angular/*.js'
        ],
        dest: 'public/angular/courseMapper.js'
      },
      js: {
        src: 'modules/angular-admin/*.js',
        dest: 'public/angular/courseMapperAdmin.js'
      }
    },

    watch: {
      scripts: {
        files: ['modules/angular/*.js','modules/angular-admin/*.js'],
        tasks: ['concat:dist', 'concat:js'],
        options: {
          spawn: false
        }
      }
    }

  });

  // the default task (running "grunt" in console)
  grunt.registerTask('default', ['bowercopy', 'concat:dist', 'concat:js']);
};
