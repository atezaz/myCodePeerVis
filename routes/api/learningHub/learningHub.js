var express = require('express');
var router = express.Router();
var appRoot = require('app-root-path');
var controller = require(appRoot + '/modules/learningHub/learningHub.controller.js');
var NodeController = require(appRoot + '/modules/trees/index.js');
var helper = require(appRoot + '/libs/core/generalLibs.js');
var userHelper = require(appRoot + '/modules/accounts/user.helper.js');
var mongoose = require('mongoose');
var debug = require('debug')('cm:route');

router.get('/scrape', function (req, res) {
    controller.scrape(req.query.url, function (error, details) {

        if (error) {
            res.send("invalid link")
        } else {
            res.json(details);
        }
    });


});

router.post('/add/:nodeId', helper.l2pAuth, helper.ensureAuthenticated,
    function (req, res) {
        if (!req.user) {
            res.status(401).send('Unauthorized');
            return;
        }
        var userId = mongoose.Types.ObjectId(req.user._id);
        var nodeId = mongoose.Types.ObjectId(req.params.nodeId);
        req.body.contentId = nodeId;
        req.body.userId = userId;
        var nod = new NodeController();

        nod.getNodeAsync()({
            _id: nodeId
        }).then(function (tn) {
            if (tn.courseId._id) {
                userHelper.isEnrolledAsync({userId: userId, courseId: tn.courseId._id})
                    .then(function (isAllwd) {
                        if (!isAllwd) {
                            return helper.resReturn(helper.createError401(), res);
                        }
                        req.body.courseId = mongoose.Types.ObjectId(tn.courseId._id);
                        controller.add(function (err) {
                                console.log(err);
                                return;
                            }, req.body
                            , function (post) {
                                res.status(200).json({
                                    result: true, post: post
                                });
                            });

                    });
            }
        });


    });

router.post('/addPersonal/:nodeId', helper.l2pAuth, helper.ensureAuthenticated,
    function (req, res) {
        if (!req.user) {
            res.status(401).send('Unauthorized');
            return;
        }
        var userId = mongoose.Types.ObjectId(req.user._id);
        var nodeId = mongoose.Types.ObjectId(req.params.nodeId);
        req.body.contentId = nodeId;
        req.body.currentUser = userId;
        var nod = new NodeController();

        nod.getNodeAsync()({
            _id: nodeId
        }).then(function (tn) {
            if (tn.courseId._id) {
                userHelper.isEnrolledAsync({userId: userId, courseId: tn.courseId._id})
                    .then(function (isAllwd) {
                        if (!isAllwd) {
                            return helper.resReturn(helper.createError401(), res);
                        }
                        controller.addPersonal(function (err) {
                                console.log(err);
                                return;
                            }, req.body
                            , function (post) {
                                res.status(200).json({
                                    result: true, post: post
                                });
                            });
                    });
            }
        });
    });

router.delete('/deletePersonal/:nodeId', helper.l2pAuth, helper.ensureAuthenticated,

    function (req, res) {
        if (!req.user) {
            res.status(401).send('Unauthorized');
            return;
        }
        var userId = mongoose.Types.ObjectId(req.user._id);
        var nodeId = mongoose.Types.ObjectId(req.params.nodeId);

        var query = {
            postId : req.query.postId,
            userId : userId
        }
        var nod = new NodeController();

        nod.getNodeAsync()({
            _id: nodeId
        }).then(function (tn) {
            if (tn.courseId._id) {
                userHelper.isEnrolledAsync({userId: userId, courseId: tn.courseId._id})
                    .then(function (isAllwd) {
                        if (!isAllwd) {
                            return helper.resReturn(helper.createError401(), res);
                        }
                        controller.deletePersonal(query,
                            function (data) {
                                res.status(200).json({
                                    result: true
                                })
                            },
                            function (err) {
                                res.status(400).json({
                                    result: false
                                })
                            })
                    });
            }
        });


    });

router.delete('/delete/:nodeId', helper.l2pAuth, helper.ensureAuthenticated,

    function (req, res) {
        if (!req.user) {
            res.status(401).send('Unauthorized');
            return;
        }
        var userId = mongoose.Types.ObjectId(req.user._id);
        var nodeId = mongoose.Types.ObjectId(req.params.nodeId);
        req.body.contentId = nodeId;
        req.body.userId = userId;
        var nod = new NodeController();

        nod.getNodeAsync()({
            _id: nodeId
        }).then(function (tn) {
            if (tn.courseId._id) {
                userHelper.isEnrolledAsync({userId: userId, courseId: tn.courseId._id})
                    .then(function (isAllwd) {
                        if (!isAllwd) {
                            return helper.resReturn(helper.createError401(), res);
                        }
                        controller.delete(req.query,
                            function (data) {
                                res.status(200).json({
                                    result: true
                                })
                            },
                            function (err) {
                                res.status(400).json({
                                    result: false
                                })
                            })
                    });
            }
        });


    });

router.post('/edit/:nodeId', helper.l2pAuth, helper.ensureAuthenticated,
    function (req, res) {
        if (!req.user) {
            res.status(401).send('Unauthorized');
            return;
        }
        var userId = mongoose.Types.ObjectId(req.user._id);
        var nodeId = mongoose.Types.ObjectId(req.params.nodeId);
        req.body.contentId = nodeId;
        req.body.userId = userId;
        var nod = new NodeController();

        nod.getNodeAsync()({
            _id: nodeId
        }).then(function (tn) {
            if (tn.courseId._id) {
                userHelper.isEnrolledAsync({userId: userId, courseId: tn.courseId._id})
                    .then(function (isAllwd) {
                        if (!isAllwd) {
                            return helper.resReturn(helper.createError401(), res);
                        }
                        controller.edit(req.body,
                            function (data) {
                                res.status(200).json({
                                    result: true
                                })
                            },
                            function (err) {
                                res.status(400).json({
                                    result: false
                                })
                            });

                    });
            }
        });


    });


router.post('/search/:nodeId', function (req, res) {
    controller.search(req.body.query,
        function (data) {
            res.status(200).send(data);
        }, function (data) {
            res.status(400).json({
                result: false
            })
        });
});

router.put('/comment', function (req, res) {


    controller.comment(function (err) {
            console.log(err);
            return;
        },
        {
            content: req.body.content,
            userId: req.body.userId,
            postId: req.body.postId,
            userName: req.body.userName
        },
        function (put) {
            res.status(200).json(
                {
                    result: true,
                    put: put
                }
            )
        });

});

router.get('/posts', helper.l2pAuth, helper.ensureAuthenticated,
    function (req, res) {

        var userId = mongoose.Types.ObjectId(req.user._id);
        var nodeId = mongoose.Types.ObjectId(req.query.nodeId);


        var nod = new NodeController();

        nod.getNodeAsync()({
                _id: nodeId
            })
            .then(function (tn) {
                if (tn.courseId._id) {
                    userHelper.isEnrolledAsync({userId: userId, courseId: tn.courseId._id})
                        .then(function (isAllwd) {
                            if (!isAllwd)
                                return helper.resReturn(helper.createError401(), res);
                            controller.getlinks(function (err) {
                                    console.log(err);
                                    return;
                                },
                                {
                                    contentId: nodeId,
                                    type: req.query.type,
                                    sortBy: req.query.sortBy
                                },
                                function (posts) {
                                    res.json(posts);
                                });
                        })
                        .catch(function (err) {
                            helper.resReturn(err, res);
                        });
                }
            })
            .catch(function (err) {
                helper.resReturn(err, res);
            });


    });

router.get('/personalPosts/:nodeId', helper.l2pAuth, helper.ensureAuthenticated,
    function (req, res) {

        var userId = mongoose.Types.ObjectId(req.user._id);
        var nodeId = mongoose.Types.ObjectId(req.params.nodeId);
        var nod = new NodeController();

        nod.getNodeAsync()({
                _id: nodeId
            })
            .then(function (tn) {
                if (tn.courseId._id) {
                    userHelper.isEnrolledAsync({userId: userId, courseId: tn.courseId._id})
                        .then(function (isAllwd) {
                            if (!isAllwd)
                                return helper.resReturn(helper.createError401(), res);
                                controller.getPersonallinks(function (err) {
                                    console.log(err);
                                    return;
                                },
                                {
                                    contentId: nodeId,
                                    userId: userId,
                                    type: req.query.type,
                                    sortBy: req.query.sortBy
                                },
                                function (posts) {
                                    console.log("inside router");
                                    console.log(posts);
                                    res.json(posts);
                                });
                        })
                        .catch(function (err) {
                            helper.resReturn(err, res);
                        });
                }
            })
            .catch(function (err) {
                helper.resReturn(err, res);
            });


    });



module.exports = router;


