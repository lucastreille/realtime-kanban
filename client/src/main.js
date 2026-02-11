import './style.css';
import "./toastManager.js";
import './cursorManager.js';
import './cursor.css';

let ws;
let boardId;
let pseudo;
let userRole = "user";
const tasks = new Map();
let editingTask = null;
let conflictData = null;
const knownBoards = new Set();

const $ = (id) => document.getElementById(id);

function setStatus(s, showToast = false) {
  const el = $("status");
  el.textContent = s;

  // Couleur selon l'état
  if (s === "connected") {
    el.style.color = "green";
    if (showToast) {
      window.toastManager.success("Connecté au serveur");
    }
  } else if (s === "offline") {
    el.style.color = "red";
    if (showToast) {
      window.toastManager.warning("Déconnecté du serveur");
    }
  } else if (s === "error") {
    el.style.color = "orange";
    if (showToast) {
      window.toastManager.error("Erreur de connexion");
    }
  }
}

function connect() {
  pseudo = $("pseudo").value;
  boardId = $("board").value;

  if (!pseudo.trim()) {
    window.toastManager.warning("Veuillez saisir un pseudo");
    return;
  }

  if (!boardId.trim()) {
    window.toastManager.warning("Veuillez saisir un nom de tableau");
    return;
  }

  ws = new WebSocket("ws://localhost:3000");

  // Pour connexion à une autre machine : new WebSocket("ws://10.3.201.190:3000");
  //   ws = new WebSocket("ws://10.101.29.136:3000");

  ws.onopen = () => {
    setStatus("connected");
    window.toastManager.success("Connecté au serveur");

    // Basculer l'affichage
    $("login-view").classList.add("hidden");
    $("app-view").classList.remove("hidden");

    $("add").disabled = false;

    const selectedRole = document.querySelector('input[name="role"]:checked');
    userRole = selectedRole ? selectedRole.value : "user";

    ws.send(JSON.stringify({
        type: "auth:hello",
      data: { pseudo }
    }));

    // Charger la liste des boards existants
    ws.send(JSON.stringify({
      type: "boards:list",
      data: {}
    }));

    // Rejoindre le board
    switchBoard(boardId);

    // Partage de curseur
    window.cursorManager.sendCursorPosition(ws, pseudo);

  };

  ws.onclose = (event) => {
    setStatus("offline");

    if (event.code !== 1000) {
      window.toastManager.info("Déconnecté du serveur");
    }
  };

  ws.onerror = (event) => {
    setStatus("error");
    window.toastManager.error("Impossible de se connecter au serveur", {
      actions: [{ label: "Réessayer", action: "reconnect", primary: true }],
    });
  };

  ws.onmessage = (e) => handle(JSON.parse(e.data));
}

function disconnect() {

  ws?.close();
  ws = null;
  tasks.clear();
  render();
  setStatus("offline");

  window.cursorManager.clearAllCursors();

  // Retour à la vue login
  $("app-view").classList.add("hidden");
  $("login-view").classList.remove("hidden");

}

// Changer de board
function switchBoard(newBoardId) {
  boardId = newBoardId;
  knownBoards.add(boardId);
  $("board-name-display").textContent = boardId;

  window.cursorManager.clearAllCursors();

  tasks.clear();
  render();
  updateBoardSelect();

  ws.send(JSON.stringify({ type: "board:join", data: { boardId } }));
}

// Mettre à jour le select des boards
function updateBoardSelect() {
  const sel = $("board-select");
  sel.innerHTML = "";
  knownBoards.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    if (b === boardId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function handle(msg) {
  if (msg.type === "error" || msg.type === "system:error") {
    window.toastManager.showSystemError(msg.data);
    return;
  }

  // Gérer la liste des boards
  if (msg.type === "boards:list") {
    msg.data.boards.forEach(board => {
      knownBoards.add(board.boardId);
    });
    updateBoardSelect();
    return;
  }

  // Gérer les mouvements de curseur
  if (msg.type === "cursor:move") {
    // Ne pas afficher son propre curseur
    if (msg.data.pseudo !== pseudo) {
      window.cursorManager.handleCursorMove(msg.data);
    }
    return;
  }

  // Déconnexion d'un utilisateur
  if (msg.type === "user:left") {
    window.cursorManager.removeCursor(msg.data.pseudo);
    return;
  }

  if (msg.type === "board:state") {

    tasks.clear();
    msg.data.tasks.forEach((t) => tasks.set(t.id, t));
    render();
    window.toastManager.success(
      `Tableau "${boardId}" chargé (${msg.data.tasks.length} tâches)`,
    );
  }

  if (msg.type === "task:created") {

    const task = msg.data.task;
    task._lastEditBy = msg.data.by;
    task._lastAction = "Créé";
    tasks.set(task.id, task);
    render();

    if (msg.data.by !== pseudo) {
      window.toastManager.info(
        `Nouvelle tâche "${task.title}" créée par ${msg.data.by}`,
      );
    } else {
      window.toastManager.success("Tâche créée avec succès");
    }
  }

  if (msg.type === "task:updated") {

    const task = msg.data.after;
    task._lastEditBy = msg.data.by;
    task._lastAction = "Modifié";
    tasks.set(task.id, task);
    render();

    if (msg.data.by !== pseudo) {
      window.toastManager.info(
        `Tâche "${task.title}" modifiée par ${msg.data.by}`,
      );
    }
  }

  if (msg.type === "task:deleted") {
    const taskTitle = tasks.get(msg.data.taskId)?.title || "Tâche";
    tasks.delete(msg.data.taskId);
    render();

    if (msg.data.by !== pseudo) {
      window.toastManager.info(
        `Tâche "${taskTitle}" supprimée par ${msg.data.by}`,
      );
    } else {
      window.toastManager.success("Tâche supprimée avec succès");
    }
  }

  if (msg.type === "task:conflict") {

    // Stocker les données du conflit pour les boutons
    conflictData = msg.data;

    // Afficher la bannière
    $("conflict-bar").classList.remove("hidden");

    window.toastManager.warning(
      "Conflit détecté ! Une autre personne a modifié cette tâche",
      {
        duration: 0, 
        actions: [
          { label: "Annuler", action: "cancel_conflict" },
          { label: "Forcer", action: "confirm_conflict", primary: true },
        ],
      },
    );
  }
}

function render() {

  // Vider les listes
  ["todo", "doing", "done"].forEach(c => $(c).innerHTML = "");

  // Compteurs
  const counts = { todo: 0, doing: 0, done: 0 };

  tasks.forEach(t => {

    counts[t.status]++;

    const card = document.createElement("div");
    card.className = "task task-" + t.status;

    // Titre
    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = t.title;

    // Description
    const desc = document.createElement("div");
    desc.className = "task-desc";
    desc.textContent = t.description || "";

    // Meta : version + info
    const meta = document.createElement("div");
    meta.className = "task-meta";

    if (t._lastEditBy) {
      const info = document.createElement("span");
      info.className = "task-info";
      info.textContent = `${t._lastAction || "Modifié"} par ${t._lastEditBy}`;
      meta.appendChild(info);
    } else if (t.createdBy) {
      const info = document.createElement("span");
      info.className = "task-info";
      info.textContent = `Créé par ${t.createdBy}`;
      meta.appendChild(info);
    }

    const version = document.createElement("span");
    version.className = "task-version";
    version.textContent = "v" + t.version;
    meta.appendChild(version);

    // Actions
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Éditer";
    editBtn.className = "btn-edit";
    editBtn.onclick = () => openModal(t);

    const statusLabels = { todo: "À faire", doing: "En cours", done: "Terminé" };
    const select = document.createElement("select");
    select.className = "status-select";
    ["todo", "doing", "done"].forEach(status => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = statusLabels[status];
      if (status === t.status) option.selected = true;
      select.appendChild(option);
    });
    select.onchange = (e) => moveTask(t, e.target.value);

    actions.appendChild(editBtn);
    actions.appendChild(select);

    const canDelete = userRole === "admin" || t.createdBy === pseudo;
    if (canDelete) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.className = "btn-delete";
      deleteBtn.title = "Supprimer la tâche";
      deleteBtn.onclick = () => deleteTask(t);
      actions.appendChild(deleteBtn);
    }

    card.appendChild(title);
    if (t.description) card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(actions);

    $(t.status).appendChild(card);

  });

  // Mettre à jour les compteurs
  $("count-todo").textContent = counts.todo;
  $("count-doing").textContent = counts.doing;
  $("count-done").textContent = counts.done;

}

function addTask() {

  const title = $("title").value.trim();

  if (!title) {
    window.toastManager.warning("Veuillez saisir un titre pour la tâche");
    return;
  }

  if (title.length > 100) {
    window.toastManager.warning(
      "Le titre de la tâche est trop long (max 100 caractères)",
    );
    return;
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    window.toastManager.error("Connexion fermée, impossible de créer la tâche");
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
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    window.toastManager.error(
      "Connexion fermée, impossible de déplacer la tâche",
    );
    return;
  }

  lastPatch = { status: targetStatus };

  ws.send(JSON.stringify({
      type: "task:update",
      data: {
        boardId,
        taskId: t.id,
        baseVersion: t.version,
        patch: lastPatch,
      },
    }),
  );
}

function deleteTask(t) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    window.toastManager.error(
      "Connexion fermée, impossible de supprimer la tâche",
    );
    return;
  }

  if (!confirm(`Voulez-vous vraiment supprimer la tâche "${t.title}" ?`)) {
    return;
  }

  ws.send(
    JSON.stringify({
      type: "task:delete",
      data: {
        boardId,
        taskId: t.id,
      },
    }),
  );
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

$("modal").onclick = (e) => {
  if (e.target.id === "modal") {
    closeModal();
  }
};

$("modal-close").onclick = closeModal;
$("edit-save").onclick = saveEdit;
$("edit-cancel").onclick = closeModal;

function saveEdit() {
  if (!editingTask) return;

  const newTitle = $("edit-title").value.trim();
  const newDesc = $("edit-desc").value.trim();

  if (!newTitle) {
    window.toastManager.warning("Le titre ne peut pas être vide");
    return;
  }

  if (newTitle.length > 100) {
    window.toastManager.warning("Le titre est trop long (max 100 caractères)");
    return;
  }

  if (newDesc.length > 500) {
    window.toastManager.warning(
      "La description est trop longue (max 500 caractères)",
    );
    return;
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    window.toastManager.error("Connexion fermée, impossible de sauvegarder");
    return;
  }

  // On construit le patch avec les champs modifiés
  const patch = {};
  if (newTitle !== editingTask.title) patch.title = newTitle;
  if (newDesc !== (editingTask.description || "")) patch.description = newDesc;

  // Si rien n'a changé, on ferme simplement
  if (Object.keys(patch).length === 0) {
    window.toastManager.info("Aucune modification détectée");
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

// Changement de board via le select
$("board-select").onchange = (e) => {
  const newId = e.target.value;
  if (newId && newId !== boardId) {
    switchBoard(newId);
  }
};

$("connect").onclick = connect;
$("disconnect").onclick = disconnect;
$("add").onclick = addTask;
$("edit-save").onclick = saveEdit;
$("edit-cancel").onclick = closeModal;
$("conflict-confirm").onclick = confirmConflict;
$("conflict-cancel").onclick = cancelConflict;

document.addEventListener("toastAction", (event) => {
  const { action } = event.detail;

  switch (action) {
    case "reconnect":
      if (ws) {
        ws.close();
      }
      setTimeout(() => {
        connect();
      }, 500);
      break;

    case "confirm_conflict":
      confirmConflict();
      break;

    case "cancel_conflict":
      cancelConflict();
      break;

    default:
      console.log("Action de toast inconnue:", action);
  }
});