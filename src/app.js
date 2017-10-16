authService = require('./test.service');

module.exports = angular
    .module('angularjs-hana-authenticate', [])
    .constant('HANA_TOKEN_URL', '/sap/hana/xs/formLogin/token.xsjs')
    .constant('HANA_LOGIN_URL', '/sap/hana/xs/formLogin/login.xscfunc')
    .constant('HANA_LOGOUT_URL', '/sap/hana/xs/formLogin/logout.xscfunc')
    .constant('HANA_CHECK_SESSION_URL', '/sap/hana/xs/formLogin/checkSession.xsjs')
    .service('hanaAuth', authService);
