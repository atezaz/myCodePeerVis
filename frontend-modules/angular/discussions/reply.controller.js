app.controller('ReplyController', function ($scope, $http, $timeout) {
    $scope.isLoading = false;
    $scope.errors = [];

    $scope.EditFormData = {
        title: " ",
        content: ""
    };

    $scope.AddFormData = {
        title: " ",
        content: ""
    };

    $scope.menu = [
        ['bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript'],
        ['font-size'],
        ['ordered-list', 'unordered-list', 'outdent', 'indent'],
        ['left-justify', 'center-justify', 'right-justify'],
        ['code', 'quote', 'paragraph']
    ];

    $scope.$on('onEditReplyClicked', function (e, post) {
        $scope.EditFormData.content = post.content;
        $scope.EditFormData.postId = post._id;
    });

    $scope.saveNewReply = function (isValid) {
        if (!isValid)
            return;

        console.log('saving reply to ' + $scope.$parent.currentReplyingTo);
        $scope.AddFormData.parentPost = $scope.$parent.currentReplyingTo;

        $scope.isLoading = true;

        var d = transformRequest($scope.AddFormData);
        $http({
            method: 'POST',
            url: '/api/discussion/replies/',
            data: d,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .success(function (data) {
                console.log(data);
                if (data.result) {
                    $scope.$emit('onAfterCreateReply', data.post);

                    $('#addNewReplyModal').modal('hide');

                    $scope.AddFormData.content = "";

                    $timeout(function () {
                        $scope.$apply()
                    });

                    $scope.addNewReplyForm.$setPristine();
                    $scope.isLoading = false;
                    $scope.errors = [];
                }
            })
            .error(function (data) {
                $scope.errors = data.errors;
                $scope.isLoading = false;
            });
    };

    $scope.cancel = function () {
        $scope.EditFormData.content = "";
        $scope.AddFormData.content = "";
        if ($scope.addNewReplyForm)
            $scope.addNewReplyForm.$setPristine();

        if ($scope.editReplyForm)
            $scope.editReplyForm.$setPristine();

        $scope.errors = [];
    };

    $scope.saveEditReply = function (isValid) {
        if (!isValid)
            return;

        console.log('saving edit reply ' + $scope.$parent.currentEditPost._id);

        $scope.isLoading = true;

        var d = transformRequest($scope.EditFormData);
        $http({
            method: 'PUT',
            url: '/api/discussion/' + $scope.$parent.currentEditPost._id,
            data: d,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .success(function (data) {
                console.log(data);
                if (data.result) {
                    $scope.$emit('onAfterEditReply', data.post);

                    $scope.EditFormData.content = "";
                    $timeout(function () {
                        $scope.$apply()
                    });
                    $('#editReplyModal').modal('hide');
                }

                $scope.editReplyForm.$setPristine();
                $scope.isLoading = false;
            })
            .error(function (data) {
                $scope.errors = data.errors;
                $scope.isLoading = false;
            });
    };

    /**
     * deleting root topic
     * @param postId
     */
    $scope.deletePost = function (postId) {
        $http({
            method: 'DELETE',
            url: '/api/discussion/' + postId,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .success(function (data) {
                console.log(data);
                if (data.result) {
                    $scope.$emit('onAfterDeletePost', postId);

                } else {
                    if (data.result != null && !data.result) {
                        $scope.errorName = data.errors;
                        console.log(data.errors);
                    }
                }
            });
    };

});