var mongoose = require('mongoose');

var widgetPlacementsSchema = new mongoose.Schema({
    widgetId: {type:mongoose.Schema.Types.ObjectId, ref: "widgets"},

    application: {type: String, required: true},
    widget: {type: String, required: true},

    location: {type: String, required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "users"},
    courseId: {type: mongoose.Schema.Types.ObjectId, ref: "courses"},
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: "categories"},

    position: {type: mongoose.Schema.Types.Mixed},
    isInstalled: {type: Boolean, default:true},

    width: {type: Number},
    height: {type: Number},

    dateAdded: {type: Date},
    dateUpdated: {type: Date}
});

widgetPlacementsSchema.pre('save', function (next) {
    var now = new Date();
    this.dateUpdated = now;
    if (!this.dateAdded) {
        this.dateAdded = now;
    }
    next();
});

widgetPlacementsSchema.pre('update', function (next) {
    this.dateUpdated = new Date();
    next();
});

var Widget = mongoose.model('widgetPlacements', widgetPlacementsSchema);

module.exports = Widget;

