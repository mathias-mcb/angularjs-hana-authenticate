authService = require('./test.service');

module.exports = angular
    .module('angularjs-hana-authenticate', [])
    .service('hanaAuth', authService);
