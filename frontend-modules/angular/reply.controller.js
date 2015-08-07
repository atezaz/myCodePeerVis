app.
    controller('ReplyController', function($scope, $http) {
        $scope.formData = {
            title: "",
            content: ""
        };

        $scope.menu = [
            ['bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript'],
            [ 'font-size' ],
            ['ordered-list', 'unordered-list', 'outdent', 'indent'],
            ['left-justify', 'center-justify', 'right-justify'],
            ['code', 'quote', 'paragraph']
        ];


        $scope.saveNewReply = function(){
            console.log('saving reply to ' + $scope.$parent.currentReplyingTo);
            $scope.formData.parentPost = $scope.$parent.currentReplyingTo;

            var d = transformRequest($scope.formData);
            $http({
                method: 'POST',
                url: '/api/discussions/replies/',
                data: d,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .success(function(data) {
                    console.log(data);
                    if(data.result) {
                        $scope.$emit('onAfterCreateReply', data.post);

                        $('#addNewReplyModal').modal('hide');
                    } else {
                        if( data.result != null && !data.result){
                            $scope.errorName = data.errors;
                            console.log(data.errors);
                        }
                    }
                }) ;
        };

        $scope.saveEditReply = function(){
            console.log('saving edit reply ' + $scope.$parent.currentEditPost._id);

            var d = transformRequest($scope.formData);
            $http({
                method: 'PUT',
                url: '/api/discussion/' + $scope.$parent.currentEditPost._id,
                data: d,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .success(function(data) {
                    console.log(data);
                    if(data.result) {
                        $scope.$emit('onAfterEditReply', data.post);

                        $('#EditReplyModal').modal('hide');
                    } else {
                        if( data.result != null && !data.result){
                            $scope.errorName = data.errors;
                            console.log(data.errors);
                        }
                    }
                }) ;
        };

    });