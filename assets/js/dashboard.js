(function () {
  const roleLabels = {
    head: "Head",
    admin: "Admin",
    member: "Member",
    guest: "Guest",
    customer: "Customer"
  };

  function renderClubData(items) {
    const list = document.getElementById("club-data-list");

    if (!list) {
      return;
    }

    list.innerHTML = "";

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3";
      li.textContent = item.info;
      list.appendChild(li);
    });
  }

  function renderProfile(payload) {
    const user = payload.user || {};
    const metadata = user.user_metadata || {};
    const role = user.role || "guest";

    window.StartInnova.setText("profile-email", user.email);
    window.StartInnova.setText("profile-name", metadata.full_name || user.email);
    window.StartInnova.setText("profile-role", roleLabels[role] || role);
    window.StartInnova.setText("profile-id", user.id);

    const adminLink = document.getElementById("admin-link");

    if (adminLink && ["head", "admin"].includes(role)) {
      adminLink.hidden = false;
    }
  }

  async function loadDashboard() {
    try {
      await window.StartInnova.requireSession();

      const profile = await window.StartInnova.apiFetch("/api/users/public-profile");
      renderProfile(profile);

      try {
        const clubData = await window.StartInnova.apiFetch("/api/users/club-data");
        window.StartInnova.showMessage("club-message", clubData.message, "success");
        renderClubData(clubData.data || []);
      } catch (error) {
        if (error.status === 403) {
          window.StartInnova.showMessage(
            "club-message",
            "Tai khoan hien tai chua co quyen xem du lieu noi bo.",
            "warning"
          );
          return;
        }

        throw error;
      }
    } catch (error) {
      window.StartInnova.showMessage("dashboard-message", error.message, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-button");

    if (logoutButton) {
      logoutButton.addEventListener("click", window.StartInnova.signOut);
    }

    loadDashboard();
  });
})();

