const { globalRateLimiter } = require('../config/security');

module.exports = {
  rateLimiter: globalRateLimiter
};
