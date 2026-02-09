const WebSocket = require("ws");
const { parse } = require("./protocol");
const {
  snapshot,
  createTask,
  getTask,
  applyPatch
} = require("../kanban/store");

/**
 * rooms : boardId -> Set<WebSocket>
 * state : WebSocket -> { pseudo, role, boardId }
 */
const rooms = new Map();
const state = new WeakMap();


function joinRoom(ws, boardId)
{
    if (!rooms.has(boardId))
    {
        rooms.set(boardId, new Set());
    }

    rooms.get(boardId).add(ws);
}

function leaveRoom(ws, boardId)
{
    const room = rooms.get(boardId);

    if (!room)
    {
        return;
    }

    room.delete(ws);

    if (room.size === 0)
    {
        rooms.delete(boardId);
    }
}

function broadcast(boardId, payload)
{
    const room = rooms.get(boardId);

    if (!room)
    {
        return;
    }

    const message = JSON.stringify(payload);

    for (const client of room)
    {
        if (client.readyState === WebSocket.OPEN)
        {
        client.send(message);
        }
    }
}


function startWs(httpServer)
{
    const wss = new WebSocket.Server({ server: httpServer });

    wss.on("connection", (ws) =>
    {
        state.set(ws, {
            pseudo: null,
            role: "user",
            boardId: null
        });

        ws.send(JSON.stringify({
            type: "sys:status",
            data: { state: "connected" }
        }));

        ws.on("message", (buffer) =>
        {

            if (buffer.length > 2048)
            {
                ws.send(JSON.stringify({
                type: "error",
                data: { reason: "too_large" }
                }));
                return;
            }

            const result = parse(buffer.toString("utf8"));

            if (!result.ok)
            {
                ws.send(JSON.stringify({
                type: "error",
                data: { reason: result.err }
                }));
                return;
            }

            const { type, data } = result.msg;
            const socketState = state.get(ws);

            if (type === "auth:hello")
            {

                socketState.pseudo = data.pseudo;
                socketState.role = (data.token === "admin") ? "admin" : "user";

                ws.send(JSON.stringify({
                    type: "auth:ok",
                    data: { role: socketState.role }
                }));

                return;

            }

            if (type === "board:join")
            {
                if (socketState.boardId)
                {
                    leaveRoom(ws, socketState.boardId);
                }

                socketState.boardId = data.boardId;
                joinRoom(ws, data.boardId);

                ws.send(JSON.stringify({

                    type: "board:state",
                    data: {
                        boardId: data.boardId,
                        tasks: snapshot(data.boardId),
                        serverTs: Date.now()
                    }

                }));

                return;
            }

            if (type === "task:create")
            {
                const task = createTask(data.boardId, data);

                broadcast(data.boardId, {
                    type: "task:created",
                    data: {
                        boardId: data.boardId,
                        task,
                        by: socketState.pseudo,
                        ts: Date.now()
                    }
                });

                return;
            }

            if (type === "task:update")
            {
                const task = getTask(data.boardId, data.taskId);

                if (!task)
                {

                    ws.send(JSON.stringify({
                        type: "error",
                        data: { reason: "not_found" }
                    }));

                    return;

                }

                // Check de concurence
                if (task.version !== data.baseVersion)
                {

                    ws.send(JSON.stringify({

                        type: "task:conflict",
                        data: {
                            boardId: data.boardId,
                            taskId: data.taskId,
                            expectedVersion: data.baseVersion,
                            actualVersion: task.version,
                            current: task
                        }

                    }));

                    return;

                }

                const before = structuredClone(task);

                applyPatch(task, data.patch);

                const after = structuredClone(task);

                broadcast(data.boardId, {

                    type: "task:updated",
                    data: {
                        boardId: data.boardId,
                        taskId: data.taskId,
                        before,
                        after,
                        by: socketState.pseudo,
                        ts: Date.now()
                    }

                });

                return;

            }
            
        });

        ws.on("close", () =>
        {

            const socketState = state.get(ws);

            if (socketState?.boardId)
            {
                leaveRoom(ws, socketState.boardId);
            }

        });

    });

    console.log("WebSocket ready");
}

module.exports = { startWs };