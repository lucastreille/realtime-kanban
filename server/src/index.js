const http = require("http");
const config = require("./config");
const { startWs } = require("./ws/wsServer");
const { logger, errorManager } = require("./utils/errorManager");

const server = http.createServer((req, res) => {

  if (req.url === "/health") {

    res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
            ok: true 
        }));


    return;
  }

    res.writeHead(404); res.end();

});

startWs(server);

server.listen(config.port, () => {
  logger.info("HTTP server started", {
    port: config.port,
    healthEndpoint: "/health",
  });

  console.log(`Serveur Kanban démarré sur le port ${config.port}`);
  console.log(`Dashboard de santé : http://localhost:${config.port}/health`);

  setInterval(
    () => {
      errorManager.cleanOldLogs();
    },
    24 * 60 * 60 * 1000,
  );
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Erreur : Le port ${config.port} est déjà utilisé`);
    process.exit(1);
  } else {
    errorManager.logError("INTERNAL_ERROR", {
      serverError: error.message,
      code: error.code,
    });
    console.error("Erreur du serveur HTTP:", error);
  }
});
