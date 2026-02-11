const { errorManager } = require("../utils/errorManager");

const WS_OPEN = 1;

const ErrorTypes = {
  MESSAGE_TOO_LARGE: "MESSAGE_TOO_LARGE",
  INVALID_JSON: "INVALID_JSON",
  INVALID_SCHEMA: "INVALID_SCHEMA",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  INVALID_PSEUDO: "INVALID_PSEUDO",
  FORBIDDEN: "FORBIDDEN",
  BOARD_ACCESS_DENIED: "BOARD_ACCESS_DENIED",
  NOT_FOUND: "NOT_FOUND",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  BOARD_LIMIT_REACHED: "BOARD_LIMIT_REACHED",
  TASK_LIMIT_REACHED: "TASK_LIMIT_REACHED",
  VERSION_CONFLICT: "VERSION_CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  WEBSOCKET_ERROR: "WEBSOCKET_ERROR",
  TASK_UPDATE_FAILED: "TASK_UPDATE_FAILED",
  TASK_CREATE_FAILED: "TASK_CREATE_FAILED",
};

function createError(errorType, details = {}, userId = null) {
  const error = errorManager.logError(errorType, { ...details, userId });

  return {
    type: "error",
    data: {
      id: error.id,
      code: errorType,
      message: error.userMessage,
      timestamp: error.timestamp,
      severity: error.severity,
      ...details,
    },
  };
}

function sendError(ws, errorType, details = {}, userId = null) {
  if (ws.readyState === WS_OPEN) {
    try {
      const errorResponse = createError(errorType, details, userId);
      ws.send(JSON.stringify(errorResponse));

      if (userId) {
        errorManager.registerWebSocket(ws, userId);
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi d'erreur WebSocket:", err);
      errorManager.logError("WEBSOCKET_ERROR", {
        originalError: errorType,
        sendError: err.message,
        userId,
      });
    }
  }
}

module.exports = {
  ErrorTypes,
  createError,
  sendError,
};
