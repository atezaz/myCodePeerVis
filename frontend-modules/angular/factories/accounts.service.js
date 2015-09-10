app.factory('authService', [
    '$rootScope', '$http',

    function($rootScope, $http) {
        return {

            loginCheck : function(successCallback){
                $http.get('/api/accounts').success(function(data) {
                    if(data.result) {
                        $rootScope.user = data.user;

                        $rootScope.$broadcast('onAfterInitUser', $rootScope.user);

                        successCallback($rootScope.user);
                    }
                });
            },

            login: function(loginData, successCallback, errorCallback){
                var d = transformRequest(loginData);
                $http({
                    method: 'POST',
                    url: '/api/accounts/login',
                    data: d,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                    .success(
                    function success(data) {
                        if(data.result) {
                            $rootScope.user = data.user;

                            $rootScope.$broadcast('onAfterInitUser', $rootScope.user);

                            successCallback($rootScope.user);
                        }
                    }).error(
                    function (data) {
                        errorCallback(data);
                    }
                );
            }
        }
    }
]);