module.exports = ["$q", "$http", function ($q, $http) {


    //module.constant('PASSWORD_CHANGE_URL', '/sap/hana/xs/formLogin/pwchange.xscfunc');
    //module.constant('PASSWORD_POLICY_URL', '/sap/hana/xs/selfService/user/selfService.xsjs?action=getPasswordPolicy');

    var TOKEN_URL   = '/sap/hana/xs/formLogin/token.xsjs';
    var LOGIN_URL   = '/sap/hana/xs/formLogin/login.xscfunc';
    var LOGOUT_URL  = '/sap/hana/xs/formLogin/logout.xscfunc';
    var RESET_PASSWORD_URL = '/sablono/web/public/password/reset.xsjs';

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
    function login(username, password) {

        return _requestToken()
            .then(function (token) {

                return $http({
                    method: 'post',
                    url: LOGIN_URL,
                    header: {
                        "X-CSRF-Token": token,
                        "Accept": "*/*",
                    },
                    formUrlencoded: true,
                    timeout: 2000,
                    body: {
                        'xs-username': transformToValidUsername(username),
                        'xs-password': password.trim(),
                    }
                });

            }).then(function (response) {

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
    function _requestToken() {

        return $http({
            method: 'get',
            url: TOKEN_URL,
            timeout: 2000,
            header: {
                "X-CSRF-Token": "Fetch",
            }
        }).then(_transformToToken);
    }

    /**
     * Get X-CSRF-Token from currentRequest
     *
     * @param {Object} currentRequest - Request the token is taken from
     * @return {string} X-CSRF-Token
     */
    function _transformToToken(currentRequest) {
        return currentRequest.getResponseHeader('X-CSRF-Token');
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