const mongoose = require('mongoose');

const AppliedJobSchema = new mongoose.Schema({
    title: String,
    company: String,
    location: String,
    link: String,
    source: String,
    description: String,
    appliedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AppliedJob', AppliedJobSchema);
