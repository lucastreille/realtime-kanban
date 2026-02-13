const { z } = require("zod");
const config = require("../config");

const authHello = z.object({

  type: z.literal("auth:hello"),
  data: z.object({
    pseudo: z
      .string()
      .min(config.auth.minPseudoLength)
      .max(config.auth.maxPseudoLength),
    token: z.string().optional(),
    role: z.enum(["admin", "user"]).optional(),
  }),
});

const boardJoin = z.object({
  type: z.literal("board:join"),
  data: z.object({
    boardId: z
      .string()
      .min(1)
      .max(config.maxBoardIdLength)
      .regex(
        config.boardIdPattern,
        "boardId must contain only alphanumerics, hyphens, and underscores",
      ),
  }),
});

const taskCreate = z.object({
  type: z.literal("task:create"),
  data: z.object({
    boardId: z
      .string()
      .min(1)
      .max(config.maxBoardIdLength)
      .regex(config.boardIdPattern),
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
  }),
});

const taskUpdate = z.object({
  type: z.literal("task:update"),
  data: z.object({
    boardId: z
      .string()
      .min(1)
      .max(config.maxBoardIdLength)
      .regex(config.boardIdPattern),
    taskId: z.string().min(1),
    baseVersion: z.number().int().min(0),
    patch: z.object({
      title: z.string().min(1).max(100).optional(),
      description: z.string().max(1000).optional(),
        status: z.enum(["todo","doing","done"]).optional()
        })
    })

});

const taskDelete = z.object({
  type: z.literal("task:delete"),
  data: z.object({
    boardId: z.string().min(1).max(config.maxBoardIdLength).regex(config.boardIdPattern),
    taskId: z.string().min(1)
  })
});

const cursorMove = z.object({
  type: z.literal("cursor:move"),
  data: z.object({
    pseudo: z.string().min(1).max(50),
    x: z.number().int().min(0).max(10000),
    y: z.number().int().min(0).max(10000)
  })
});

const boardsList = z.object({
  type: z.literal("boards:list"),
  data: z.object({}).optional()
});

const schemas = [authHello, boardJoin, taskCreate, taskUpdate, taskDelete, cursorMove, boardsList];

function parse(raw) {

  let msg;

  try { 
    msg = JSON.parse(raw);
  } 
  catch 
  { 
    return { ok:false, err:"json" };
  }

  for (const s of schemas) {

    const r = s.safeParse(msg);

    if (r.success) {
      return {
        ok:true, 
        msg:r.data 
      }
    }

  }

  return {
    ok:false, 
    err:"schema" 
  };

}

module.exports = { parse };