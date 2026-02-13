const WebSocket = require("ws");
const config = require("../config");
const { parse } = require("./protocol");
const { ErrorTypes, sendError } = require("./errors");
const {
  initRateLimit,
  checkRateLimit,
  cleanupRateLimit,
} = require("./rateLimit");
const { logger, errorManager } = require("../utils/errorManager");
const {
  isValidPseudo,
  sanitizePseudo,
  canAccessBoard,
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
} = require("./auth");
const {
  isValidToken,
  getRoleFromToken,
  isUserToken,
  generateUserToken,
  getPseudoByToken,
} = require("./userTokens");
const {
  snapshot,
  createTask,
  getTask,
  applyPatch,
  deleteTask,
} = require("../kanban/store");

/**
 * rooms : boardId -> Set<WebSocket>
 * state : WebSocket -> { pseudo, role, boardId, authenticated }
 */
const rooms = new Map();
const state = new WeakMap();

function joinRoom(ws, boardId) {
  if (!rooms.has(boardId)) {
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
      boardId: null,
      authenticated: false,
    });

    initRateLimit(ws);

        ws.send(JSON.stringify({
        type: "sys:status",
            data: { state: "connected" }
        }));

    ws.on("message", (buffer) => {
      const socketState = state.get(ws);

      if (buffer.length > config.maxMessageSize) {
        sendError(
          ws,
          ErrorTypes.MESSAGE_TOO_LARGE,
          {
            maxSize: config.maxMessageSize,
            receivedSize: buffer.length,
            pseudo: socketState?.pseudo || "unknown",
          },
          socketState?.pseudo,
        );
        return;
      }

      const result = parse(buffer.toString("utf8"));

      if (!result.ok) {
        const errorType =
          result.err === "json"
            ? ErrorTypes.INVALID_JSON
            : ErrorTypes.INVALID_SCHEMA;

        sendError(
          ws,
          errorType,
          {
            error: result.err,
            pseudo: socketState?.pseudo || "unknown",
          },
          socketState?.pseudo,
        );
        return;
      }

      const { type, data } = result.msg;
      if (type === "auth:hello") {
        if (!isValidPseudo(data.pseudo)) {
          sendError(ws, ErrorTypes.INVALID_PSEUDO, {
            minLength: config.auth.minPseudoLength,
            maxLength: config.auth.maxPseudoLength,
            attempted: data.pseudo,
          });
          return;
        }

        let token = data.token || null;
        let pseudo = sanitizePseudo(data.pseudo);
        let isNewToken = false;

        
        if (token) {
          if (isUserToken(token)) {
            
            const storedPseudo = getPseudoByToken(token);
            if (storedPseudo !== pseudo) {
              sendError(ws, ErrorTypes.INVALID_TOKEN, { pseudo });
              return;
            }
          } else if (!isValidToken(token)) {
            sendError(ws, ErrorTypes.INVALID_TOKEN, { pseudo });
            return;
          }
        } else {
          
          token = generateUserToken(pseudo);
          isNewToken = true;
        }

        socketState.pseudo = pseudo;
        
        const validRoles = ["admin", "user"];
        if (data.role && validRoles.includes(data.role)) {
          socketState.role = data.role;
        } else {
          socketState.role = getRoleFromToken(token);
        }
        socketState.authenticated = true;

        logger.info("User authenticated", {
          pseudo: socketState.pseudo,
          role: socketState.role,
        });

                ws.send(JSON.stringify({
            type: "auth:ok",
                    data: { role: socketState.role }
                }));

        return;
      }

      if (!socketState.authenticated || !socketState.pseudo) {
        sendError(ws, ErrorTypes.AUTH_REQUIRED, {
          type,
          authenticated: socketState.authenticated,
        });
        return;
      }

      // Liste des boards disponibles
      if (type === "boards:list") {
        const { getAllBoards } = require("../kanban/store");
        const boards = getAllBoards();
        
        ws.send(JSON.stringify({
          type: "boards:list",
          data: { boards }
        }));
        
        return;
      }

      if (type === "board:join") {
        if (!canAccessBoard(socketState, data.boardId)) {
          sendError(
            ws,
            ErrorTypes.BOARD_ACCESS_DENIED,
            {
              boardId: data.boardId,
            },
            socketState.pseudo,
          );
          return;
        }

        if (socketState.boardId) {
          broadcast(socketState.boardId, {
            type: "user:left",
            data: {
              pseudo: socketState.pseudo,
              boardId: socketState.boardId,
              ts: Date.now(),
            },
          });
          leaveRoom(ws, socketState.boardId);
        }

        socketState.boardId = data.boardId;
        joinRoom(ws, data.boardId);

        const result = snapshot(data.boardId);

        if (result === null) {
          sendError(
            ws,
            ErrorTypes.BOARD_LIMIT_REACHED,
            {
              maxBoards: config.maxBoardsTotal,
            },
            socketState.pseudo,
          );
          return;
        }

        // Si c'est un nouveau board, broadcaster à tous
        if (result.isNewBoard) {
          for (const [roomBoardId, room] of rooms) {
            for (const client of room) {
              if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(JSON.stringify({
                  type: "board:created",
                  data: {
                    boardId: data.boardId,
                    createdBy: socketState.pseudo,
                    ts: Date.now()
                  }
                }));
              }
            }
          }
        }

       ws.send(JSON.stringify({
        
            type: "board:state",
            data: {
              boardId: data.boardId,
              tasks: result.tasks,
              serverTs: Date.now(),
            },
          }),
        );

        return;
      }

      if (type === "task:create") {
        
        const rateLimitResult = checkRateLimit(ws);
        if (!rateLimitResult.allowed) {
          if (rateLimitResult.shouldNotify) {
            sendError(
              ws,
              ErrorTypes.RATE_LIMIT_EXCEEDED,
              {
                pseudo: socketState.pseudo,
                reason: rateLimitResult.reason,
              },
              socketState.pseudo,
            );
          }
          return;
        }

        if (!canCreateTask(socketState, data.boardId)) {
          sendError(
            ws,
            ErrorTypes.FORBIDDEN,
            {
              action: "task:create",
              boardId: data.boardId,
            },
            socketState.pseudo,
          );
          return;
        }

        const task = createTask(data.boardId, {
          ...data,
          createdBy: socketState.pseudo,
        });

        if (task.error) {
          if (task.error === "board_limit_reached") {
            sendError(
              ws,
              ErrorTypes.BOARD_LIMIT_REACHED,
              {
                maxBoards: config.maxBoardsTotal,
              },
              socketState.pseudo,
            );
          } else if (task.error === "task_limit_reached") {
            sendError(
              ws,
              ErrorTypes.TASK_LIMIT_REACHED,
              {
                maxTasks: config.maxTasksPerBoard,
              },
              socketState.pseudo,
            );
          } else {
            sendError(
              ws,
              ErrorTypes.TASK_CREATE_FAILED,
              {
                error: task.error,
              },
              socketState.pseudo,
            );
          }
          return;
        }

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

      if (type === "task:update") {
        
        const rateLimitResult = checkRateLimit(ws);
        if (!rateLimitResult.allowed) {
          if (rateLimitResult.shouldNotify) {
            sendError(
              ws,
              ErrorTypes.RATE_LIMIT_EXCEEDED,
              {
                pseudo: socketState.pseudo,
                reason: rateLimitResult.reason,
              },
              socketState.pseudo,
            );
          }
          return;
        }

        if (!canUpdateTask(socketState, data.boardId)) {
          sendError(
            ws,
            ErrorTypes.FORBIDDEN,
            {
              action: "task:update",
              boardId: data.boardId,
            },
            socketState.pseudo,
          );
          return;
        }

        const task = getTask(data.boardId, data.taskId);

        if (!task) {
          sendError(
            ws,
            ErrorTypes.TASK_NOT_FOUND,
            {
              taskId: data.taskId,
            },
            socketState.pseudo,
          );
          return;
        }

        if (task.version !== data.baseVersion) {
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

      if (type === "task:delete") {
        
        const rateLimitResult = checkRateLimit(ws);
        if (!rateLimitResult.allowed) {
          if (rateLimitResult.shouldNotify) {
            sendError(
              ws,
              ErrorTypes.RATE_LIMIT_EXCEEDED,
              {
                pseudo: socketState.pseudo,
                reason: rateLimitResult.reason,
              },
              socketState.pseudo,
            );
          }
          return;
        }

        const task = getTask(data.boardId, data.taskId);

        if (!task) {
          sendError(
            ws,
            ErrorTypes.TASK_NOT_FOUND,
            {
              taskId: data.taskId,
            },
            socketState.pseudo,
          );
          return;
        }

        
        if (!canDeleteTask(socketState, task)) {
          sendError(
            ws,
            ErrorTypes.FORBIDDEN,
            {
              action: "task:delete",
              reason: "Vous ne pouvez supprimer que vos propres tâches",
            },
            socketState.pseudo,
          );
          return;
        }

        const result = deleteTask(data.boardId, data.taskId);

        if (result.error) {
          sendError(
            ws,
            ErrorTypes.TASK_NOT_FOUND,
            {
              taskId: data.taskId,
              error: result.error,
            },
            socketState.pseudo,
          );
          return;
        }

        broadcast(data.boardId, {
          type: "task:deleted",
          data: {
            boardId: data.boardId,
            taskId: data.taskId,
            by: socketState.pseudo,
            ts: Date.now(),
          },
        });

        return;
      }

      // Mouvements de curseur
      if (type === "cursor:move") {

        // Broadcaster la position du curseur aux autres utilisateurs du board
        if (socketState.boardId) {
          broadcast(socketState.boardId, {
            type: "cursor:move",
            data: {
              pseudo: socketState.pseudo,
              x: data.x,
              y: data.y,
              ts: Date.now()
            }
          });
        }
        return;

      }

      sendError(
        ws,
        ErrorTypes.INVALID_SCHEMA,
        {
          receivedType: type,
        },
        socketState?.pseudo,
      );
    });

    ws.on("close", () => {
      const socketState = state.get(ws);

      
      errorManager.unregisterWebSocket(ws);

      
      cleanupRateLimit(ws);

      if (socketState?.boardId) {
        
        broadcast(socketState.boardId, {
          type: "user:left",
          data: {
            pseudo: socketState.pseudo || "unknown",
            boardId: socketState.boardId,
            ts: Date.now(),
          },
        });

        leaveRoom(ws, socketState.boardId);
      }

      
      if (socketState?.pseudo) {
        logger.info("User disconnected", {
          pseudo: socketState.pseudo,
          boardId: socketState.boardId || null,
          role: socketState.role,
        });
      }
    });
  });

  logger.info("WebSocket server started", { port: config.port });
}

module.exports = { startWs };