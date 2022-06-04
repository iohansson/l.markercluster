const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

// Karma configuration
// Generated on Fri Jun 03 2022 14:37:12 GMT+0200 (Central European Summer Time)
module.exports = function (config) {
  const files = [
    'spec/sinon.js',
    'spec/expect.js',
    'node_modules/leaflet/dist/leaflet-src.js',
    'spec/before.js',
    'src/index.test.js',
    'spec/after.js',
    'node_modules/happen/happen.js',
    'spec/suites/SpecHelper.js',
    'spec/suites/**/*.js',
    'dist/*.css',
  ];
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    plugins: [
      'karma-esbuild',
      'karma-rollup-preprocessor',
      'karma-mocha',
      'karma-chrome-launcher',
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files,


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/index.test.js': ['rollup'],
    },

    rollupPreprocessor: {
      plugins: [
        json(),
        nodeResolve(),
      ],
      external: [
        'leaflet/dist/leaflet-src.esm.js',
      ],
      output: {
        format: 'iife',
        name: 'LMarkerCluster',
        globals: {
          'leaflet/dist/leaflet-src.esm.js': 'L',
        },
        file: 'karma.rollo.js',
        sourcemap: 'inline',
      },
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    captureTimeout: 5000,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 1,


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
  });
};
