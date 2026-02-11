const config = require("../config");

function sanitizePseudo(pseudo) {
  if (typeof pseudo !== "string") {
    return "";
  }

  return pseudo.trim();
}

function isValidPseudo(pseudo) {
  if (typeof pseudo !== "string") {
    return false;
  }

  const cleaned = sanitizePseudo(pseudo);

  if (cleaned.length < config.auth.minPseudoLength) {
    return false;
  }
  if (cleaned.length > config.auth.maxPseudoLength) {
    return false;
  }

  if (!config.auth.pseudoPattern.test(cleaned)) {
    return false;
  }

  return true;
}

function canAccessBoard(socketState, boardId) {
  if (!socketState.pseudo) {
    return false;
  }

  if (socketState.role === "admin") {
    return true;
  }

  return true;
}

function canCreateTask(socketState, boardId) {
  return canAccessBoard(socketState, boardId);
}

function canUpdateTask(socketState, boardId) {
  return canAccessBoard(socketState, boardId);
}

function canDeleteTask(socketState, task) {
  if (!socketState.pseudo) {
    return false;
  }

  if (socketState.role === "admin") {
    return true;
  }

  return task.createdBy === socketState.pseudo;
}

module.exports = {
  isValidToken,
  getRoleFromToken,
  isValidPseudo,
  sanitizePseudo,
  canAccessBoard,
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
};
