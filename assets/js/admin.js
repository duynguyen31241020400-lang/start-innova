(function () {
  const roles = ["head", "admin", "member", "guest", "customer"];
  let currentRole = "guest";

  function createRoleSelect(selectedRole) {
    const select = document.createElement("select");
    select.className =
      "rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none";

    roles.forEach((role) => {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = role;
      option.selected = role === selectedRole;
      select.appendChild(option);
    });

    return select;
  }

  function createButton(label, variant = "primary") {
    const button = document.createElement("button");
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-500",
      danger: "bg-red-600 hover:bg-red-500",
      muted: "bg-white/10 hover:bg-white/15"
    };

    button.type = "button";
    button.className = `rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors ${variants[variant]}`;
    button.textContent = label;
    return button;
  }

  function renderUsers(users) {
    const tbody = document.getElementById("users-table-body");

    if (!tbody) {
      return;
    }

    tbody.innerHTML = "";

    users.forEach((user) => {
      const row = document.createElement("tr");
      row.className = "border-t border-white/10";

      const emailCell = document.createElement("td");
      emailCell.className = "px-4 py-3 text-sm text-white";
      emailCell.textContent = user.email;

      const nameCell = document.createElement("td");
      nameCell.className = "px-4 py-3 text-sm text-gray-300";
      nameCell.textContent = user.full_name || "-";

      const mssvCell = document.createElement("td");
      mssvCell.className = "px-4 py-3 text-sm text-gray-300";
      mssvCell.textContent = user.mssv || "-";

      const departmentCell = document.createElement("td");
      departmentCell.className = "px-4 py-3 text-sm text-gray-300";
      departmentCell.textContent = user.department || "-";

      const roleCell = document.createElement("td");
      roleCell.className = "px-4 py-3";
      const roleSelect = createRoleSelect(user.role);
      roleCell.appendChild(roleSelect);

      const actionCell = document.createElement("td");
      actionCell.className = "px-4 py-3";
      const actionWrap = document.createElement("div");
      actionWrap.className = "flex flex-wrap gap-2";

      const saveButton = createButton("Luu");
      saveButton.addEventListener("click", async () => {
        await updateRole(user.email, roleSelect.value);
      });
      actionWrap.appendChild(saveButton);

      if (currentRole === "head") {
        const deleteButton = createButton("Xoa", "danger");
        deleteButton.addEventListener("click", async () => {
          await deleteUser(user.email);
        });
        actionWrap.appendChild(deleteButton);
      }

      actionCell.appendChild(actionWrap);

      row.append(emailCell, nameCell, mssvCell, departmentCell, roleCell, actionCell);
      tbody.appendChild(row);
    });
  }

  async function loadAdmin() {
    try {
      await window.StartInnova.requireSession();

      const profile = await window.StartInnova.apiFetch("/api/users/public-profile");
      currentRole = profile.user.role;

      if (!["head", "admin"].includes(currentRole)) {
        window.StartInnova.showMessage(
          "admin-message",
          "Tai khoan hien tai khong co quyen quan tri.",
          "error"
        );
        return;
      }

      const result = await window.StartInnova.apiFetch("/api/users/all");
      window.StartInnova.setText("users-total", result.total);
      renderUsers(result.data || []);
    } catch (error) {
      window.StartInnova.showMessage("admin-message", error.message, "error");
    }
  }

  async function updateRole(email, newRole) {
    try {
      await window.StartInnova.apiFetch("/api/users/role", {
        method: "PUT",
        body: { email, newRole }
      });
      window.StartInnova.showMessage("admin-message", `Da cap nhat ${email}.`, "success");
      await loadAdmin();
    } catch (error) {
      window.StartInnova.showMessage("admin-message", error.message, "error");
    }
  }

  async function deleteUser(email) {
    const confirmed = window.confirm(`Xoa tai khoan ${email}?`);

    if (!confirmed) {
      return;
    }

    try {
      await window.StartInnova.apiFetch(`/api/users/by-email/${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      window.StartInnova.showMessage("admin-message", `Da xoa ${email}.`, "success");
      await loadAdmin();
    } catch (error) {
      window.StartInnova.showMessage("admin-message", error.message, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-button");

    if (logoutButton) {
      logoutButton.addEventListener("click", window.StartInnova.signOut);
    }

    loadAdmin();
  });
})();

