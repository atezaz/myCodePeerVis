app.directive('widgetBox',
    function ($compile, $timeout, $rootScope, $parse) {
        return {
            restrict: 'E',

            terminal: true,
            transclude: true,

            scope: {
                showTools: '=',
                showConfigButton: '=',
                title: '@',
                entryPoint: '@',
                closeAction: '&',
                editAction: '&',
                onloadAction: '&'
            },

            templateUrl: '/angular/views/widget-box.html'
        };
    });