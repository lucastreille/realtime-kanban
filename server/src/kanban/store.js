const crypto = require("crypto");

// boards: Map<boardId, { tasks: Map<taskId, task> }>
const boards = new Map();

function getBoard(boardId) {

    if (!boards.has(boardId)) 
    {
        boards.set(boardId, { tasks: new Map() });
    }

    return boards.get(boardId);

}

function snapshot(boardId) {

    const b = getBoard(boardId);
    return Array.from(b.tasks.values());

}

function createTask(boardId, { title, description = "" }) {

    const b = getBoard(boardId);
    const id = crypto.randomUUID();
    const now = Date.now();

    const task = { 
        id, 
        title, 
        description, 
        status: "todo", 
        version: 0, 
        updatedAt: now 
    };

    b.tasks.set(id, task);

    return task;

}

function getTask(boardId, taskId) {

    const b = getBoard(boardId);
    return b.tasks.get(taskId) || null;

}


function applyPatch(task, patch) {

    if (typeof patch.title === "string") 
    {
        task.title = patch.title;
    }

    if (typeof patch.description === "string") 
    {
        task.description = patch.description;
    }

    if (typeof patch.status === "string") 
    {
        task.status = patch.status;
    }

    task.version += 1;
    task.updatedAt = Date.now();

}

module.exports = { snapshot, createTask, getTask, applyPatch };
