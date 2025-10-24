
const NodeCache = require('node-cache');

// Create cache instance with 10 minute default TTL
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Cache middleware
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl || req.url}_${req.user?.id || 'anonymous'}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      console.log(`Cache hit for: ${key}`);
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(body) {
      if (res.statusCode === 200) {
        cache.set(key, body, duration);
        console.log(`Cached response for: ${key}`);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

// Clear cache for specific patterns
const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
  console.log(`Cleared ${matchingKeys.length} cache entries for pattern: ${pattern}`);
};

// Clear user-specific cache
const clearUserCache = (userId) => {
  clearCache(`_${userId}`);
};

module.exports = {
  cache,
  cacheMiddleware,
  clearCache,
  clearUserCache
};
