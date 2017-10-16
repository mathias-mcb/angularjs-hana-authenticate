module.exports =  function (
    $rootScope,
    $http,
    LOGIN_URL,
    LOGOUT_URL,
    PASSWORD_CHANGE_URL,
    PASSWORD_POLICY_URL,
    TOKEN_URL,
    CHECK_SESSION_URL,
    LOCAL_STORAGE_LAST_SESSION,
    LOCAL_STORAGE_SESSION_INITIALS_IMAGE,
    AUTHENTICATION_REQUEST_TIMEOUT
) {

    ///////////////////
    //    PUBLIC     //
    ///////////////////

    return {
        login: login,
        logout: logout,
        changePassword: changePassword,
        getPasswordPolicy: getPasswordPolicy,
        checkSession: checkSession,
    };

    ///////////////////
    //    IMPL       //
    ///////////////////

    // Regex to validate passwords as the server expects them
    // - from stackoverflow http://stackoverflow.com/a/1559788
    //
    var passwordLayoutMap = {
        'a': {
            langKey: "ERROR_MIN_ONE_LOWERCASE_LETTER_TITLE",
            regExp: "(?=.*[a-z])",
        },
        'A': {
            langKey: "ERROR_MIN_ONE_UPPERCASE_LETTER_TITLE",
            regExp: "(?=.*[A-Z])",
        },
        '?': {
            langKey: "ERROR_MIN_ONE_SPECIAL_CHAR_TITLE",
            regExp: "", // TODO!!
        },
        '1': {
            langKey: "ERROR_MIN_ONE_NUMBER_TITLE",
            regExp: "(?=.*[0-9])",
        },
    };

    /**
     * Get X-CSRF-Token from currentRequest
     * @param {Object} currentRequest - Request the token is taken from
     * @return {string} X-CSRF-Token
     */
    function _transformToToken(currentRequest) {
        return currentRequest.getResponseHeader('X-CSRF-Token');
    }

    /**
     * Send a request to get a token from the system.
     *
     * @return {Promise}
     */
    function _requestToken() {

        return $http({
                method: 'get',
                url: TOKEN_URL,
                timeout: AUTHENTICATION_REQUEST_TIMEOUT,
                header: {
                    "X-CSRF-Token": "Fetch",
                }
            })
            .then(_transformToToken);
    }

    /**
     * throw the error if we know the type or create a new AuthenticationError
     *
     * @param {AuthenticationError|RequestTimeoutError|Object} error - error that occured
     * @private
     *
     * @throws AuthenticationError or RequestTimeoutError
     */
    function _transformToAuthenticationError(error) {

        if (error instanceof AuthenticationError) {
            throw error;
        } else if (error instanceof RequestTimeoutError) {
            throw error;
        }
        throw new AuthenticationError(error);
    }

    function transformToValidUsername(email) {
        return email.replace(/[\u0021-\u0022\u0024-\u0025\u0027-\u0029\u002A-\u002F\u003A-\u0040\u005B-\u005E\u0060\u007B-\u007E]/g, "_");
    }

    /**
     * Do the login with username and password
     * @param {string} username - Name of the User
     * @param {string} password - Password of the User
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
                    timeout: AUTHENTICATION_REQUEST_TIMEOUT,
                    body: {
                        'xs-username': transformToValidUsername(username),
                        'xs-password': password.trim(),
                    }
                }).then(function (response) {

                    // the server can request the user to change the password before continuing
                    // -> the request responds OK but we have to handle it as error
                    //
                    if (response.pwdChange === true) {
                        throw new AuthenticationError("pwdChange");
                    }

                    return checkSession();

                }).then(_saveSession);

            }).catch(_transformToAuthenticationError);
    }

    /**
     * Do the logout and navigate to the login page.
     *
     * @return {Promise}
     */
    function logout() {

        return _requestToken().then(function (token) {

            return $http({
                method: 'post',
                url: LOGOUT_URL,
                timeout: AUTHENTICATION_REQUEST_TIMEOUT,
                header: {
                    "X-CSRF-Token": token,
                },
            }).then(function (data) {
                $rootScope.$broadcast('sb.global.logout');
                return data;
            });
        });
    }

    /**
     * Create a PasswordChangeError or throw the existing PasswordChangeError.
     *
     * @param {Object|PasswordChangeError|RequestTimeoutError} error - error that is thrown
     * @throws PasswordChangeError, RequestTimeoutError
     */
    function _transformToPasswordChangeError(error) {

        if (error instanceof PasswordChangeError) {
            throw error;
        } else if (error instanceof RequestTimeoutError) {
            throw error;
        }
        throw new PasswordChangeError(error);
    }

    /**
     * Do the password change
     *
     * @param {string} oldPassword - Old password of the user
     * @param {string} newPassword - New password of the user
     * @return {Promise}
     */
    function changePassword(oldPassword, newPassword) {

        return _requestToken()
            .then(function (token) {

                return $http({
                    method: 'post',
                    url: PASSWORD_CHANGE_URL,
                    timeout: AUTHENTICATION_REQUEST_TIMEOUT,
                    header: {
                        "X-CSRF-Token": token,
                        "Accept": "*/*",
                    },
                    formUrlencoded: true,
                    body: {
                        'xs-password-old': oldPassword.trim(),
                        'xs-password-new': newPassword.trim(),
                    }
                }).then(function () {
                    return checkSession();
                }).then(_saveSession);

            }).catch(_transformToPasswordChangeError);
    }

    /**
     * Build a regular expression from a string
     *
     * @param {string} regexp - String that represents regular Expression
     * @returns {RegExp}
     * @private
     */
    function _buildRegExpForPassword(regexp) {
        return new RegExp("^" + regexp + ".+$");
    }

    /**
     * Get the password policy from the server and return a proper object for validation
     *
     * @returns {Promise<Object>}
     */
    function getPasswordPolicy() {

        return $http({
            url: PASSWORD_POLICY_URL,
        }).catch(function (error) {

            $log.error("can not fetch password policy - default policy is used instead. Got:", error);

            // return the default policy
            //
            return {
                "minimal_password_length": "8",
                "password_layout": "Aa"
            };

        }).then(function (response) {

            var layout = response.password_layout.split('');

            return {
                minlength: parseInt(response.minimal_password_length, 10) || 6,
                maxlength: parseInt(response.maximal_password_length, 10) || 64,
                layout: layout,
                regexPattern: _buildRegExpForPassword(layout.map(function (value) {
                    return passwordLayoutMap[value].regExp;
                }).join('')),
            };
        });
    }

    /**
     * Validate if the session is still valid.
     *
     * @param {boolean} [force] - force a request
     * @returns {Promise}
     */
    function checkSession() {

        // Request a new session check
        //
        return $http({
                method: 'get',
                timeout: AUTHENTICATION_REQUEST_TIMEOUT,
                url: CHECK_SESSION_URL,
            }).then(function (response) {
                if (response.pwdChange) {
                    throw new AuthenticationError("pwdChange");
                } else if (response.login) {

                    // call intercom boot in async manner -> should not affect our service
                    intercomService.boot(response);

                    return response;
                } else {
                    throw new AuthenticationError("ERROR_AUTHENTICATION_NO_SESSION");
                }
            })
            .catch(_transformToAuthenticationError);
    }
}
