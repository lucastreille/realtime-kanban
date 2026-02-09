let ws;
let boardId;
let pseudo;
const tasks = new Map();

const $ = (id) => document.getElementById(id);
const setStatus = (s) => $("status").textContent = s;

function connect() {

  pseudo = $("pseudo").value;
  boardId = $("board").value;

  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {

    setStatus("connected");
    ws.send(JSON.stringify({ 
      type:"auth:hello", 
      data:{ 
        pseudo 
      } 
    }));

    ws.send(JSON.stringify({ 
      type:"board:join", data:{ boardId } 
    }));

  };

  ws.onclose = () => setStatus("offline");
  ws.onerror = () => setStatus("error");

  ws.onmessage = (e) => handle(JSON.parse(e.data));
}

function disconnect() {

  ws?.close();
  tasks.clear();
  render();
  
}

function leaveBoard() {

  tasks.clear();
  render();

}

function handle(msg) {

  if (msg.type === "board:state") {

    tasks.clear();
    msg.data.tasks.forEach(t => tasks.set(t.id, t));
    render();

  }

  if (msg.type === "task:created") {

    tasks.set(msg.data.task.id, msg.data.task);
    render();

  }

  if (msg.type === "task:updated") {

    tasks.set(msg.data.after.id, msg.data.after);
    render();

  }

  if (msg.type === "task:conflict") {

    const ok = confirm("⚠️ Tâche modifiée par un autre utilisateur.\nForcer la modification ?");

    if (ok) {

      const t = msg.data.current;
      ws.send(JSON.stringify({
        type:"task:update",
        data:{
          boardId,
          taskId: t.id,
          baseVersion: t.version,
          patch: { status: t.status }
        }
      }));

    } else {

      ws.send(JSON.stringify({ type:"board:join", data:{ boardId } }));

    }

  }

}

function render() {

  ["todo","doing","done"].forEach(c => $(c).innerHTML = "");

  tasks.forEach(t => {

    const div = document.createElement("div");
    div.className = "task";
    div.textContent = `${t.title} (v${t.version})`;
    div.onclick = () => moveTask(t);
    $(t.status).appendChild(div);

  });

}

function addTask() {

  const title = $("title").value.trim();
  
  if (!title) 
  {
    return;
  }
  

  ws.send(JSON.stringify({
    type:"task:create",
    data:{ boardId, title }
  }));

  $("title").value = "";

}

function moveTask(t) {
  const next = t.status === "todo" ? "doing" :
               t.status === "doing" ? "done" : "todo";

  ws.send(JSON.stringify({
    type:"task:update",
    data:{
      boardId,
      taskId: t.id,
      baseVersion: t.version,
      patch:{ status: next }
    }
  }));
}

$("connect").onclick = connect;
$("disconnect").onclick = disconnect;
$("leave").onclick = leaveBoard;
$("add").onclick = addTask;