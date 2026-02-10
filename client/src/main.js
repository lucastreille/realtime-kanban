import './style.css';

let ws;
let boardId;
let pseudo;
const tasks = new Map();
let editingTask = null;
let conflictData = null;

const $ = (id) => document.getElementById(id);

function setStatus(s) {
  const el = $("status");
  el.textContent = s;

  // Couleur selon l'état
  if (s === "connected") el.style.color = "green";
  else if (s === "offline") el.style.color = "red";
  else if (s === "error") el.style.color = "orange";
}

function connect() {

  pseudo = $("pseudo").value;
  boardId = $("board").value;

  ws = new WebSocket("ws://localhost:3000");
  // Pour connexion à une autre machine : new WebSocket("ws://10.3.201.190:3000");

  ws.onopen = () => {

    setStatus("connected");

    // Réactiver les boutons
    $("add").disabled = false;
    $("leave").disabled = false;

    ws.send(JSON.stringify({
      type: "auth:hello",
      data: {
        pseudo
      }
    }));

    ws.send(JSON.stringify({
      type: "board:join", data: { boardId }
    }));

  };

  ws.onclose = () => setStatus("offline");
  ws.onerror = () => setStatus("error");

  ws.onmessage = (e) => handle(JSON.parse(e.data));
}

function disconnect() {

  ws?.close();
  ws = null;
  tasks.clear();
  render();
  setStatus("offline");

  // Désactiver les actions tant que non reconnecté
  $("add").disabled = true;
  $("leave").disabled = true;

}

function leaveBoard() {

  // Rejoindre un board vide pour ne plus recevoir d'événements
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "board:join", data: { boardId: "__none__" } }));
  }

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

    const task = msg.data.task;
    task._lastEditBy = msg.data.by;
    task._lastAction = "Créé";
    tasks.set(task.id, task);
    render();

  }

  if (msg.type === "task:updated") {

    const task = msg.data.after;
    task._lastEditBy = msg.data.by;
    task._lastAction = "Modifié";
    tasks.set(task.id, task);
    render();

  }

  if (msg.type === "task:conflict") {

    // Stocker les données du conflit pour les boutons
    conflictData = msg.data;

    // Afficher la bannière
    $("conflict-bar").classList.remove("hidden");

  }

}

function render() {

  ["todo", "doing", "done"].forEach(c => $(c).innerHTML = "");

  tasks.forEach(t => {

    const card = document.createElement("div");
    card.className = "task";

    // Titre de la tâche
    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = t.title;

    // Description (si elle existe)
    const desc = document.createElement("div");
    desc.className = "task-desc";
    desc.textContent = t.description || "";

    // Version
    const version = document.createElement("div");
    version.className = "task-version";
    version.textContent = `v${t.version}`;

    // Barre d'actions
    const actions = document.createElement("div");
    actions.className = "task-actions";

    // Bouton éditer
    const editBtn = document.createElement("button");
    editBtn.textContent = "\u270F\uFE0F Éditer";
    editBtn.className = "btn-edit";
    editBtn.onclick = () => openModal(t);
    actions.appendChild(editBtn);

    // Select pour changer de colonne
    const select = document.createElement("select");
    select.className = "status-select";

    // Définir les options
    ["todo", "doing", "done"].forEach(status => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      if (status === t.status) option.selected = true;
      select.appendChild(option);
    });

    // Écouter le changement
    select.onchange = (e) => {
      moveTask(t, e.target.value);
    };

    actions.appendChild(editBtn);
    actions.appendChild(select);

    card.appendChild(title);
    if (t.description) card.appendChild(desc);

    // Historique : qui a modifié en dernier
    if (t._lastEditBy) {
      const info = document.createElement("div");
      info.className = "task-info";
      info.textContent = `${t._lastAction || "Modifié"} par ${t._lastEditBy}`;
      card.appendChild(info);
    }

    card.appendChild(version);
    card.appendChild(actions);
    $(t.status).appendChild(card);

  });

}

function addTask() {

  const title = $("title").value.trim();

  if (!title) {
    return;
  }


  ws.send(JSON.stringify({
    type: "task:create",
    data: { boardId, title }
  }));

  $("title").value = "";

}

let lastPatch = null;

function moveTask(t, targetStatus) {

  lastPatch = { status: targetStatus };

  ws.send(JSON.stringify({
    type: "task:update",
    data: {
      boardId,
      taskId: t.id,
      baseVersion: t.version,
      patch: lastPatch
    }
  }));
}

// --- Modale d'édition ---

function openModal(task) {
  editingTask = task;
  $("edit-title").value = task.title;
  $("edit-desc").value = task.description || "";
  $("modal").classList.remove("hidden");
}

function closeModal() {
  editingTask = null;
  $("modal").classList.add("hidden");
}

function saveEdit() {
  if (!editingTask) return;

  const newTitle = $("edit-title").value.trim();
  const newDesc = $("edit-desc").value.trim();

  // On construit le patch avec les champs modifiés
  const patch = {};
  if (newTitle !== editingTask.title) patch.title = newTitle;
  if (newDesc !== (editingTask.description || "")) patch.description = newDesc;

  // Si rien n'a changé, on ferme simplement
  if (Object.keys(patch).length === 0) {
    closeModal();
    return;
  }

  lastPatch = patch;

  ws.send(JSON.stringify({
    type: "task:update",
    data: {
      boardId,
      taskId: editingTask.id,
      baseVersion: editingTask.version,
      patch: lastPatch
    }
  }));

  closeModal();
}

// --- Gestion des conflits ---

function hideConflictBar() {
  $("conflict-bar").classList.add("hidden");
  conflictData = null;
}

function confirmConflict() {
  if (!conflictData) return;

  const t = conflictData.current;
  ws.send(JSON.stringify({
    type: "task:update",
    data: {
      boardId,
      taskId: t.id,
      baseVersion: t.version,
      patch: lastPatch
    }
  }));

  hideConflictBar();
}

function cancelConflict() {
  // Recharger l'état du board
  ws.send(JSON.stringify({ type: "board:join", data: { boardId } }));
  hideConflictBar();
}

$("connect").onclick = connect;
$("disconnect").onclick = disconnect;
$("leave").onclick = leaveBoard;
$("add").onclick = addTask;
$("edit-save").onclick = saveEdit;
$("edit-cancel").onclick = closeModal;
$("conflict-confirm").onclick = confirmConflict;
$("conflict-cancel").onclick = cancelConflict;