(function () {
  let currentRole = "guest";

  const roleLabels = {
    head: "Head",
    admin: "Admin",
    member: "Member",
    guest: "Khách",
    customer: "Khách hàng"
  };

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

  function renderAnnouncements(items, listEl) {
    listEl.innerHTML = "";
    items.forEach((a) => {
      const li = document.createElement("li");
      li.className =
        "rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 md:col-span-2";
      li.innerHTML = `<p class="font-semibold text-white">${escapeHtml(a.title)}</p>
        <p class="mt-1 text-sm text-gray-400 whitespace-pre-wrap">${escapeHtml(a.body || "")}</p>`;
      listEl.appendChild(li);
    });
  }

  async function loadMemberEvents(role) {
    const section = document.getElementById("member-events-section");
    const list = document.getElementById("member-events-list");
    const msg = document.getElementById("events-message");

    if (!section || !list) {
      return;
    }

    if (!["head", "admin", "member"].includes(role)) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");

    try {
      const clubData = await window.StartInnova.apiFetch("/api/users/club-data");
      const rsvpPayload = await window.StartInnova.apiFetch("/api/events/rsvp-ids");
      const rsvpSet = new Set(rsvpPayload.eventIds || []);
      const events = clubData.upcomingEvents || [];

      list.innerHTML = "";

      if (!events.length) {
        window.StartInnova.showMessage(
          "events-message",
          "Chưa có sự kiện sắp tới được đăng.",
          "info"
        );
        return;
      }

      if (msg) {
        msg.hidden = true;
      }

      events.forEach((ev) => {
        const li = document.createElement("li");
        li.className =
          "flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between";
        const registered = rsvpSet.has(ev.id);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = registered
          ? "rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          : "rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white";
        btn.textContent = registered ? "Đã đăng ký — hủy" : "Đăng ký tham gia";

        btn.addEventListener("click", async () => {
          window.StartInnova.setLoading(btn, true, "Đang xử lý…");
          try {
            if (registered) {
              await window.StartInnova.apiFetch(`/api/events/${ev.id}/rsvp`, { method: "DELETE" });
            } else {
              await window.StartInnova.apiFetch(`/api/events/${ev.id}/rsvp`, { method: "POST" });
            }
            await loadMemberEvents(currentRole);
          } catch (e) {
            window.StartInnova.showMessage("events-message", e.message, "error");
          } finally {
            window.StartInnova.setLoading(btn, false);
          }
        });

        const left = document.createElement("div");
        left.innerHTML = `<p class="font-semibold text-white">${escapeHtml(ev.title)}</p>
          <p class="text-sm text-gray-400">${fmtDate(ev.starts_at)}</p>
          ${ev.description ? `<p class="mt-1 text-sm text-gray-500">${escapeHtml(ev.description)}</p>` : ""}`;

        const actions = document.createElement("div");
        actions.className = "flex shrink-0 flex-wrap gap-2";
        if (ev.external_link) {
          const a = document.createElement("a");
          a.href = ev.external_link;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.className = "rounded-lg border border-white/15 px-3 py-2 text-sm text-blue-300";
          a.textContent = "Chi tiết";
          actions.appendChild(a);
        }
        actions.appendChild(btn);

        li.appendChild(left);
        li.appendChild(actions);
        list.appendChild(li);
      });
    } catch (e) {
      section.classList.add("hidden");
      console.warn(e);
    }
  }

  async function loadClubInternal(role) {
    const list = document.getElementById("club-data-list");
    const clubSection = document.getElementById("club-section");

    if (!["head", "admin", "member"].includes(role)) {
      if (clubSection) {
        clubSection.classList.add("opacity-60");
      }
      if (list) {
        list.innerHTML = "";
      }
      const cm = document.getElementById("club-message");
      if (cm) {
        cm.hidden = true;
      }
      return;
    }

    if (clubSection) {
      clubSection.classList.remove("opacity-60");
    }

    try {
      const clubData = await window.StartInnova.apiFetch("/api/users/club-data");
      window.StartInnova.showMessage("club-message", clubData.message, "success");
      renderAnnouncements(clubData.announcements || [], list);
    } catch (error) {
      if (error.status === 403) {
        window.StartInnova.showMessage(
          "club-message",
          "Tài khoản hiện tại chưa có quyền xem dữ liệu nội bộ.",
          "warning"
        );
      } else {
        window.StartInnova.showMessage("club-message", error.message, "error");
      }
    }
  }

  function fillProfileForm(user) {
    const fn = document.getElementById("field-full-name");
    const mssv = document.getElementById("field-mssv");
    const dep = document.getElementById("field-department");
    const av = document.getElementById("field-avatar");
    if (fn) {
      fn.value = user.full_name || "";
    }
    if (mssv) {
      mssv.value = user.mssv || "";
    }
    if (dep) {
      dep.value = user.department || "";
    }
    if (av) {
      av.value = user.avatar_url || "";
    }
    const img = document.getElementById("profile-avatar");
    if (img && user.avatar_url) {
      img.src = user.avatar_url;
      img.alt = user.full_name || "Avatar";
      img.classList.remove("hidden");
    } else if (img) {
      img.classList.add("hidden");
    }
  }

  async function loadDashboard() {
    try {
      await window.StartInnova.requireSession();

      const profilePayload = await window.StartInnova.apiFetch("/api/users/public-profile");
      const user = profilePayload.user || {};
      const role = user.role || "guest";
      currentRole = role;

      window.StartInnova.setText("profile-email", user.email);
      window.StartInnova.setText(
        "profile-name",
        user.full_name || user.email
      );
      window.StartInnova.setText("profile-role", roleLabels[role] || role);
      window.StartInnova.setText("profile-id", user.id);
      fillProfileForm(user);

      const guestBanner = document.getElementById("guest-banner");
      if (guestBanner) {
        guestBanner.hidden = !["guest", "customer"].includes(role);
      }

      const adminLink = document.getElementById("admin-link");
      if (adminLink && ["head", "admin"].includes(role)) {
        adminLink.hidden = false;
      }

      const adminContentLink = document.getElementById("admin-content-link");
      if (adminContentLink && ["head", "admin"].includes(role)) {
        adminContentLink.hidden = false;
      }

      await loadMemberEvents(role);
      await loadClubInternal(role);
    } catch (error) {
      window.StartInnova.showMessage("dashboard-message", error.message, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-button");

    if (logoutButton) {
      logoutButton.addEventListener("click", window.StartInnova.signOut);
    }

    const form = document.getElementById("profile-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const body = {
          full_name: fd.get("full_name") || "",
          mssv: fd.get("mssv") || "",
          department: fd.get("department") || "",
          avatar_url: fd.get("avatar_url") || ""
        };
        const msg = document.getElementById("profile-form-message");
        try {
          await window.StartInnova.apiFetch("/api/users/me", {
            method: "PATCH",
            body
          });
          if (msg) {
            msg.textContent = "Đã lưu hồ sơ.";
            msg.className = "mt-4 text-sm text-emerald-300";
            msg.hidden = false;
          }
          await loadDashboard();
        } catch (err) {
          if (msg) {
            msg.textContent = err.message;
            msg.className = "mt-4 text-sm text-red-300";
            msg.hidden = false;
          }
        }
      });
    }

    loadDashboard();
  });
})();
