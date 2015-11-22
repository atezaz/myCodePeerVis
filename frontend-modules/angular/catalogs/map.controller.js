app.controller('MapController', function ($scope, $http, $rootScope,
                                          $timeout, $sce, $location,
                                          toastr, mapService, courseService) {

    $scope.treeNodes = [];
    $scope.jsPlumbConnections = [];
    $scope.widgets = [];
    $scope.isTreeInitiated = false;
    $scope.isCurrentTabIsMap = false;
    $scope.infoToast = null;
    $scope.infoEmptyToast = null;
    $scope.nodeModaltitle = "";
    $scope.currentNodeAction = {};

    /**
     * find node recursively
     *
     * @param obj
     * @param col next search will be the array value of this key
     * @param searchKey
     * @param searchValue
     * @returns {*}
     */
    var found = false;
    $scope.findNode = function (obj, col, searchKey, searchValue) {
        if (found)
            return found;

        for (var i in obj) {
            var tn = obj[i];

            if (tn[searchKey] && tn[searchKey] == searchValue) {
                found = tn;
                return tn;
            }
            else if (tn[col] && tn[col].length > 0) {
                // search again
                $scope.findNode(tn[col], col, searchKey, searchValue);
            }
        }

        if (found)
            return found;
    };

    $scope.initDropDownMenuHybrid = function () {
        $('#tree .course-map').on('click', function (event) {
            var target = $(event.target);
            var k = target.parents('div');
            if (k.hasClass('ui-draggable') && k.hasClass('w')) {
                return true;
            } else if (k.hasClass('center-course')) {
                return true;
            } else if (target.hasClass('w')) {
                return true;
            }

            if ($('.open').length > 0) {
                $('.open').removeClass('open');
                return false;
            }
        });
    };

    /**
     * get all categories, recursived on the server
     */
    $scope.initTab = function (course) {
        // add hover to center instantiate on hover
        $scope.initDropDown('center');

        mapService.init(course._id,

            function (treeNodes) {
                if (treeNodes.length > 0) {
                    $scope.treeNodes = treeNodes;
                } else {
                    $scope.initJSPlumb();
                    $scope.showMapEmptyInfo();
                }
            },

            function (err) {
                console.log(err);
                toastr.error('cannot load course tree');
            }
        );
    };

    $scope.tabOpened = function () {

        if (courseService.course) {
            $scope.course = courseService.course;

            if (mapService.treeNodes) {
                $scope.treeNodes = mapService.treeNodes;
            }

            $scope.initTab(courseService.course);
        } else {

            $scope.$on('onAfterInitCourse', function (event, course) {
                $scope.initTab(course);
            });
        }

        $rootScope.$broadcast('onCoursePreviewTabOpened', $scope.currentTab);
    };

    // initiate draggable jqUI to the topic node
    $scope.initDraggable = function (jsPlumbInstance) {
        var w = window.innerWidth;
        var h = window.innerHeight;

        // let us drag and drop the cats
        var mapEl = jsPlumb.getSelector(".course-map .w.owned");
        jsPlumbInstance.draggable(mapEl, {
            // update position on drag stop
            stop: function () {
                var el = $(this);
                var pos = el.position();
                var distanceFromCenter = {
                    x: pos.left - Canvas.w / 2,
                    y: pos.top - Canvas.h / 2
                };

                var nId = el.attr('id').substring(1); // remove 't' from the node id
                found = false;
                var pNode = $scope.findNode($scope.treeNodes, 'childrens', '_id', nId);

                $http.put('/api/treeNodes/' + nId + '/positionFromRoot', distanceFromCenter)
                    .success(function (res, status) {
                        //console.log(res);
                        if (pNode)
                            pNode.positionFromRoot = distanceFromCenter;
                    })
                    .error(function (res, status) {
                        console.log('err');
                        console.log(res);
                    });
            }
        });
    };

    $scope.initJSPlumb = function () {
        Tree.init(Canvas.w, Canvas.h);

        var instance;

        $scope.instance = instance = jsPlumb.getInstance({
            Endpoint: ["Blank", {radius: 2}],
            HoverPaintStyle: {strokeStyle: "#3C8DBC", lineWidth: 2},
            PaintStyle: {strokeStyle: "#3C8DBC", lineWidth: 2},
            ConnectionOverlays: [],
            Container: "course-map"
        });

        $scope.initDraggable(instance);

        // initialise all '.w' elements as connection targets.
        instance.batch(function () {
            /* connect center to first level cats recursively*/
            $scope.interConnect('center', $scope.treeNodes, instance);

            /*blanket on click to close dropdown menu*/
            $scope.initDropDownMenuHybrid();
        });
    };

    $scope.initDropDown = function (slug) {
        $('#' + slug)
            .on('click mousedown mouseup touchstart', function (event) {
                if ($(this).find('ul').hasClass('open')) {
                    if ($(this).find('ul').hasClass('dropdown-course')) {
                        return true;
                    }

                    $('.open').removeClass('open');
                    return false;
                }

                $('.open').not($(this).parents('ul')).removeClass('open');
                $(this).find('ul').addClass('open');

                return false;
            })
            .on('mouseenter', function () {
                $scope.requestIconAnalyitics(slug);
            });
    };

    $scope.showMapInfo = function () {
        if (!$scope.infoToast) {
            $scope.infoToast = toastr.info(
                'To add a pdf or a video node (which we call "Content Node"), ' +
                '<br>you need to have at least a subtopic node that acts as a hub.' +
                '<br>' +
                '<br>Hover over the node to see available actions, such as create subtopic or content node'
                , {
                    allowHtml: true,
                    autoDismiss: false,
                    onHidden: function () {
                        if ($scope.infoToast)$scope.infoToast = null;
                    },
                    tapToDismiss: true,
                    extendedTimeOut: 10000,
                    timeOut: 10000,
                    toastClass: 'toast wide',
                });
        } else {
            toastr.clear();
            $scope.infoToast = null;
        }
    };

    $scope.showMapEmptyInfo = function () {
        if (!$scope.infoEmptyToast) {
            $scope.infoEmptyToast = toastr.info(
                'Hi, this course is new, Please add a subtopic first, ' +
                '<br>from there, you can add a content node, then upload a pdf or a video.' +
                '<br>' +
                '<br>Hover over the center node to see available actions.'
                , {
                    allowHtml: true,
                    autoDismiss: false,
                    onHidden: function () {
                        if ($scope.infoEmptyToast)$scope.infoEmptyToast = null;
                    },
                    tapToDismiss: true,
                    extendedTimeOut: 10000,
                    timeOut: 10000,
                    toastClass: 'toast wide',
                });
        } else {
            toastr.clear();
            $scope.infoEmptyToast = null;
        }
    };

    $scope.interConnect = function (parent, treeNodes, instance) {
        // added "t" in id because id cannot start with number
        for (var i in treeNodes) {
            var child = treeNodes[i];
            var childId = 't' + child._id;

            if (child.isDeletedForever)
                continue;

            // instantiate on hover
            $scope.initDropDown(childId);

            // connecting parent and chidlern
            var conn = instance.connect({
                source: parent, target: childId,
                anchors: [
                    ["Perimeter", {shape: jsPlumb.getSelector('#' + parent)[0].getAttribute("data-shape")}],
                    ["Perimeter", {shape: jsPlumb.getSelector('#' + childId)[0].getAttribute("data-shape")}]
                ],
                connector: ["Bezier", {curviness: 5}]
            });

            $scope.jsPlumbConnections.push(conn);

            if (child.childrens) {
                $scope.interConnect(childId, child.childrens, instance);
            }
        }
    };

    $scope.goToDetail = function (categorySlug) {
        window.location.href = "/courses/#/category/" + categorySlug;
    };

    $scope.setMode = function (mode, type, parent) {
        switch (mode) {
            case 'add':
                $scope.currentNodeAction.mode = "add";
                break;
            case 'edit':
                $scope.currentNodeAction.mode = "edit";
                break;
        }

        switch (type) {
            case 'subTopic':
                $scope.currentNodeAction.type = "subTopic";
                $scope.currentNodeAction.typeText = "Sub Topic";
                break;

            case 'contentNode':
                $scope.currentNodeAction.type = "contentNode";
                $scope.currentNodeAction.typeText = "Content Node";
                break;
        }

        $scope.nodeModaltitle = $scope.currentNodeAction.mode + " " + $scope.currentNodeAction.typeText;

        if (parent) {
            $scope.currentNodeAction.parent = parent;
            if (mode == 'add')
                $scope.nodeModaltitle += " under " + parent.name;
        }
        else
            $scope.currentNodeAction.parent = false;

        $rootScope.$broadcast('onAfterSetMode', $scope.course);
    };

    $scope.parseResources = function () {
        for (var i = 0; i < $scope.currentNodeAction.parent.resources.length; i++) {
            var content = $scope.currentNodeAction.parent.resources[i];
            if (content['type'] == 'mp4'
                || content['type'] == 'video'
                || content['type'] == 'videoLink'
            ) {
                $scope.currentNodeAction.parent.videoFile = content;
            } else if (content['type'] == 'pdf'
                || content['type'] == 'pdfLink'
            ) {
                $scope.currentNodeAction.parent.pdfFile = content;
            }
        }
    };

    /**
     * remove all svg generated by js plumb.
     */
    $scope.destroyJSPlumb = function () {
        for (var i in $scope.jsPlumbConnections) {
            var conn = $scope.jsPlumbConnections[i];
            jsPlumb.detach(conn);
        }

        $scope.jsPlumbConnections = [];
    };

    $scope.resourceIcon = function (filetype) {
        switch (filetype) {
            case 'pdf':
            case 'pdfLink':
                return 'fa fa-file-pdf-o';

            case 'mp4':
            case 'videoLink':
            case 'video':
                return 'fa fa-file-video-o';
        }
    };

    $scope.getDataShape = function (nodeType) {
        if (nodeType == 'subTopic')
            return 'Ellipse';

        return 'Rectangle';
    };

    $scope.requestIconAnalyitics = function (nodeId) {
        nodeId = nodeId.substring(1);
        $http.get('/api/server-widgets/topic-icon-analytics/?nodeId=' + nodeId).success(
            function (res) {
                $scope.isRequesting = false;
                if (res.result) {
                    $scope.widgets[nodeId] = $sce.trustAsHtml(res.widgets);
                }
            }
        ).error(function () {
            $scope.isRequesting = false;
        });
    };

    $scope.getContentNodeLink = function (d) {
        return '#/cid/' + $scope.course._id + '/nid/' + d._id;
    };

    $scope.deleteNode = function (data) {
        var msg = '';
        if (data.type == 'subTopic') {
            msg = 'Are you sure you want to delete this sub topic?';
        }
        else {
            msg = 'Are you sure you want to delete this content node?';
        }

        if (confirm(msg)) {
            $http({
                method: 'DELETE',
                url: '/api/treeNodes/' + data._id,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .success(function (res) {
                    //console.log(res);
                    if (res.result) {
                        data.isDeleted = true;
                        data.name = '[DELETED]';

                        // destroy the jsplumb instance and svg rendered
                        $scope.destroyJSPlumb();

                        // this will reinitiate the model, and thus also jsplumb connection
                        $scope.treeNodes = angular.copy($scope.treeNodes);
                        $timeout(
                            function () {
                                $scope.$apply();
                                $scope.initJSPlumb();
                            });

                    } else {
                        if (data.result != null && !data.result) {
                            $scope.errors = data.errors;
                            console.log(data.errors);
                        }
                    }
                });
        }
    };

    $scope.deleteNodeForever = function (data) {
        var msg = 'Are you sure you want to delete this content node forever?';
        if (data.type == 'subTopic') {
            msg = 'Are you sure you want to delete this sub topic forever?';
        }

        if (confirm(msg)) {
            $http({
                method: 'DELETE',
                url: '/api/treeNodes/' + data._id,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .success(function (res) {
                    if (res.result) {
                        data.isDeleted = true;
                        data.isDeletedForever = true;
                        data.name = '[DELETED]';

                        // destroy the jsplumb instance and svg rendered
                        $scope.destroyJSPlumb();

                        // this will reinitiate the model, and thus also jsplumb connection
                        $scope.treeNodes = angular.copy($scope.treeNodes);
                        $timeout(
                            function () {
                                $scope.$apply();
                                $scope.initJSPlumb();
                            });

                    }
                })
                .error(function (data) {
                    $scope.errors = data.errors;
                    toastr.error(data.errors);
                });
        }
    };

    $scope.isOwner = function (tn) {
        return tn.createdBy == $scope.user._id;
    };

    $scope.isAuthorized = function (tn) {
        return ($scope.isOwner(tn) || $scope.isAdmin || $scope.isManager);
    };

    $scope.$on('onAfterCreateNode', function (event, treeNode) {
        if (treeNode.parent) {
            found = false;
            var pNode = $scope.findNode($scope.treeNodes, 'childrens', '_id', treeNode.parent);

            if (pNode) {
                pNode.childrens.push(treeNode);
            }
        }
        else
            $scope.treeNodes.push(treeNode);

        // destroy the jsplumb instance and svg rendered
        $scope.destroyJSPlumb();

        // this will reinitiate the model, and thus also jsplumb connection
        $scope.treeNodes = angular.copy($scope.treeNodes);
        $timeout(
            function () {
                $scope.$apply();
                $scope.initJSPlumb();

                if ($('.open').length > 0) {
                    $('.open').removeClass('open');
                    return true;
                }
            });
    });

    $scope.$on('onAfterEditNode', function (event, treeNode) {
        if (treeNode) {
            found = false;
            var pNode = $scope.findNode($scope.treeNodes, 'childrens', '_id', treeNode._id);
            if (pNode) {
                pNode.name = treeNode.name;
            }
        }

        $timeout(
            function () {
                $scope.$apply();
            });
    });

    $scope.$on('onAfterEditContentNode', function (event, treeNode) {
        if (treeNode) {
            found = false;
            var pNode = $scope.findNode($scope.treeNodes, 'childrens', '_id', treeNode._id);
            if (pNode) {
                pNode.name = treeNode.name;
                if (treeNode.resources.length > 0) {
                    for (var i in treeNode.resources) {
                        pNode.resources.push(treeNode.resources[i]);
                    }
                }
            }
        }

        $timeout(
            function () {
                $scope.$apply();
            });
    });

    $scope.$on('jsTreeInit', function (ngRepeatFinishedEvent) {
        $scope.isTreeInitiated = true;
    });

    $scope.$on('onAfterSetMode', function (event, course) {
        if ($scope.currentNodeAction.type == "contentNode") {
            $scope.parseResources();
        }
    });

    $scope.$watchGroup(['isTreeInitiated', 'isCurrentTabIsMap'], function (oldVal, newVal) {
        if ($scope.isTreeInitiated === true && $scope.isCurrentTabIsMap === true) {
            $scope.initJSPlumb();
        }
    });

    $scope.$watch(function () {
        return $location.search()
    }, function (newVal, oldVal) {
        var currentTab = $location.search().tab;
        if (currentTab == 'map') {
            $scope.isCurrentTabIsMap = true;
        }
    }, true);

    $(document).ready(function () {
        $scope.width = jQuery(window).width();
        $scope.height = jQuery(window).height();
        $scope.center = {x: $scope.width / 2, y: ($scope.height / 2) - 100};
    });

    $scope.tabOpened();
});
