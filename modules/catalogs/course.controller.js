var config = require('config');
var Category = require('./categories.js');
var Course = require('./courses.js');
var Tag = require('./courseTags.js');
var UserCourses = require('./userCourses.js');
var Users = require('../accounts/users.js');
var mongoose = require('mongoose');
var debug = require('debug')('cm:db');
var TagController = require('./tag.controller.js');
var appRoot = require('app-root-path');
var handleUpload = require(appRoot + '/libs/core/handleUpload.js');
var helper = require(appRoot + '/libs/core/generalLibs.js');

function catalog() {
}

catalog.prototype.getCourse = function (error, params, success) {
    Course.findOne(params)
        .populate('category courseTags')
        .populate('createdBy', '_id username displayName')
        .populate('managers', '_id username')

        .exec(function (err, doc) {
            if (err) {
                error(err);
            } else {
                if (doc)
                    success(doc);
                else
                    error(helper.createError404('Course'));
            }
        });
};

/**
 * to add a manager, we are allowing user to find another user.
 * this method will do the check whether the username exist or not.
 *
 * checkUsername, parameter:
 * courseId, we will only course owner to do the check
 * @params: {userId, courseId}
 */
catalog.prototype.checkUsername = function(error, params, success){
    Course.findOne({
        _id: params.courseId,
        createdBy: params.userId
    }, function(err, doc){
        if(err){
            error(err);
        } else if(doc){
            // this is an owner of a course,
            Users.findOne({
                username: params.username
            }, function(err, usr){
                if(err){
                    error(err);
                } else if(usr){
                    if(usr.id == params.userId.toString()) {
                        error(helper.createError('You are the owner of this course', 404));
                    }
                    else
                        success(
                            {
                                _id: usr._id,
                                username: usr.username
                            }
                        );
                } else {
                    error(helper.createError404('User'));
                }
            })
        }
        else {
            error(helper.createError('Not an owner', 401));
        }
    });
};

/**
 *
 * @param err
 * @param userParam
 * @param courseParam
 * @param done
 * @param isEnrolled, if false, means that the user has left t
 */
catalog.prototype.enroll = function (error, userParam, courseParam, done, isEnrolled) {
    if (
        !helper.checkRequiredParams(userParam, ['id'], error) &&
        !helper.checkRequiredParams(courseParam, ['id'], error)
    ) {
        return;
    }

    var userId = userParam.id;
    var courseId = courseParam.id;

    UserCourses.findOneAndUpdate({
            user: userId,
            course: courseId
        },
        {
            user: userId,
            course: courseId,
            isEnrolled: isEnrolled
        },
        {upsert: true}
    ).exec(function (err, doc) {
            if (err) {
                // perhaps this user is already enrolled
                error(err)
            } else {
                done(doc);
            }
        });
};

/**
 *
 * @param err
 * @param userParam
 * @param courseParam
 * @param done
 */
catalog.prototype.leave = function (error, userParam, courseParam, done) {
    this.enroll(error, userParam, courseParam, done, false);
};

catalog.prototype.addCourse = function (error, params, success) {
    var self = this;

    if (!helper.checkRequiredParams(params, ['category', 'name', 'userId'], error)) {
        return;
    }

    var course = new Course({
        name: params.name,
        createdBy: mongoose.Types.ObjectId(params.userId),
        category: mongoose.Types.ObjectId(params.category),
        description: params.description
    });

    course.setSlug(params.name);

    course.save(function (err, res) {
        if (err) {
            debug('failed saving new course');
            error(err);
        }
        else {
            // success saved the course
            // find the newly saved course, and call the success Callback
            self.getCourse(
                error,

                {_id: course._id},
                function (crs) {
                    // they giving us the tags in array of slug string.
                    if (params.tagSlugs) {
                        // insert all the tags, if it failed, means it is already there

                        var tc = new TagController();
                        // get all the tags, we need the _ids
                        for (var i in params.tagSlugs) {
                            var tagParam = {
                                name: params.tagSlugs[i],
                                course: crs._id,
                                category: params.category
                            };

                            tc.addCourseTag(function (err) {
                                    if (err) debug(err);
                                },
                                tagParam,
                                function () {
                                });
                        }
                    }

                    success(crs);
                }
            );
        }
    });
};

catalog.prototype.saveResourceFile = function (error, file, newName, success) {
    var filetypePicture = ['jpg', 'png', 'jpeg'];
    var filetypeVideo = ['mp4', 'webm'];

    var extension = file.name.split('.');
    extension = extension[extension.length - 1].toLowerCase();

    if (filetypePicture.indexOf(extension) < 0 &&
        filetypeVideo.indexOf(extension) < 0
    ) {
        // extension not right
        error(new Error("File extension not right"));
    }
    else {

        var fn = '/img/courses/' + newName + '.' + extension;
        var dest = appRoot + '/public' + fn;
        try {
            handleUpload(file, dest, true);

        } catch (ex) {
            error(new Error("Failed uploading"));
            return;
        }

        var ft = "";
        if (filetypePicture.indexOf(extension) >= 0) {
            ft = 'picture';
        } else if (filetypeVideo.indexOf(extension) >= 0) {
            ft = 'video';
        }

        if (success) {
            success(fn, ft);
        }
    }
};

catalog.prototype.editCourse = function (error, params, files, success) {
    var self = this;

    if (!helper.checkRequiredParams(params, ['courseId', 'name', 'userId'], error)) {
        return;
    }

    self.getCourse(error,
        {
            _id: params.courseId,
            createdBy: params.userId
        },
        function (course) {
            course.name = params.name;
            course.description = params.description;
            course.courseTags = [];

            // save the update
            course.save();

            if (files) {
                if (files.file && files.file.constructor != Array) {
                    var be = [files.file];
                    files.file = be;
                }

                for (var i in files.file) {
                    var f = files.file[i];
                    self.saveResourceFile(
                        error,
                        f,
                        course.id,
                        function (fn, ft) {
                            if (ft == 'picture') {
                                course.picture = fn;
                                course.save();
                            } else if (ft == 'video') {
                                course.video = fn;
                                course.save();
                            }
                        }
                    );
                }
            }

            // they giving us the tags in array of slug string.
            if (params.tagSlugs) {
                // insert all the tags, if it failed, means it is already there
                var tc = new TagController();
                // get all the tags, we need the _ids
                for (var i in params.tagSlugs) {
                    var tagParam = {
                        name: params.tagSlugs[i],
                        course: course._id,
                        category: course.category._id
                    };

                    tc.addCourseTag(function (err) {
                            if (err) debug(err);
                        },
                        tagParam,
                        // we dont need to do anything after, so pass it an empty func
                        function () {
                        });
                }
            }

            success(course);
        }
    );
};

catalog.prototype.addManager = function (error, params, success) {
    var self = this;

    if (!helper.checkRequiredParams(params, ['courseId', 'createdBy'], error)) {
        return;
    }

    var courseFnParams = {
        _id: params.courseId,
        createdBy: params.createdBy
    };

    self.getCourse(
        error,
        courseFnParams,

        function (course) {
            if(params.managers.length == 0){
                course.update({
                    $set: {
                        managers: []
                    }
                }, function(err, res){
                    success(res);
                });
            } else {
                // find usernames and add one by one
                for (var i in params.managers) {
                    // dont insert our own uid
                    if(params.managers[i] != params.createdBy.toString()){
                        params.managers[i] = mongoose.Types.ObjectId(params.managers[i]);
                    }
                }

                course.update({
                    $set: {
                        managers: params.managers
                    }
                }, function (err, res) {
                    success(res);
                });

            }
        }
    );
};

catalog.prototype.getCourses = function (error, params, success) {
    Course.find(params, function (err, docs) {
        if (!err) {
            success(docs);
        } else {
            error(err);
        }
    });
};

catalog.prototype.getUserCourses = function (error, params, done) {
    if (!helper.checkRequiredParams(params, ['user'], error)) {
        return;
    }

    UserCourses.find(params).populate('course').exec(function (err, res) {
        if (err) error(err);
        else
            done(res);
    });
};

module.exports = catalog;