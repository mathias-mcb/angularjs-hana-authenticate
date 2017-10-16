/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

authService = __webpack_require__(2);

module.exports = angular
    .module('angularjs-hana-authenticate', [])
    .service('hanaAuth', authService);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(0);
__webpack_require__(0);
module.exports = __webpack_require__(3);


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = ["$q", "$http", function ($q, $http) {

    var TOKEN_URL   = '/sap/hana/xs/formLogin/token.xsjs';
    var LOGIN_URL   = '/sap/hana/xs/formLogin/login.xscfunc';

    ///////////////////
    //    PUBLIC     //
    ///////////////////

    return {
        login: login,
        logout: logout
    };

    /**
     * Do the login with username and password
     *
     * @param {string} username - Name of the User
     * @param {string} password - Password of the User
     *
     * @return {Promise}
     */
    function login(username, password, domain) {

        return _requestToken(domain)
            .then(function (token) {

                var loginString = _urlEncoded('xs-username', transformToValidUsername(username));
                loginString = loginString + "&";
                loginString = loginString + _urlEncoded('xs-password', password.trim());

                return $http({
                    method: 'post',
                    url: _includeDomain(domain, LOGIN_URL),
                    headers: {
                        "X-CSRF-Token": token,
                        "Accept": "*/*",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    timeout: 10000,
                    data: loginString
                });

            }).then(function (response) {

                console.log(response);

                // the server can request the user to change the password before continuing
                // -> the request responds OK but we have to handle it as error
                //
                if (response.pwdChange === true) {
                    throw new Error("PASSWORD_CHANGE_REQUIRED");
                }
            });
    }

    function logout(){
        return $q.reject(new Error("Operation denied"));
    }

    /**
     * Send a request to get a token from the system.
     *
     * @return {$http}
     */
    function _requestToken(domain) {

        return $http({
            method: 'get',
            url: _includeDomain(domain, TOKEN_URL),
            timeout: 2000,
            header: {
                "X-CSRF-Token": "Fetch",
            }
        }).then(_transformToToken);
    }

    /**
     * Get X-CSRF-Token from currentRequest
     *
     * @param {Object} response - Request the token is taken from
     * @return {string} X-CSRF-Token
     */
    function _transformToToken(response) {
        return response.headers('X-CSRF-Token');
    }

    function _includeDomain(domain, url){
        if(domain){
            return domain + url;
        }else{
            return url;
        }
    }

    function _urlEncoded(key, value){
        return encodeURIComponent(key) + "=" + encodeURIComponent(value);
    }

    /**
     * Replace special characters by _ because HANA DB users do not allow these special characters and
     * by convention they are replaced with an underscore.
     *
     * @param {string} email or username
     * @return {string} username for login
     */
    function transformToValidUsername(email) {
        return email.replace(/[\u0021-\u0022\u0024-\u0025\u0027-\u0029\u002A-\u002F\u003A-\u0040\u005B-\u005E\u0060\u007B-\u007E]/g, "_");
    }

}];

/***/ }),
/* 3 */
/***/ (function(module, exports) {



/***/ })
/******/ ]);