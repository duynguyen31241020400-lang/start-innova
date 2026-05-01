(function () {
  const missingConfigMessage =
    "Missing Supabase frontend config. Edit frontend-config.js with your Supabase URL and anon key.";

  function getConfig() {
    return window.START_INNOVA_CONFIG || {};
  }

  function isPlaceholder(value) {
    return !value || value.includes("your-") || value.includes("your_");
  }

  function getClient() {
    const config = getConfig();

    if (isPlaceholder(config.supabaseUrl) || isPlaceholder(config.supabaseAnonKey)) {
      throw new Error(missingConfigMessage);
    }

    if (!window.__startInnovaSupabase) {
      window.__startInnovaSupabase = window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseAnonKey
      );
    }

    return window.__startInnovaSupabase;
  }

  function getApiBaseUrl() {
    const config = getConfig();
    const configuredUrl = config.apiBaseUrl;

    if (configuredUrl) {
      return configuredUrl.replace(/\/$/, "");
    }

    if (window.location.protocol.startsWith("http")) {
      return window.location.origin;
    }

    return "http://localhost:5000";
  }

  async function getSession() {
    const client = getClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  async function requireSession() {
    const session = await getSession();

    if (!session) {
      window.location.href = "login.html";
      return null;
    }

    return session;
  }

  async function apiFetch(path, options = {}) {
    const session = await requireSession();

    if (!session) {
      return null;
    }

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${session.access_token}`);

    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
      body:
        options.body && typeof options.body !== "string"
          ? JSON.stringify(options.body)
          : options.body
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof payload === "string" ? payload : payload.error || payload.message;
      const error = new Error(message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  async function signOut() {
    const client = getClient();
    await client.auth.signOut();
    window.location.href = "login.html";
  }

  function setText(id, value) {
    const node = document.getElementById(id);

    if (node) {
      node.textContent = value == null || value === "" ? "-" : value;
    }
  }

  function showMessage(id, message, type = "info") {
    const node = document.getElementById(id);

    if (!node) {
      return;
    }

    const styles = {
      error: "border-red-500/30 bg-red-500/10 text-red-200",
      success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      info: "border-blue-500/30 bg-blue-500/10 text-blue-100",
      warning: "border-amber-500/30 bg-amber-500/10 text-amber-100"
    };

    node.className = `rounded-xl border px-4 py-3 text-sm ${styles[type] || styles.info}`;
    node.textContent = message;
    node.hidden = !message;
  }

  function setLoading(button, isLoading, loadingText) {
    if (!button) {
      return;
    }

    if (!button.dataset.defaultText) {
      button.dataset.defaultText = button.textContent.trim();
    }

    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : button.dataset.defaultText;
    button.classList.toggle("opacity-70", isLoading);
    button.classList.toggle("cursor-not-allowed", isLoading);
  }

  window.StartInnova = {
    apiFetch,
    getClient,
    getSession,
    requireSession,
    setLoading,
    setText,
    showMessage,
    signOut
  };
})();
