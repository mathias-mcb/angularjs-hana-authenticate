module.exports = ["$q", function ($q) {

    ///////////////////
    //    PUBLIC     //
    ///////////////////

    return {
        login: login,
        logout: logout
    };

    function login(){
        return $q.resolve("Hallo, Welt");
    }

    function logout(){
        return $q.reject(new Error("Operation denied"));
    }

}];