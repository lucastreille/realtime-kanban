import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: "./src/kanban/schema.js",
    out: "./drizzle",
    dbCredentials: {
        url: "./kanban.db",
    },
});
