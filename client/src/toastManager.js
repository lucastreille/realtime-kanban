class ToastManager {
  constructor() {
    this.toasts = new Map();
    this.container = null;
    this.maxToasts = 5;
    this.defaultDuration = 5000;
    this.recentErrors = new Map();
    this.initializeContainer();
    this.setupStyles();

    setInterval(() => {
      this.cleanRecentErrors();
    }, 30000);
  }

  cleanRecentErrors() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentErrors.entries()) {
      if (now - timestamp > 10000) {
        this.recentErrors.delete(key);
      }
    }
  }

  initializeContainer() {
    this.container = document.getElementById("toast-container");

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  }

  setupStyles() {
    if (document.getElementById("toast-styles")) return;

    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        pointer-events: none;
      }

      .toast {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 10px;
        padding: 16px;
        pointer-events: auto;
        transform: translateX(100%);
        transition: all 0.3s ease;
        border-left: 4px solid #007acc;
        min-height: 60px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }

      .toast.show {
        transform: translateX(0);
      }

      .toast.hide {
        transform: translateX(100%);
        opacity: 0;
      }

      /* Types de toast */
      .toast.error {
        border-left-color: #e74c3c;
        background: #fff5f5;
      }

      .toast.warning {
        border-left-color: #f39c12;
        background: #fffbf0;
      }

      .toast.success {
        border-left-color: #27ae60;
        background: #f0fff4;
      }

      .toast.info {
        border-left-color: #3498db;
        background: #f0f9ff;
      }

      .toast.critical {
        border-left-color: #922b21;
        background: #f8d7da;
        box-shadow: 0 4px 20px rgba(234, 67, 53, 0.2);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { box-shadow: 0 4px 20px rgba(234, 67, 53, 0.2); }
        50% { box-shadow: 0 4px 30px rgba(234, 67, 53, 0.4); }
        100% { box-shadow: 0 4px 20px rgba(234, 67, 53, 0.2); }
      }

      .toast-content {
        flex: 1;
      }

      .toast-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: #2c3e50;
      }

      .toast-message {
        color: #5a6c7d;
        margin-bottom: 8px;
      }

      .toast-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      .toast-btn {
        background: none;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .toast-btn:hover {
        background: #f8f9fa;
      }

      .toast-btn.primary {
        background: #007acc;
        border-color: #007acc;
        color: white;
      }

      .toast-btn.primary:hover {
        background: #005a9e;
      }

      .toast-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        cursor: pointer;
        color: #888;
        font-size: 16px;
        padding: 4px;
        border-radius: 2px;
        transition: color 0.2s ease;
      }

      .toast-close:hover {
        color: #333;
        background: rgba(0, 0, 0, 0.1);
      }

      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(0, 122, 204, 0.3);
        border-radius: 0 0 8px 8px;
        transition: width linear;
      }

      .toast-timestamp {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .toast-container {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }

        .toast {
          transform: translateY(-100%);
        }

        .toast.show {
          transform: translateY(0);
        }

        .toast.hide {
          transform: translateY(-100%);
        }
      }
    `;

    document.head.appendChild(style);
  }

  generateId() {
    return (
      "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getToastType(severity, category) {
    if (severity === "critical") return "critical";
    if (severity === "high") return "error";
    if (severity === "medium") return "warning";
    if (category === "user_action") return "info";
    return "info";
  }

  createToast(options) {
    const {
      id,
      title,
      message,
      type = "info",
      severity = "medium",
      duration = this.defaultDuration,
      actions = [],
      showProgress = true,
      timestamp,
    } = options;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.id = id;

    const timeStr = timestamp ? this.formatTimestamp(timestamp) : "";

    toast.innerHTML = `
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div class="toast-message">${message}</div>
        ${
          actions.length > 0
            ? `
          <div class="toast-actions">
            ${actions
              .map(
                (action) =>
                  `<button class="toast-btn ${action.primary ? "primary" : ""}" 
                       onclick="window.toastManager.handleAction('${id}', '${action.action}')">${action.label}</button>`,
              )
              .join("")}
          </div>
        `
            : ""
        }
        ${timeStr ? `<div class="toast-timestamp">${timeStr}</div>` : ""}
      </div>
      <button class="toast-close" onclick="window.toastManager.remove('${id}')">×</button>
      ${showProgress && duration > 0 ? '<div class="toast-progress"></div>' : ""}
    `;

    return toast;
  }

  show(options) {
    const id = options.id || this.generateId();

    if (this.toasts.size >= this.maxToasts) {
      const oldestId = this.toasts.keys().next().value;
      this.remove(oldestId);
    }

    const toastOptions = { ...options, id };
    const toast = this.createToast(toastOptions);

    this.container.appendChild(toast);
    this.toasts.set(id, {
      element: toast,
      options: toastOptions,
      timeoutId: null,
    });

    requestAnimationFrame(() => {
      toast.classList.add("show");

      if (toastOptions.duration > 0) {
        this.setAutoRemove(id, toastOptions.duration);
      }
    });

    return id;
  }

  setAutoRemove(id, duration) {
    const toastData = this.toasts.get(id);
    if (!toastData) return;

    const progressBar = toastData.element.querySelector(".toast-progress");
    if (progressBar) {
      progressBar.style.width = "100%";
      progressBar.style.transition = `width ${duration}ms linear`;

      requestAnimationFrame(() => {
        progressBar.style.width = "0%";
      });
    }

    toastData.timeoutId = setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id) {
    const toastData = this.toasts.get(id);
    if (!toastData) return;

    if (toastData.timeoutId) {
      clearTimeout(toastData.timeoutId);
    }

    toastData.element.classList.add("hide");

    setTimeout(() => {
      if (toastData.element.parentNode) {
        toastData.element.parentNode.removeChild(toastData.element);
      }
      this.toasts.delete(id);
    }, 300);
  }

  handleAction(toastId, action) {
    const toastData = this.toasts.get(toastId);
    if (!toastData) return;

    const event = new CustomEvent("toastAction", {
      detail: {
        toastId,
        action,
        options: toastData.options,
      },
    });

    document.dispatchEvent(event);

    this.remove(toastId);
  }

  clear() {
    for (const id of this.toasts.keys()) {
      this.remove(id);
    }
  }

  error(message, options = {}) {
    return this.show({
      ...options,
      message,
      type: "error",
      title: options.title || "Erreur",
      duration: options.duration || 7000,
    });
  }

  warning(message, options = {}) {
    return this.show({
      ...options,
      message,
      type: "warning",
      title: options.title || "Attention",
      duration: options.duration || 5000,
    });
  }

  success(message, options = {}) {
    return this.show({
      ...options,
      message,
      type: "success",
      title: options.title || "Succès",
      duration: options.duration || 4000,
    });
  }

  info(message, options = {}) {
    return this.show({
      ...options,
      message,
      type: "info",
      title: options.title || "Information",
      duration: options.duration || 5000,
    });
  }

  showSystemError(errorData) {
    const dedupeKey = `${errorData.code || "unknown"}_${errorData.message}`;
    const now = Date.now();

    if (this.recentErrors.has(dedupeKey)) {
      const lastShown = this.recentErrors.get(dedupeKey);
      if (now - lastShown < 3000) {
        console.log(`Toast dupliqué évité pour: ${dedupeKey}`);
        return;
      }
    }

    this.recentErrors.set(dedupeKey, now);

    const type = this.getToastType(errorData.severity, errorData.category);

    const actions = [];

    if (
      errorData.category === "websocket" ||
      errorData.category === "authentication"
    ) {
      actions.push({
        label: "Reconnexion",
        action: "reconnect",
        primary: true,
      });
    }

    return this.show({
      id: errorData.id,
      message: errorData.message,
      type: type,
      severity: errorData.severity,
      timestamp: errorData.timestamp,
      duration: type === "critical" ? 0 : type === "error" ? 8000 : 5000,
      actions: actions,
    });
  }
}

if (typeof window !== "undefined") {
  window.toastManager = new ToastManager();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = ToastManager;
}
