// CURSEUR MANAGER - Partage de curseur en temps réel

const style = document.createElement('style');
style.innerHTML = `
  .remote-cursor {
    position: fixed !important;
    pointer-events: none !important;
    z-index: 999999 !important;
    display: block !important;
  }
`;
document.head.appendChild(style);

const cursors = new Map();
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

function updateCursor(pseudo, x, y) {
  let cursor = cursors.get(pseudo);
  
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.className = 'remote-cursor';
    cursor.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background: ${colors[cursors.size % colors.length]};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      "></div>
      <div style="
        position: absolute;
        top: 25px;
        left: 10px;
        background: ${colors[cursors.size % colors.length]};
        color: white;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${pseudo}</div>
    `;
    document.body.appendChild(cursor);
    cursors.set(pseudo, cursor);
  }
  
  cursor.style.left = x + 'px';
  cursor.style.top = y + 'px';
  
  if (cursor._timeout) clearTimeout(cursor._timeout);
  cursor._timeout = setTimeout(() => {
    cursor.remove();
    cursors.delete(pseudo);
  }, 10000);
}

function sendCursorPosition(ws, pseudo) {
  let lastX = -1, lastY = -1;
  
  document.addEventListener('mousemove', (e) => {
    if (Math.abs(e.clientX - lastX) < 5 && Math.abs(e.clientY - lastY) < 5) return;
    
    lastX = e.clientX;
    lastY = e.clientY;
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'cursor:move',
        data: { pseudo, x: lastX, y: lastY }
      }));
    }
  });
}

function handleCursorMove(data) {
  updateCursor(data.pseudo, data.x, data.y);
}

function clearAllCursors() {
  cursors.forEach(c => c.remove());
  cursors.clear();
}

function removeCursor(pseudo) {
  const cursor = cursors.get(pseudo);
  if (cursor) {
    cursor.remove();
    cursors.delete(pseudo);
  }
}

window.cursorManager = {
  sendCursorPosition,
  handleCursorMove,
  clearAllCursors,
  removeCursor,
  updateCursor
};