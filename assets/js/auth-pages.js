(function () {
  function redirectToDashboard() {
    window.location.href = "dashboard.html";
  }

  async function redirectIfLoggedIn() {
    try {
      const session = await window.StartInnova.getSession();

      if (session) {
        redirectToDashboard();
      }
    } catch (error) {
      window.StartInnova.showMessage("auth-message", error.message, "warning");
    }
  }

  function setupLoginForm() {
    const form = document.getElementById("login-form");

    if (!form) {
      return;
    }

    const submitButton = document.getElementById("login-submit");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      window.StartInnova.setLoading(submitButton, true, "Dang nhap...");
      window.StartInnova.showMessage("auth-message", "", "info");

      try {
        const client = window.StartInnova.getClient();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const { error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }

        window.StartInnova.showMessage("auth-message", "Dang nhap thanh cong.", "success");
        redirectToDashboard();
      } catch (error) {
        window.StartInnova.showMessage("auth-message", error.message, "error");
      } finally {
        window.StartInnova.setLoading(submitButton, false, "Dang nhap...");
      }
    });
  }

  function setupRegisterForm() {
    const form = document.getElementById("register-form");

    if (!form) {
      return;
    }

    const submitButton = document.getElementById("register-submit");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      window.StartInnova.setLoading(submitButton, true, "Dang ky...");
      window.StartInnova.showMessage("auth-message", "", "info");

      try {
        const client = window.StartInnova.getClient();
        const fullName = document.getElementById("fullname").value.trim();
        const mssv = document.getElementById("mssv").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm_password").value;
        const department = document.getElementById("department").value;

        if (password !== confirmPassword) {
          throw new Error("Mat khau xac nhan khong khop.");
        }

        if (password.length < 6) {
          throw new Error("Mat khau can co it nhat 6 ky tu.");
        }

        const emailRedirectTo = new URL("dashboard.html", window.location.href).href;
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName,
              mssv,
              department
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          redirectToDashboard();
          return;
        }

        window.StartInnova.showMessage(
          "auth-message",
          "Dang ky thanh cong. Hay kiem tra email de xac nhan tai khoan.",
          "success"
        );
      } catch (error) {
        window.StartInnova.showMessage("auth-message", error.message, "error");
      } finally {
        window.StartInnova.setLoading(submitButton, false, "Dang ky...");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    redirectIfLoggedIn();
    setupLoginForm();
    setupRegisterForm();
  });
})();

