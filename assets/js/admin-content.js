(function () {
  let userRole = "guest";

  function showCmsMessage(text, type) {
    const el = document.getElementById("cms-message");
    if (!el) {
      return;
    }
    const styles = {
      error: "border-red-500/40 bg-red-500/10 text-red-200",
      success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
      info: "border-blue-500/40 bg-blue-500/10 text-blue-100"
    };
    el.className = `mb-6 rounded-xl border px-4 py-3 text-sm ${styles[type] || styles.info}`;
    el.textContent = text;
    el.hidden = !text;
  }

  function toLocalInputValue(iso) {
    if (!iso) {
      return "";
    }
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fromLocalInput(str) {
    if (!str) {
      return null;
    }
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  function switchTab(name) {
    document.querySelectorAll(".cms-tab").forEach((btn) => {
      const on = btn.getAttribute("data-tab") === name;
      btn.classList.toggle("tab-active", on);
      btn.classList.toggle("text-gray-400", !on);
    });
    document.querySelectorAll(".cms-panel").forEach((p) => {
      p.classList.toggle("hidden", !p.id || p.id !== `panel-${name}`);
    });

    if (name === "audit" && userRole === "head") {
      loadAudit();
    }
  }

  async function apiAdmin(path, options = {}) {
    return window.StartInnova.apiFetch(`/api/admin${path}`, options);
  }

  async function loadEvents() {
    const { data } = await apiAdmin("/events");
    const tbody = document.getElementById("tbody-events");
    tbody.innerHTML = "";
    (data || []).forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "border-t border-white/10";
      tr.innerHTML = `<td class="px-4 py-3 text-white">${escape(row.title)}</td>
        <td class="px-4 py-3 text-gray-400 text-xs">${new Date(row.starts_at).toLocaleString("vi-VN")}</td>
        <td class="px-4 py-3">${row.is_published ? "✓" : "—"}</td>
        <td class="px-4 py-3"><button type="button" class="text-blue-400 hover:text-white text-sm mr-2" data-act="edit">Sửa</button>
        <button type="button" class="text-red-400 hover:text-red-200 text-sm" data-act="del">Xóa</button></td>`;
      tr.querySelector('[data-act="edit"]').addEventListener("click", () => {
        document.getElementById("event-edit-id").value = row.id;
        document.getElementById("event-title").value = row.title || "";
        document.getElementById("event-desc").value = row.description || "";
        document.getElementById("event-starts").value = toLocalInputValue(row.starts_at);
        document.getElementById("event-ends").value = row.ends_at ? toLocalInputValue(row.ends_at) : "";
        document.getElementById("event-link").value = row.external_link || "";
        document.getElementById("event-sort").value = row.sort_order ?? 0;
        document.getElementById("event-published").checked = !!row.is_published;
      });
      tr.querySelector('[data-act="del"]').addEventListener("click", async () => {
        if (!window.confirm("Xóa sự kiện này?")) {
          return;
        }
        await apiAdmin(`/events/${row.id}`, { method: "DELETE" });
        showCmsMessage("Đã xóa sự kiện.", "success");
        await loadEvents();
      });
      tbody.appendChild(tr);
    });
  }

  function escape(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  async function loadAnnouncements() {
    const { data } = await apiAdmin("/announcements");
    const tbody = document.getElementById("tbody-announcements");
    tbody.innerHTML = "";
    (data || []).forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "border-t border-white/10";
      const aud = row.audience === "member" ? "Nội bộ" : "Công khai";
      tr.innerHTML = `<td class="px-4 py-3 text-white">${escape(row.title)}</td>
        <td class="px-4 py-3 text-gray-400">${aud}</td>
        <td class="px-4 py-3">${row.is_published ? "✓" : "—"}</td>
        <td class="px-4 py-3"><button type="button" class="text-blue-400 text-sm mr-2" data-e>Sửa</button>
        <button type="button" class="text-red-400 text-sm" data-d>Xóa</button></td>`;
      tr.querySelector("[data-e]").addEventListener("click", () => {
        document.getElementById("ann-edit-id").value = row.id;
        document.getElementById("ann-title").value = row.title || "";
        document.getElementById("ann-body").value = row.body || "";
        document.getElementById("ann-audience").value = row.audience || "public";
        document.getElementById("ann-sort").value = row.sort_order ?? 0;
        document.getElementById("ann-published").checked = !!row.is_published;
      });
      tr.querySelector("[data-d]").addEventListener("click", async () => {
        if (!window.confirm("Xóa thông báo?")) {
          return;
        }
        await apiAdmin(`/announcements/${row.id}`, { method: "DELETE" });
        showCmsMessage("Đã xóa.", "success");
        await loadAnnouncements();
      });
      tbody.appendChild(tr);
    });
  }

  async function loadProjects() {
    const { data } = await apiAdmin("/projects");
    const tbody = document.getElementById("tbody-projects");
    tbody.innerHTML = "";
    (data || []).forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "border-t border-white/10";
      tr.innerHTML = `<td class="px-4 py-3 text-white">${escape(row.title)}</td>
        <td class="px-4 py-3">${row.is_published ? "✓" : "—"}</td>
        <td class="px-4 py-3"><button type="button" class="text-blue-400 text-sm mr-2" data-e>Sửa</button>
        <button type="button" class="text-red-400 text-sm" data-d>Xóa</button></td>`;
      tr.querySelector("[data-e]").addEventListener("click", () => {
        document.getElementById("proj-edit-id").value = row.id;
        document.getElementById("proj-title").value = row.title || "";
        document.getElementById("proj-summary").value = row.summary || "";
        document.getElementById("proj-image").value = row.image_url || "";
        document.getElementById("proj-link").value = row.external_link || "";
        document.getElementById("proj-sort").value = row.sort_order ?? 0;
        document.getElementById("proj-published").checked = !!row.is_published;
      });
      tr.querySelector("[data-d]").addEventListener("click", async () => {
        if (!window.confirm("Xóa dự án?")) {
          return;
        }
        await apiAdmin(`/projects/${row.id}`, { method: "DELETE" });
        showCmsMessage("Đã xóa.", "success");
        await loadProjects();
      });
      tbody.appendChild(tr);
    });
  }

  async function loadPartners() {
    const { data } = await apiAdmin("/partners");
    const tbody = document.getElementById("tbody-partners");
    tbody.innerHTML = "";
    (data || []).forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "border-t border-white/10";
      tr.innerHTML = `<td class="px-4 py-3 text-white">${escape(row.name)}</td>
        <td class="px-4 py-3">${row.is_published ? "✓" : "—"}</td>
        <td class="px-4 py-3"><button type="button" class="text-blue-400 text-sm mr-2" data-e>Sửa</button>
        <button type="button" class="text-red-400 text-sm" data-d>Xóa</button></td>`;
      tr.querySelector("[data-e]").addEventListener("click", () => {
        document.getElementById("partner-edit-id").value = row.id;
        document.getElementById("partner-name").value = row.name || "";
        document.getElementById("partner-logo").value = row.logo_url || "";
        document.getElementById("partner-link").value = row.external_link || "";
        document.getElementById("partner-sort").value = row.sort_order ?? 0;
        document.getElementById("partner-published").checked = !!row.is_published;
      });
      tr.querySelector("[data-d]").addEventListener("click", async () => {
        if (!window.confirm("Xóa đối tác?")) {
          return;
        }
        await apiAdmin(`/partners/${row.id}`, { method: "DELETE" });
        showCmsMessage("Đã xóa.", "success");
        await loadPartners();
      });
      tbody.appendChild(tr);
    });
  }

  async function loadPosts() {
    const { data } = await apiAdmin("/posts");
    const tbody = document.getElementById("tbody-posts");
    tbody.innerHTML = "";
    (data || []).forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "border-t border-white/10";
      tr.innerHTML = `<td class="px-4 py-3 text-white">${escape(row.title)}</td>
        <td class="px-4 py-3 text-gray-400 text-xs">${escape(row.slug)}</td>
        <td class="px-4 py-3">${row.is_published ? "✓" : "—"}</td>
        <td class="px-4 py-3"><button type="button" class="text-blue-400 text-sm mr-2" data-e>Sửa</button>
        <button type="button" class="text-red-400 text-sm" data-d>Xóa</button></td>`;
      tr.querySelector("[data-e]").addEventListener("click", () => {
        document.getElementById("post-edit-id").value = row.id;
        document.getElementById("post-title").value = row.title || "";
        document.getElementById("post-slug").value = row.slug || "";
        document.getElementById("post-excerpt").value = row.excerpt || "";
        document.getElementById("post-body").value = row.body_md || "";
        document.getElementById("post-sort").value = row.sort_order ?? 0;
        document.getElementById("post-published").checked = !!row.is_published;
      });
      tr.querySelector("[data-d]").addEventListener("click", async () => {
        if (!window.confirm("Xóa bài viết?")) {
          return;
        }
        await apiAdmin(`/posts/${row.id}`, { method: "DELETE" });
        showCmsMessage("Đã xóa.", "success");
        await loadPosts();
      });
      tbody.appendChild(tr);
    });
  }

  async function loadAudit() {
    const { data } = await apiAdmin("/audit-log");
    const tbody = document.getElementById("tbody-audit");
    tbody.innerHTML = "";
    (data || []).forEach((row) => {
      const tr = document.createElement("tr");
      tr.className = "border-t border-white/10";
      tr.innerHTML = `<td class="px-4 py-3 text-gray-400 text-xs">${new Date(row.created_at).toLocaleString("vi-VN")}</td>
        <td class="px-4 py-3">${escape(row.action_type)}</td>
        <td class="px-4 py-3 text-xs text-gray-500">${escape(row.target_key || "")}</td>`;
      tbody.appendChild(tr);
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("logout-button")?.addEventListener("click", window.StartInnova.signOut);

    document.querySelectorAll(".cms-tab").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")));
    });

    try {
      await window.StartInnova.requireSession();
      const profile = await window.StartInnova.apiFetch("/api/users/public-profile");
      userRole = profile.user.role;
      if (!["head", "admin"].includes(userRole)) {
        showCmsMessage("Tài khoản không có quyền quản trị nội dung.", "error");
        return;
      }

      if (userRole !== "head") {
        document.querySelector(".cms-tab[data-tab=\"audit\"]")?.remove();
      }

      await Promise.all([loadEvents(), loadAnnouncements(), loadProjects(), loadPartners(), loadPosts()]);

      document.getElementById("form-event")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("event-edit-id").value;
        const starts = fromLocalInput(document.getElementById("event-starts").value);
        if (!starts) {
          showCmsMessage("Thời gian bắt đầu không hợp lệ.", "error");
          return;
        }
        const body = {
          title: document.getElementById("event-title").value,
          description: document.getElementById("event-desc").value || null,
          starts_at: starts,
          ends_at: fromLocalInput(document.getElementById("event-ends").value),
          external_link: document.getElementById("event-link").value || null,
          sort_order: Number(document.getElementById("event-sort").value) || 0,
          is_published: document.getElementById("event-published").checked
        };
        if (id) {
          await apiAdmin(`/events/${id}`, { method: "PUT", body });
        } else {
          await apiAdmin("/events", { method: "POST", body });
        }
        showCmsMessage("Đã lưu sự kiện.", "success");
        document.getElementById("form-event").reset();
        document.getElementById("event-edit-id").value = "";
        await loadEvents();
      });

      document.getElementById("event-reset")?.addEventListener("click", () => {
        document.getElementById("form-event").reset();
        document.getElementById("event-edit-id").value = "";
      });

      document.getElementById("form-announcement")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("ann-edit-id").value;
        const body = {
          title: document.getElementById("ann-title").value,
          body: document.getElementById("ann-body").value || null,
          audience: document.getElementById("ann-audience").value,
          sort_order: Number(document.getElementById("ann-sort").value) || 0,
          is_published: document.getElementById("ann-published").checked
        };
        if (id) {
          await apiAdmin(`/announcements/${id}`, { method: "PUT", body });
        } else {
          await apiAdmin("/announcements", { method: "POST", body });
        }
        showCmsMessage("Đã lưu thông báo.", "success");
        document.getElementById("form-announcement").reset();
        document.getElementById("ann-edit-id").value = "";
        await loadAnnouncements();
      });

      document.getElementById("ann-reset")?.addEventListener("click", () => {
        document.getElementById("form-announcement").reset();
        document.getElementById("ann-edit-id").value = "";
      });

      document.getElementById("form-project")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("proj-edit-id").value;
        const body = {
          title: document.getElementById("proj-title").value,
          summary: document.getElementById("proj-summary").value || null,
          image_url: document.getElementById("proj-image").value || null,
          external_link: document.getElementById("proj-link").value || null,
          sort_order: Number(document.getElementById("proj-sort").value) || 0,
          is_published: document.getElementById("proj-published").checked
        };
        if (id) {
          await apiAdmin(`/projects/${id}`, { method: "PUT", body });
        } else {
          await apiAdmin("/projects", { method: "POST", body });
        }
        showCmsMessage("Đã lưu dự án.", "success");
        document.getElementById("form-project").reset();
        document.getElementById("proj-edit-id").value = "";
        await loadProjects();
      });

      document.getElementById("proj-reset")?.addEventListener("click", () => {
        document.getElementById("form-project").reset();
        document.getElementById("proj-edit-id").value = "";
      });

      document.getElementById("form-partner")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("partner-edit-id").value;
        const body = {
          name: document.getElementById("partner-name").value,
          logo_url: document.getElementById("partner-logo").value || null,
          external_link: document.getElementById("partner-link").value || null,
          sort_order: Number(document.getElementById("partner-sort").value) || 0,
          is_published: document.getElementById("partner-published").checked
        };
        if (id) {
          await apiAdmin(`/partners/${id}`, { method: "PUT", body });
        } else {
          await apiAdmin("/partners", { method: "POST", body });
        }
        showCmsMessage("Đã lưu đối tác.", "success");
        document.getElementById("form-partner").reset();
        document.getElementById("partner-edit-id").value = "";
        await loadPartners();
      });

      document.getElementById("partner-reset")?.addEventListener("click", () => {
        document.getElementById("form-partner").reset();
        document.getElementById("partner-edit-id").value = "";
      });

      document.getElementById("form-post")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("post-edit-id").value;
        const body = {
          title: document.getElementById("post-title").value,
          slug: document.getElementById("post-slug").value || undefined,
          excerpt: document.getElementById("post-excerpt").value || null,
          body_md: document.getElementById("post-body").value || null,
          sort_order: Number(document.getElementById("post-sort").value) || 0,
          is_published: document.getElementById("post-published").checked
        };
        if (id) {
          await apiAdmin(`/posts/${id}`, { method: "PUT", body });
        } else {
          await apiAdmin("/posts", { method: "POST", body });
        }
        showCmsMessage("Đã lưu bài viết.", "success");
        document.getElementById("form-post").reset();
        document.getElementById("post-edit-id").value = "";
        await loadPosts();
      });

      document.getElementById("post-reset")?.addEventListener("click", () => {
        document.getElementById("form-post").reset();
        document.getElementById("post-edit-id").value = "";
      });

      document.getElementById("form-broadcast")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const segment =
          document.getElementById("broadcast-segment").value === "all" ? "all" : "members";
        const body = {
          subject: document.getElementById("broadcast-subject").value,
          html: document.getElementById("broadcast-html").value,
          segment
        };
        const res = await apiAdmin("/broadcast", { method: "POST", body });
        showCmsMessage(`Đã gửi tới ${res.sentTo} địa chỉ.`, "success");
      });

      switchTab("events");
    } catch (err) {
      showCmsMessage(err.message, "error");
    }
  });
})();
