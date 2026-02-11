const crypto = require("crypto");
const config = require("../config");
const db = require("./database");

// Cache en RAM pour les performances (optionnel mais recommandé)
const cache = new Map();

function getBoard(boardId) {
  if (!cache.has(boardId)) {
    // Vérifier si le board existe en DB, sinon le créer
    if (!db.boardExists(boardId)) {
      // Vérifier les limites
      if (db.getBoardCount() >= config.maxBoardsTotal) {
        return null;
      }
      
      // Créer le board en DB
      db.createBoard(boardId);
    }
    
    // Charger les tâches depuis la DB
    const tasks = db.getAllTasks(boardId);
    const tasksMap = new Map();
    
    tasks.forEach(task => {
      tasksMap.set(task.id, task);
    });
    
    cache.set(boardId, { tasks: tasksMap });
  }
  
  return cache.get(boardId);
}

function snapshot(boardId) {
  const board = getBoard(boardId);
  if (!board) {
    return null;
  }
  
  return Array.from(board.tasks.values());
}

function createTask(
  boardId,
  { title, description = "", createdBy = "unknown" },
) {
  // Vérifier les limites
  if (db.getBoardCount() >= config.maxBoardsTotal) {
    return { error: "board_limit_reached" };
  }
  
  if (db.getTaskCount(boardId) >= config.maxTasksPerBoard) {
    return { error: "task_limit_reached" };
  }
  
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const task = {
    id,
    boardId,
    title,
    description,
    status: "todo",
    version: 0,
    updatedAt: now,
    createdAt: now,
    createdBy,
  };
  
  // Sauvegarder en DB
  db.insertTask(task);
  
  // Mettre à jour le cache
  const board = getBoard(boardId);
  board.tasks.set(id, task);
  
  return task;

}

function getTask(boardId, taskId) {
  const board = getBoard(boardId);
  if (!board) {
    return null;
  }
  
  return board.tasks.get(taskId) || null;
}

function applyPatch(task, patch) {
  const updates = {};
  
  if (typeof patch.title === "string" && patch.title.length > 0) {
    task.title = patch.title;
    updates.title = patch.title;
  }
  
  if (typeof patch.description === "string") {
    task.description = patch.description;
    updates.description = patch.description;
  }
  
  if (
    typeof patch.status === "string" &&
    ["todo", "doing", "done"].includes(patch.status)
  ) {
    task.status = patch.status;
    updates.status = patch.status;
  }
  
  task.version += 1;
  task.updatedAt = Date.now();
  
  updates.version = task.version;
  
  // Sauvegarder en DB
  db.updateTask(task.boardId, task.id, updates);
}

function getBoardCount() {
  return db.getBoardCount();
}

function getTaskCount(boardId) {
  return db.getTaskCount(boardId);
}

function deleteTask(boardId, taskId) {
  const result = db.deleteTask(boardId, taskId);
  
  if (result.error) {
    return result;
  }
  
  // Supprimer du cache
  const board = cache.get(boardId);
  if (board) {
    board.tasks.delete(taskId);
  }
  
  return result;
}

function getAllBoards() {
  return db.getAllBoards();
}

module.exports = {
  snapshot,
  createTask,
  getTask,
  applyPatch,
  getBoardCount,
  getTaskCount,
  deleteTask,
  getAllBoards,
};
