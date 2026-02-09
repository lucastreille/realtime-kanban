const http = require("http");
const { startWs } = require("./ws/wsServer");

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

server.listen(3000, () => console.log("HTTP+WS on http://localhost:3000"));
