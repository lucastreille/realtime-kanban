const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

const boards = sqliteTable('boards', {
    boardId: text('boardId').primaryKey(),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
});

const tasks = sqliteTable('tasks', {
    id: text('id').primaryKey(),
    boardId: text('boardId').notNull().references(() => boards.boardId),
    title: text('title').notNull(),
    description: text('description').default(''),
    status: text('status').default('todo'),
    version: integer('version').default(0),
    createdBy: text('createdBy').default('unknown'),
    updatedAt: integer('updatedAt').notNull(),
    createdAt: integer('createdAt').notNull(),
});

module.exports = {
    boards,
    tasks,
};
