// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 3,
    plugins: [
      require('karma-jasmine'),
      require('karma-brief-reporter'),
      require('karma-summary-reporter'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('karma-mocha-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, '../coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },
    reporters: ['brief','mocha'],
    mochaReporter: { 
      output: 'minimal',
      symbols: {
        success: '*',
        info: '#',
        warning: '!',
        error: 'x'
      }
    },
    summaryReporter: {
      // 'failed', 'skipped' or 'all'
      show: 'all',
      // Limit the spec label to this length
      specLength: 50,
      // Show an 'all' column as a summary
      overviewColumn: true,
      symbols: {
        success: '*',
        info: '#',
        warning: '!',
        error: 'x'
      }
    },
    briefReporter: {
      suppressBrowserLogs: true,
      renderOnRunCompleteOnly: true
    },
    port: 9876,
    autoWatch: false,
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-web-security',
          '--remote-debugging-port=9222'
        ]
      }
    },
    singleRun: true,
    restartOnFileChange: false,
    retryLimit: 1
  });
};
