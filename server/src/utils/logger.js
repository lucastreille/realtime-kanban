const LOG_LEVELS = {
  INFO: "INFO",
  WARNING: "WARNING",
  SECURITY: "SECURITY",
  ERROR: "ERROR",
};

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, event, details = {}) {
  const timestamp = formatTimestamp();
  const detailsStr =
    Object.keys(details).length > 0 ? JSON.stringify(details) : "";

  console.log(`[${timestamp}] [${level}] ${event} ${detailsStr}`);
}

function security(event, details = {}) {
  log(LOG_LEVELS.SECURITY, event, details);
}

function info(event, details = {}) {
  log(LOG_LEVELS.INFO, event, details);
}

function warning(event, details = {}) {
  log(LOG_LEVELS.WARNING, event, details);
}

function error(event, details = {}) {
  log(LOG_LEVELS.ERROR, event, details);
}

module.exports = {
  LOG_LEVELS,
  log,
  security,
  info,
  warning,
  error,
};
