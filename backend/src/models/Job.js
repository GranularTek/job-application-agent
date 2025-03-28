const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: String,
    company: String,
    location: String,
    link: { type: String, unique: true },
    source: String,
    description: String,
    status: { type: String, enum: ['new', 'applied', 'saved', 'skipped'], default: 'new' },
    datePosted: { type: Date, default: Date.now },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    }      
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', JobSchema);
