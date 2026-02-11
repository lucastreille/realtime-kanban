const crypto = require("crypto");
const config = require("../config");

// boards: Map<boardId, { tasks: Map<taskId, task> }>
const boards = new Map();

function getBoard(boardId) {
  if (!boards.has(boardId)) {
    if (boards.size >= config.maxBoardsTotal) {
      return null;
    }

    boards.set(boardId, { tasks: new Map() });
  }

  return boards.get(boardId);
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
  const board = getBoard(boardId);

  if (!board) {
    return { error: "board_limit_reached" };
  }

  if (board.tasks.size >= config.maxTasksPerBoard) {
    return { error: "task_limit_reached" };
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const task = {
    id,
    title,
    description,
    status: "todo",
    version: 0,
    updatedAt: now,
    createdBy,
  };

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
  if (typeof patch.title === "string" && patch.title.length > 0) {
    task.title = patch.title;
  }

  if (typeof patch.description === "string") {
    task.description = patch.description;
  }

  if (
    typeof patch.status === "string" &&
    ["todo", "doing", "done"].includes(patch.status)
  ) {
    task.status = patch.status;
  }

  task.version += 1;
  task.updatedAt = Date.now();
}

function getBoardCount() {
  return boards.size;
}

function getTaskCount(boardId) {
  const board = boards.get(boardId);
  return board ? board.tasks.size : 0;
}

function deleteTask(boardId, taskId) {
  const board = boards.get(boardId);
  if (!board) {
    return { error: "board_not_found" };
  }

  const task = board.tasks.get(taskId);
  if (!task) {
    return { error: "task_not_found" };
  }

  board.tasks.delete(taskId);
  return { success: true, task };
}

module.exports = {
  snapshot,
  createTask,
  getTask,
  applyPatch,
  getBoardCount,
  getTaskCount,
  deleteTask,
};
