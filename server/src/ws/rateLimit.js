const config = require("../config");

const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = 60000;
const RATE_LIMIT_ERROR_COOLDOWN = 60000;

const rateLimitStats = new WeakMap();

function shouldSendError(stats, now) {
  if (now - stats.lastRateLimitError > RATE_LIMIT_ERROR_COOLDOWN) {
    stats.lastRateLimitError = now;
    return true;
  }
  return false;
}

function initRateLimit(ws) {
  rateLimitStats.set(ws, {
    messagesThisSecond: [],
    messagesThisMinute: [],
    lastRateLimitError: 0,
  });
}

function checkRateLimit(ws) {
  const stats = rateLimitStats.get(ws);

  if (!stats) {
    initRateLimit(ws);
    return { allowed: true, shouldNotify: false };
  }

  const now = Date.now();

  stats.messagesThisMinute = stats.messagesThisMinute.filter(
    (timestamp) => now - timestamp < ONE_MINUTE_MS,
  );

  stats.messagesThisSecond = stats.messagesThisSecond.filter(
    (timestamp) => now - timestamp < ONE_SECOND_MS,
  );

  if (
    stats.messagesThisSecond.length >= config.rateLimit.maxMessagesPerSecond
  ) {
    console.log(
      `Rate limit SECONDE dépassée: ${stats.messagesThisSecond.length}/${config.rateLimit.maxMessagesPerSecond} messages/seconde`,
    );
    return {
      allowed: false,
      reason: "second",
      shouldNotify: shouldSendError(stats, now),
    };
  }

  if (
    stats.messagesThisMinute.length >= config.rateLimit.maxMessagesPerMinute
  ) {
    console.log(
      `Rate limit MINUTE dépassée: ${stats.messagesThisMinute.length}/${config.rateLimit.maxMessagesPerMinute} messages/minute`,
    );
    return {
      allowed: false,
      reason: "minute",
      shouldNotify: shouldSendError(stats, now),
    };
  }

  if (
    stats.messagesThisMinute.length % 5 === 0 &&
    stats.messagesThisMinute.length > 0
  ) {
    console.log(
      `Rate limit: ${stats.messagesThisMinute.length}/${config.rateLimit.maxMessagesPerMinute} messages/minute, ${stats.messagesThisSecond.length}/${config.rateLimit.maxMessagesPerSecond} messages/seconde`,
    );
  }

  stats.messagesThisSecond.push(now);
  stats.messagesThisMinute.push(now);

  return { allowed: true, shouldNotify: false };
}

function resetRateLimit(ws) {
  rateLimitStats.delete(ws);
  initRateLimit(ws);
}

function cleanupRateLimit(ws) {
  rateLimitStats.delete(ws);
}

module.exports = {
  initRateLimit,
  checkRateLimit,
  resetRateLimit,
  cleanupRateLimit,
};
