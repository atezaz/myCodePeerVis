var Client = require('./models/oauthClients.js');
var Token = require('./models/accessTokens.js');
var Secrets = require('./models/oauthSecrets.js');

var appRoot = require('app-root-path');
var helper = require(appRoot + '/libs/core/generalLibs.js');

var async = require('asyncawait/async');
var await = require('asyncawait/await');


function ApplicationOauth() {
}

ApplicationOauth.prototype.createApp = async(function (params) {
    var client = new Client(params);

    var ret = await(client.save());
    if (ret)
        return client;

    return false;
});

ApplicationOauth.prototype.editApp = async(function (where, params) {
    var ret = await(Client.findOneAndUpdate(where, params, {'new': true}).exec());
    if (ret)
        return ret;

    return false;
});

ApplicationOauth.prototype.deleteApp = async(function (where) {
    var ret = await(Client.findOneAndRemove(where).exec());
    if (ret)
        return ret;

    return false;
});

ApplicationOauth.prototype.getCreatedApps = async(function (params) {
    if (!helper.checkRequiredParams(params, ['userId'], function (err) {
            throw new Error(err);
        })) {
        return;
    }

    var apps = await(Client.find(params).exec());
    return apps;
});

ApplicationOauth.prototype.getInstalledApps = async(function (params) {
    if (!helper.checkRequiredParams(params, ['userId'], function (err) {
            throw new Error(err);
        })) {
        return;
    }

    var apps = await(
        Token.find(params)
            .select('-token -__v')
            .exec());

    var rets = [];

    for (var i in apps) {
        var a = apps[i].toObject();
        a.app = await(Client.findOne({
            clientId: a.clientId
        }));

        rets.push(a)
    }

    return rets;
});

/**
 * get app detail
 * @type {function(): Promise<TResult>}
 */
ApplicationOauth.prototype.getApp = async(function (params) {
    var app = await(Client.findOne(params).exec());

    return app;
});

module.exports = ApplicationOauth;