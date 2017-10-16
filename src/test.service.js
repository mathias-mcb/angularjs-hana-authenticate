module.exports = [
    "$q",
    "$http",
    "HANA_TOKEN_URL",
    "HANA_LOGIN_URL",
    "HANA_LOGOUT_URL",
    "HANA_CHECK_SESSION_URL",
    function (
        $q,
        $http,
        TOKEN_URL,
        LOGIN_URL,
        LOGOUT_URL,
        CHECK_SESSION_URL
    ) {

    ///////////////////
    //    PUBLIC     //
    ///////////////////

    return {
        login: login,
        logout: logout,
        check: check,
        parse: {
            username: transformToValidUsername
        }
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

                var loginString = _urlEncoded('xs-username', transformToValidUsername(username));
                loginString = loginString + "&";
                loginString = loginString + _urlEncoded('xs-password', password.trim());

                return $http({
                    method: 'post',
                    url: LOGIN_URL,
                    headers: {
                        "X-CSRF-Token": token,
                        "Accept": "*/*",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    timeout: 5000,
                    data: loginString
                });

            }).then(function (response) {

                // the server can request the user to change the password before continuing
                // -> the request responds OK but we have to handle it as error
                //
                if (response.data.pwdChange === true) {
                    throw new Error("PASSWORD_CHANGE_REQUIRED");
                }

                return response;
            });
    }

    /**
     * Logout from the hana backend -> remove the auth cookies
     *
     * @return {$http}
     */
    function logout() {

        return _requestToken()
            .then(function (token) {

                return $http({
                    method: 'post',
                    url: LOGOUT_URL,
                    timeout: 5000,
                    headers: {
                        "X-CSRF-Token": token,
                    },
                });
            });
    }


    /**
     * Validate if the session is still valid.
     *
     * @param {boolean} [force] - force a request
     * @returns {Promise}
     */
    function check(){

        // Request a new session check
        //
        return $http({
                method: 'get',
                timeout: 5000,
                url: CHECK_SESSION_URL,
            })
            .then(function (response) {

                console.log(response.data);
                console.log(response);

                if (response.data.pwdChange === true) {

                    throw new Error("PASSWORD_CHANGE_REQUIRED");
                } else if (response.data.login === true) {

                    return response;
                } else {

                    throw new Error("ERROR_AUTHENTICATION_NO_SESSION");
                }
            });
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
            headers: {
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
        return response.headers('x-csrf-token');
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