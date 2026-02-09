const { z } = require("zod");

const authHello = z.object({

    type: z.literal("auth:hello"),
    data: z.object({ 
    pseudo: z.string().min(1).max(20),
     token: z.string().optional() 
    })

});

const boardJoin = z.object({

    type: z.literal("board:join"),
    data: z.object({ 
        boardId: z.string().min(1).max(30) 
    })

});

const taskCreate = z.object({

    type: z.literal("task:create"),
    data: z.object({
        boardId: z.string().min(1).max(30),
        title: z.string().min(1).max(100),
        description: z.string().max(1000).optional()
    })

});

const taskUpdate = z.object({

    type: z.literal("task:update"),
    data: z.object({
        boardId: z.string().min(1).max(30),
        taskId: z.string().min(1),
        baseVersion: z.number().int().min(0),
        patch: z.object({
        title: z.string().min(1).max(100).optional(),
        description: z.string().max(1000).optional(),
        status: z.enum(["todo","doing","done"]).optional()
        })
    })

});

const schemas = [authHello, boardJoin, taskCreate, taskUpdate];

function parse(raw) {

    let msg; try { 
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
