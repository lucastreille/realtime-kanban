const Database = require('better-sqlite3');
const path = require('path');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { eq, and, count, sql } = require('drizzle-orm');
const schema = require('./schema');
const { boards, tasks } = schema;

// Créer/ouvrir la base de données
const sqlite = new Database(path.join(__dirname, '../../kanban.db'));
const db = drizzle(sqlite, { schema });

// Créer les tables si elles n'existent pas (Gardé pour compatibilité immédiate sans migration)
sqlite.exec(`
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

console.log('✅ Base de données initialisée (avec Drizzle)');

// Fonctions pour manipuler les boards

function createBoard(boardId) {
  const now = Date.now();

  // Utiliser Drizzle avec insert().onConflictDoNothing() pour simuler INSERT OR IGNORE
  db.insert(boards)
    .values({
      boardId,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoNothing()
    .run();

  return { boardId, createdAt: now, updatedAt: now };
}

function getAllBoards() {
  return db.select().from(boards).all();
}

function boardExists(boardId) {
  const result = db.select({ boardId: boards.boardId })
    .from(boards)
    .where(eq(boards.boardId, boardId))
    .get();

  return result !== undefined;
}

// Fonctions pour manipuler les tâches

function getAllTasks(boardId) {
  return db.select()
    .from(tasks)
    .where(eq(tasks.boardId, boardId))
    .all();
}

function getTask(boardId, taskId) {
  const result = db.select()
    .from(tasks)
    .where(
      and(
        eq(tasks.boardId, boardId),
        eq(tasks.id, taskId)
      )
    )
    .get();

  return result || null;
}

function insertTask(task) {
  db.insert(tasks).values({
    id: task.id,
    boardId: task.boardId,
    title: task.title,
    description: task.description || '',
    status: task.status || 'todo',
    version: task.version || 0,
    createdBy: task.createdBy || 'unknown',
    updatedAt: task.updatedAt,
    createdAt: task.createdAt || task.updatedAt
  }).run();

  return task;
}

function updateTask(boardId, taskId, updates) {
  const updateData = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.version !== undefined) updateData.version = updates.version;

  updateData.updatedAt = Date.now();

  db.update(tasks)
    .set(updateData)
    .where(
      and(
        eq(tasks.boardId, boardId),
        eq(tasks.id, taskId)
      )
    )
    .run();

  return getTask(boardId, taskId);
}

function deleteTask(boardId, taskId) {
  const task = getTask(boardId, taskId);

  if (!task) {
    return { error: 'task_not_found' };
  }

  db.delete(tasks)
    .where(
      and(
        eq(tasks.boardId, boardId),
        eq(tasks.id, taskId)
      )
    )
    .run();

  return { success: true, task };
}

function getTaskCount(boardId) {
  const result = db.select({ count: count() })
    .from(tasks)
    .where(eq(tasks.boardId, boardId))
    .get();

  return result.count;
}

function getBoardCount() {
  const result = db.select({ count: count() })
    .from(boards)
    .get();

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
  db: sqlite // Exporter l'instance raw sqlite pour compatibilité si nécessaire
};