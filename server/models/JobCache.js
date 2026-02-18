const mongoose = require('mongoose');

const JobCacheSchema = new mongoose.Schema({
    query: String,
    location: String,
    jobs: Array,
    expiresAt: Date
});

JobCacheSchema.index({ query: 1, location: 1 });
JobCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('JobCache', JobCacheSchema);
