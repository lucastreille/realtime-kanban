const Database = require('better-sqlite3');
const path = require('path');

// Créer/ouvrir la base de données
const db = new Database(path.join(__dirname, '../../kanban.db'));

// Créer les tables si elles n'existent pas
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    boardId TEXT PRIMARY KEY,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    boardId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'todo',
    version INTEGER DEFAULT 0,
    createdBy TEXT DEFAULT 'unknown',
    updatedAt INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (boardId) REFERENCES boards(boardId)
  );

  CREATE INDEX IF NOT EXISTS idx_boardId ON tasks(boardId);
`);

console.log('✅ Base de données initialisée');

// Fonctions pour manipuler les boards

function createBoard(boardId) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO boards (boardId, createdAt, updatedAt)
    VALUES (?, ?, ?)
  `);
  
  const now = Date.now();
  stmt.run(boardId, now, now);
  
  return { boardId, createdAt: now, updatedAt: now };
}

function getAllBoards() {
  const stmt = db.prepare('SELECT * FROM boards');
  return stmt.all();
}

function boardExists(boardId) {
  const stmt = db.prepare('SELECT boardId FROM boards WHERE boardId = ?');
  return stmt.get(boardId) !== undefined;
}

// Fonctions pour manipuler les tâches

function getAllTasks(boardId) {
  const stmt = db.prepare('SELECT * FROM tasks WHERE boardId = ?');
  return stmt.all(boardId);
}

function getTask(boardId, taskId) {
  const stmt = db.prepare('SELECT * FROM tasks WHERE boardId = ? AND id = ?');
  return stmt.get(boardId, taskId) || null;
}

function insertTask(task) {
  const stmt = db.prepare(`
    INSERT INTO tasks (id, boardId, title, description, status, version, createdBy, updatedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    task.id,
    task.boardId,
    task.title,
    task.description || '',
    task.status || 'todo',
    task.version || 0,
    task.createdBy || 'unknown',
    task.updatedAt,
    task.createdAt || task.updatedAt
  );
  
  return task;
}

function updateTask(boardId, taskId, updates) {
  const fields = [];
  const values = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  
  if (updates.version !== undefined) {
    fields.push('version = ?');
    values.push(updates.version);
  }
  
  fields.push('updatedAt = ?');
  values.push(Date.now());
  
  values.push(boardId, taskId);
  
  const stmt = db.prepare(`
    UPDATE tasks 
    SET ${fields.join(', ')}
    WHERE boardId = ? AND id = ?
  `);
  
  stmt.run(...values);
  
  return getTask(boardId, taskId);
}

function deleteTask(boardId, taskId) {
  const task = getTask(boardId, taskId);
  
  if (!task) {
    return { error: 'task_not_found' };
  }
  
  const stmt = db.prepare('DELETE FROM tasks WHERE boardId = ? AND id = ?');
  stmt.run(boardId, taskId);
  
  return { success: true, task };
}

function getTaskCount(boardId) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE boardId = ?');
  const result = stmt.get(boardId);
  return result.count;
}

function getBoardCount() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM boards');
  const result = stmt.get();
  return result.count;
}

module.exports = {
  createBoard,
  getAllBoards,
  boardExists,
  getAllTasks,
  getTask,
  insertTask,
  updateTask,
  deleteTask,
  getTaskCount,
  getBoardCount,
  db
};