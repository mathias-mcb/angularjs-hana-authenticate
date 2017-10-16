angular = require('angular');
require('./../src/app');

angular
    .module('exampleApp', ['angularjs-hana-authenticate'])
    .controller('ExampleController', ['$scope', 'hanaAuth', function($scope, hanaAuth) {

        console.log("controller created", hanaAuth);

        $scope.user = {
            email: "asd",
            pw: "asd",
            name: "..."
        };
        $scope.response = {};

        $scope.send = function(user) {
            user.name = hanaAuth.parse.username(user.email);

            hanaAuth
                .login(user.email, user.pw)
                .then(function(response){
                    console.log("login", response);
                    $scope.response = response;
                })
                .catch(function(error){
                    console.log("login", error);
                    $scope.response = error;
                });

        };

        $scope.logout = function(){
            hanaAuth
                .logout()
                .catch(function(error){
                    console.log("logout", error);
                    $scope.response = error;
                });
        };

        $scope.check = function(){
            hanaAuth
                .check()
                .then(function(response){
                    console.log("check", response);
                    $scope.response = response;
                })
                .catch(function(error){
                    console.log("check", error);
                    $scope.response = error;
                });
        };

    }]);