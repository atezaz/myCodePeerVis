var config = require('config');
var Solution = require('./models/solutions.js');
var PeerReview = require('./models/peerReview.js');
var appRoot = require('app-root-path');
var peerAssessment = require(appRoot + '/modules/peerAssessment/peerAssessment.controller.js');
var users = require('../accounts/users.js');
var mongoose = require('mongoose');
var debug = require('debug')('pa:db');
var appRoot = require('app-root-path');
var handleUpload = require(appRoot + '/libs/core/handleUpload.js');
var helper = require(appRoot + '/libs/core/generalLibs.js');
var userHelper = require(appRoot + '/modules/accounts/user.helper.js');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var _ = require('lodash');
var fs = require('fs-extra');

function solutions() {

}

solutions.prototype.getSolutions = function (error, params , success) {
    var solutions = [];
    Solution.find(params).sort({dateAdded: 1}).exec(function(err, docs) {
        if(!err) {
            _.each(docs, function(doc) {
                var solution = {};
                solution._id = doc._id;
                solution.studentName = doc.studentName;
                solution.title = doc.title;
                PeerReview.findOne({_id: doc.peerReviewId}).exec(function(err, doc) {
                    if(doc) {
                        solution.peerReviewTitle = doc.title;
                    }
                    solutions.push(solution);
                    if(docs.length == solutions.length) {
                        success(solutions);
                    }
                })
                //solutions.push(solution);
            })
        } else {
            error(err);
        }
    })
}

solutions.prototype.addSolution = function(error, params, success) {
    if (!helper.checkRequiredParams(params, ['courseId', 'reviewId', 'userId'], error)) {
        return;
    }

    PeerReview.findOne({_id: params.reviewId}).exec(function(err, peerReview) {
        if(err) {
            error(err);
            return;
        }
        if(!peerReview) {
            var err = new Error('No such Peer review exists');
            error(err);
            return;

        }
        Solution.findOne({
            courseId: mongoose.Types.ObjectId(params.courseId),
            peerReviewId: mongoose.Types.ObjectId(params.reviewId),
            createdBy: mongoose.Types.ObjectId(params.userId),
        }).exec(function(err,doc) {
            if(err) {
                error(err)
            }
            if(doc) {
                console.log('Found Solution: ', doc);
                success(doc, peerReview.title);
            } else {
                // its a new solution
                Solution.find({
                    courseId: mongoose.Types.ObjectId(params.courseId),
                }).limit(1).sort({_id: -1}).exec(function(err, doc) {
                    if(err) {
                        console.log('Error', err);
                        error(err);
                        return;
                    }
                    var title = 'S01';
                    if(doc.length>0) {
                        console.log('Doc', doc);
                        title = doc[0].title;
                        var tempArr = title.split('S')
                        var temp = parseInt(tempArr[1]);
                        temp = temp + 1;
                        title = temp.toString();
                        if(temp < 10) {
                            title = 'S0' + temp.toString();
                        } else  {
                            title = 'S' + temp.toString();
                        }
                    }

                    var solution = new Solution({
                        title: title,
                        createdBy: mongoose.Types.ObjectId(params.userId),
                        courseId: mongoose.Types.ObjectId(params.courseId),
                        //peerReviewTitle: peerReview.title,
                        peerReviewId: mongoose.Types.ObjectId(params.reviewId),
                        isSubmitted: false,
                        studentName: params.username
                    });

                    solution.save(function (err, doc) {
                        if (err) {
                            console.log('err', err);
                            error(err);
                        }
                        else {
                            console.log('Solution', doc);
                            // adding peer review title
                            // doc.peerReviewTitle = peerReview.title;
                            success(doc, peerReview.title);
                        }
                    });
                })
            }
        })
    });
}

solutions.prototype.editSolution = function(error, params, files, success) {
    var self = this;

    if (!helper.checkRequiredParams(params, ['courseId', 'reviewId', 'userId', 'sId'], error)) {
        return;
    }

    self.getSolution(error,
        { _id: params.sId },
        function(solution) {
            solution.studentComments = params.studentComments;
            solution.solutionDocuments = params.solutionDocuments || [];
            solution.isSubmitted = true;
            if(files && files.file) {
                var selSolutionDocuments = null;
                if(files.file[0] && files.file[0].selSolutionDocuments) {
                    selSolutionDocuments = files.file[0].selSolutionDocuments
                }
                if(selSolutionDocuments && selSolutionDocuments.constructor == Array) {
                    for (var i in selSolutionDocuments) {
                        var f = selSolutionDocuments[i];
                        self.saveResourceFile(error,
                            f,
                            'solutionDocument',
                            solution,
                            function (fn) {
                                var duplicate = false;
                                _.each(solution.solutionDocuments, function (doc) {
                                    if (fn == doc) {
                                        duplicate = true;
                                    }
                                })
                                if (!duplicate) {
                                    solution.solutionDocuments.push(fn);
                                }
                            })
                    }
                }
            }

            // Files deletion should be performed here
            console.log('Deleting files', params.deletedUploadedFiles);
            _.each(params.deletedUploadedFiles, function(filePath) {
                fs.unlink(appRoot + '/public/' + filePath, function(err) {
                    if(err) {
                        debug(err);
                    }
                    debug("File deleted successfully");
                    console.log('File successfully deleted');
                });
            })

            console.log('Solution', solution);
            solution.save(function (err, doc) {
                if (err) {
                    console.log('failed updating solution');
                    error(err);
                }
                else {
                    console.log('solution updated successfully');
                    success();
                }
            });
        })
}

/* Get a plain javascript object and not a model instance. What ever you change here should be reflected in
   the other method as well which return model instance.
*/
solutions.prototype.getSolutionWithLean = function (error, params, success) {
    Solution.findOne(params)
        .lean().exec(function (err, doc) {
        if (err) {
            error(err);
        } else {
            if (doc) {
                PeerReview.findOne({_id: doc.peerReviewId}).exec(function(err, reviewDoc) {
                    if(err) {
                        error(helper.createError404('Solution'));
                    }
                    if(reviewDoc) {
                        doc.peerReviewTitle = reviewDoc.title;
                    }
                    success(doc);
                })
            }
            else
                error(helper.createError404('Solution'));
        }
    });
};

/*
    Duplicate method for return model instance.
 */
solutions.prototype.getSolution = function (error, params, success) {
    Solution.findOne(params)
        .exec(function (err, doc) {
            if (err) {
                error(err);
            } else {
                if (doc) {
                    success(doc);
                }
                else
                    error(helper.createError404('Solution'));
            }
        });
};

solutions.prototype.deleteSolution = function(error, params, success) {
    userHelper.isAuthorized(error,
        {
            userId: params.userId,
            courseId: params.courseId
        },

        function (isAllowed) {
            if (isAllowed) {
                Solution.findOne(
                    {_id: mongoose.Types.ObjectId(params.sId)}
                ).exec(function(err, doc) {
                    if(!err) {
                        _.each(doc.solutionDocuments, function(docPath) {
                            fs.unlink(appRoot + '/public/' + docPath, function(err) {
                                if(err) {
                                    debug(err);
                                }
                                debug("File deleted successfully");
                            });
                        })


                        Solution.remove(
                            {_id: mongoose.Types.ObjectId(params.sId)}
                        ).exec(function(err, res){
                            if(!err) {
                                success();
                            } else {
                                error(err);
                            }
                        })
                    } else {
                        error(err);
                    }
                })
            } else {
                error(helper.createError401());
            }
        });
}

solutions.prototype.saveResourceFile = function (error, file, type, helper, success) {
    var fileType = ['pdf'];

    var extension = file.name.split('.');
    extension = extension[extension.length - 1].toLowerCase();

    if (fileType.indexOf(extension) < 0) {
        // extension not right
        error(new Error("File extension not right"));
    } else {
        var fn = '/pa/'+ helper.courseId +'/'+ helper.peerReviewId+'/'+ type +'/'+ helper._id+'/' + file.name;
        var dest = appRoot + '/public/'+ fn;
        try {
            handleUpload(file, dest, true);

        } catch (ex) {
            error(new Error("Failed uploading"));
            return;
        }

        if (success) {
            success(fn);
        }
    }
}

module.exports = solutions;