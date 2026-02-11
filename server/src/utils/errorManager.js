const fs = require("fs");
const path = require("path");

const ErrorSeverity = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const ErrorCategory = {
  AUTHENTICATION: "authentication",
  VALIDATION: "validation",
  RATE_LIMIT: "rate_limit",
  PERMISSION: "permission",
  RESOURCE: "resource",
  WEBSOCKET: "websocket",
  SYSTEM: "system",
  USER_ACTION: "user_action",
};

const ErrorConfig = {
  AUTH_REQUIRED: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userVisible: true,
    userMessage: "Connexion requise",
    technicalMessage: "Authentication required before this action",
  },
  INVALID_TOKEN: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userVisible: true,
    userMessage: "Token de connexion invalide",
    technicalMessage: "Invalid authentication token",
  },
  INVALID_PSEUDO: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userVisible: true,
    userMessage: "Pseudo invalide ou trop long",
    technicalMessage: "Invalid pseudo format",
  },

  FORBIDDEN: {
    category: ErrorCategory.PERMISSION,
    severity: ErrorSeverity.HIGH,
    userVisible: true,
    userMessage: "Action non autorisée",
    technicalMessage: "User lacks permission for this action",
  },
  BOARD_ACCESS_DENIED: {
    category: ErrorCategory.PERMISSION,
    severity: ErrorSeverity.HIGH,
    userVisible: true,
    userMessage: "Accès au tableau refusé",
    technicalMessage: "Board access denied",
  },

  RATE_LIMIT_EXCEEDED: {
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    userVisible: true,
    userMessage: "Trop de messages. Veuillez ralentir",
    technicalMessage: "Rate limit exceeded",
  },
  MESSAGE_TOO_LARGE: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userVisible: true,
    userMessage: "Message trop volumineux",
    technicalMessage: "Message exceeds maximum size",
  },
  BOARD_LIMIT_REACHED: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.MEDIUM,
    userVisible: true,
    userMessage: "Limite de tableaux atteinte",
    technicalMessage: "Maximum number of boards reached",
  },
  TASK_LIMIT_REACHED: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.MEDIUM,
    userVisible: true,
    userMessage: "Limite de tâches atteinte pour ce tableau",
    technicalMessage: "Maximum number of tasks reached for board",
  },

  INVALID_JSON: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userVisible: true,
    userMessage: "Format de message incorrect",
    technicalMessage: "Invalid JSON format",
  },
  INVALID_SCHEMA: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userVisible: true,
    userMessage: "Structure de message invalide",
    technicalMessage: "Message schema validation failed",
  },
  TASK_NOT_FOUND: {
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.MEDIUM,
    userVisible: true,
    userMessage: "Tâche introuvable",
    technicalMessage: "Task not found",
  },

  INTERNAL_ERROR: {
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    userVisible: true,
    userMessage: "Erreur système temporaire",
    technicalMessage: "Internal server error",
  },
  WEBSOCKET_ERROR: {
    category: ErrorCategory.WEBSOCKET,
    severity: ErrorSeverity.HIGH,
    userVisible: true,
    userMessage: "Erreur de connexion",
    technicalMessage: "WebSocket connection error",
  },

  TASK_UPDATE_FAILED: {
    category: ErrorCategory.USER_ACTION,
    severity: ErrorSeverity.MEDIUM,
    userVisible: true,
    userMessage: "Échec de la mise à jour de la tâche",
    technicalMessage: "Task update operation failed",
  },
  TASK_CREATE_FAILED: {
    category: ErrorCategory.USER_ACTION,
    severity: ErrorSeverity.MEDIUM,
    userVisible: true,
    userMessage: "Impossible de créer la tâche",
    technicalMessage: "Task creation failed",
  },
};

class ErrorManager {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.logFile = path.join(__dirname, "../../logs/errors.log");
    this.webhooks = new Map();

    this.initializeLogDirectory();
  }

  initializeLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  registerWebSocket(ws, userId) {
    this.webhooks.set(ws, { userId, connectedAt: new Date() });
  }

  unregisterWebSocket(ws) {
    this.webhooks.delete(ws);
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  createError(errorType, context = {}) {
    const config = ErrorConfig[errorType];
    if (!config) {
      console.error(`Type d'erreur inconnu: ${errorType}`);
      return this.createError("INTERNAL_ERROR", { originalError: errorType });
    }

    const errorId = this.generateErrorId();
    const timestamp = this.formatTimestamp();

    return {
      id: errorId,
      type: errorType,
      category: config.category,
      severity: config.severity,
      userVisible: config.userVisible,
      userMessage: config.userMessage,
      technicalMessage: config.technicalMessage,
      context,
      timestamp,
      stack: new Error().stack,
    };
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logError(errorType, context = {}) {
    const error = this.createError(errorType, context);

    this.errorLog.push(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    this.writeToFile(error);

    this.logToConsole(error);

    if (error.userVisible && context.userId) {
      this.notifyUser(context.userId, error);
    }

    return error;
  }

  writeToFile(error) {
    try {
      const logEntry = {
        ...error,
        stack: undefined,
      };

      const logLine = JSON.stringify(logEntry) + "\n";
      fs.appendFileSync(this.logFile, logLine);
    } catch (writeError) {
      console.error("Erreur lors de l'écriture du log:", writeError);
    }
  }

  logToConsole(error) {
    const colors = {
      low: "\x1b[36m",
      medium: "\x1b[33m",
      high: "\x1b[35m",
      critical: "\x1b[31m",
    };

    const reset = "\x1b[0m";
    const color = colors[error.severity] || "";

    console.log(
      `${color}[${error.timestamp}] [${error.severity.toUpperCase()}] ${error.type}${reset}`,
    );
    console.log(`  Message utilisateur: ${error.userMessage}`);
    console.log(`  Message technique: ${error.technicalMessage}`);

    if (Object.keys(error.context).length > 0) {
      console.log(`  Contexte:`, error.context);
    }

    if (error.severity === ErrorSeverity.CRITICAL) {
      console.log(`  Stack: ${error.stack}`);
    }

    console.log("");
  }

  notifyUser(userId, error) {
    for (const [ws, info] of this.webhooks) {
      if (info.userId === userId && ws.readyState === 1) {
        try {
          ws.send(
            JSON.stringify({
              type: "system:error",
              data: {
                id: error.id,
                message: error.userMessage,
                severity: error.severity,
                category: error.category,
                timestamp: error.timestamp,
              },
            }),
          );
        } catch (sendError) {
          console.error(
            "Erreur lors de l'envoi de notification WebSocket:",
            sendError,
          );
          this.webhooks.delete(ws);
        }
      }
    }
  }

  broadcastError(error) {
    if (!error.userVisible) return;

    for (const [ws] of this.webhooks) {
      if (ws.readyState === 1) {
        try {
          ws.send(
            JSON.stringify({
              type: "system:error",
              data: {
                id: error.id,
                message: error.userMessage,
                severity: error.severity,
                category: error.category,
                timestamp: error.timestamp,
              },
            }),
          );
        } catch (sendError) {
          console.error("Erreur lors de la diffusion WebSocket:", sendError);
          this.webhooks.delete(ws);
        }
      }
    }
  }

  getStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentErrors = this.errorLog.filter(
      (err) => new Date(err.timestamp) > oneHourAgo,
    );

    const dailyErrors = this.errorLog.filter(
      (err) => new Date(err.timestamp) > oneDayAgo,
    );

    const categoryCounts = {};
    const severityCounts = {};

    dailyErrors.forEach((err) => {
      categoryCounts[err.category] = (categoryCounts[err.category] || 0) + 1;
      severityCounts[err.severity] = (severityCounts[err.severity] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      lastHour: recentErrors.length,
      lastDay: dailyErrors.length,
      byCategory: categoryCounts,
      bySeverity: severityCounts,
      connectedUsers: this.webhooks.size,
    };
  }

  cleanOldLogs() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.errorLog = this.errorLog.filter(
      (err) => new Date(err.timestamp) > sevenDaysAgo,
    );
  }
}

const errorManager = new ErrorManager();

const logger = {
  error: (event, context = {}) => {
    return errorManager.logError("INTERNAL_ERROR", { event, ...context });
  },

  warning: (event, context = {}) => {
    console.warn(`[WARN] ${event}`, context);
  },

  info: (event, context = {}) => {
    console.log(`[INFO] ${event}`, context);
  },

  security: (event, context = {}) => {
    return errorManager.logError("FORBIDDEN", { event, ...context });
  },
};

module.exports = {
  ErrorManager,
  ErrorSeverity,
  ErrorCategory,
  ErrorConfig,
  errorManager,
  logger,
};
