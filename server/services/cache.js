const cache = new Map();

const setCache = (key, data, ttl = 300) => {
    cache.set(key, {
        data,
        expiry: Date.now() + ttl * 1000
    });
};

const getCache = (key) => {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
    }
    return item.data;
};

module.exports = { setCache, getCache };