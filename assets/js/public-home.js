(function () {
  function apiOrigin() {
    if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
      return window.location.origin;
    }
    return "";
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function fmtDate(iso) {
    if (!iso) {
      return "";
    }
    try {
      return new Date(iso).toLocaleString("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch {
      return iso;
    }
  }

  async function loadSummary() {
    const status = document.getElementById("public-summary-status");
    try {
      const res = await fetch(`${apiOrigin()}/api/public/summary`);
      const payload = res.ok ? await res.json() : null;

      if (!res.ok) {
        throw new Error((payload && payload.error) || res.statusText);
      }

      if (status) {
        status.textContent = "";
        status.classList.add("hidden");
      }

      renderAnnouncements(payload.announcementsPublic || []);
      renderEvents(payload.events || []);
      renderProjects(payload.projects || []);
      renderPartners(payload.partners || []);
      renderPosts(payload.posts || []);
    } catch (e) {
      if (status) {
        status.textContent =
          "Không tải được nội dung động. Hãy chạy migration SQL trên Supabase và kiểm tra API.";
        status.classList.remove("hidden");
      }
      console.error(e);
    }
  }

  function showBlock(id, show) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle("hidden", !show);
    }
  }

  function renderAnnouncements(items) {
    const wrap = document.getElementById("public-announcements-list");
    if (!wrap) {
      return;
    }
    wrap.innerHTML = "";
    if (!items.length) {
      showBlock("block-announcements", false);
      return;
    }
    showBlock("block-announcements", true);
    items.forEach((a) => {
      const card = document.createElement("article");
      card.className =
        "rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left";
      card.innerHTML = `<h3 class="text-lg font-semibold text-white">${escapeHtml(a.title)}</h3>
        <p class="mt-2 text-sm text-gray-400 whitespace-pre-wrap">${escapeHtml(a.body || "")}</p>`;
      wrap.appendChild(card);
    });
  }

  function renderEvents(items) {
    const list = document.getElementById("public-events-list");
    if (!list) {
      return;
    }
    list.innerHTML = "";
    if (!items.length) {
      showBlock("block-events", false);
      return;
    }
    showBlock("block-events", true);
    items.forEach((ev) => {
      const li = document.createElement("li");
      li.className =
        "rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between";
      const link = ev.external_link
        ? `<a href="${escapeHtml(ev.external_link)}" target="_blank" rel="noopener noreferrer" class="text-blue-400 text-sm shrink-0">Chi tiết →</a>`
        : "";
      li.innerHTML = `<div>
          <p class="font-semibold text-white">${escapeHtml(ev.title)}</p>
          <p class="text-sm text-gray-400">${fmtDate(ev.starts_at)}${ev.description ? ` · ${escapeHtml(ev.description)}` : ""}</p>
        </div>${link}`;
      list.appendChild(li);
    });
  }

  function renderProjects(items) {
    const wrap = document.getElementById("public-projects-list");
    if (!wrap) {
      return;
    }
    wrap.innerHTML = "";
    if (!items.length) {
      showBlock("block-projects", false);
      return;
    }
    showBlock("block-projects", true);
    items.forEach((p) => {
      const card = document.createElement("article");
      card.className =
        "rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col";
      const img = p.image_url
        ? `<img src="${escapeHtml(p.image_url)}" alt="" class="h-40 w-full object-cover">`
        : "";
      const link = p.external_link
        ? `<a href="${escapeHtml(p.external_link)}" target="_blank" rel="noopener noreferrer" class="text-blue-400 text-sm mt-auto inline-block">Xem thêm</a>`
        : "";
      card.innerHTML = `${img}<div class="p-5 flex flex-col gap-2 flex-1">
          <h3 class="text-lg font-semibold text-white">${escapeHtml(p.title)}</h3>
          <p class="text-sm text-gray-400 flex-1">${escapeHtml(p.summary || "")}</p>${link}</div>`;
      wrap.appendChild(card);
    });
  }

  function renderPartners(items) {
    const strip = document.getElementById("public-partners-strip");
    if (!strip) {
      return;
    }
    strip.innerHTML = "";
    if (!items.length) {
      showBlock("block-partners", false);
      return;
    }
    showBlock("block-partners", true);
    items.forEach((p) => {
      const wrap = document.createElement("div");
      wrap.className = "flex flex-col items-center gap-2 max-w-[140px] text-center";
      const logo = p.logo_url
        ? `<img src="${escapeHtml(p.logo_url)}" alt="${escapeHtml(p.name)}" class="h-12 md:h-14 w-auto object-contain opacity-90">`
        : `<span class="text-gray-500 text-sm">${escapeHtml(p.name)}</span>`;
      const href = p.external_link ? escapeHtml(p.external_link) : null;
      wrap.innerHTML = href
        ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="hover:opacity-100 opacity-80">${logo}<span class="text-xs text-gray-500">${escapeHtml(p.name)}</span></a>`
        : `${logo}<span class="text-xs text-gray-500">${escapeHtml(p.name)}</span>`;
      strip.appendChild(wrap);
    });
  }

  function renderPosts(items) {
    const wrap = document.getElementById("public-posts-list");
    if (!wrap) {
      return;
    }
    wrap.innerHTML = "";
    if (!items.length) {
      showBlock("block-posts", false);
      return;
    }
    showBlock("block-posts", true);
    items.forEach((post) => {
      const card = document.createElement("article");
      card.className = "rounded-2xl border border-white/10 bg-white/[0.03] p-6";
      const anchor = `#post-${escapeHtml(post.slug)}`;
      card.innerHTML = `<h3 class="text-lg font-semibold text-white" id="post-${escapeHtml(post.slug)}">${escapeHtml(post.title)}</h3>
        <p class="mt-2 text-sm text-gray-400">${escapeHtml(post.excerpt || "")}</p>
        <p class="mt-3 text-xs text-gray-600">${fmtDate(post.published_at)}</p>
        <div class="mt-4 text-sm text-gray-300 prose prose-invert max-w-none whitespace-pre-wrap">${escapeHtml(post.body_md || "").slice(0, 1200)}${(post.body_md || "").length > 1200 ? "…" : ""}</div>`;
      wrap.appendChild(card);
    });
  }

  document.addEventListener("DOMContentLoaded", loadSummary);
})();
