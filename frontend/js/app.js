
(function () {
  const isLoginPage = window.location.pathname.split(/[\\/]/).pop() === "login.html";
  const currentUser = sessionStorage.getItem("schoolstock-user");

  if (!isLoginPage && currentUser !== "admin" && currentUser !== "staff") {
    window.location.replace("login.html");
    return;
  }

  if (!isLoginPage) {
    window.history.replaceState(null, "", window.location.href);

    window.addEventListener("pageshow", () => {
      const activeUser = sessionStorage.getItem("schoolstock-user");
      if (activeUser !== "admin" && activeUser !== "staff") {
        window.location.replace("login.html");
      }
    });
  }

  const state = window.SchoolStock.get();

  const navGroups = [
    ["WORKSPACE", [
      ["dashboard.html", "◫", "Dashboard"],
      ["products.html", "▦", "Products"],
      ["categories.html", "▤", "Categories"],
      ["suppliers.html", "♧", "Suppliers"]
    ]],
    ["STOCK CONTROL", [
      ["stock-in.html", "＋", "Stock In"],
      ["stock-out.html", "−", "Stock Out"],
      ["low-stock.html", "◉", "Low Stock"]
    ]],
    ["SALES", [
      ["sales.html", "▣", "Sales & Billing"],
      ["reports.html", "▥", "Reports"]
    ]],
    ["ADMIN", [
      ["users.html", "♙", "Users"],
      ["settings.html", "⚙", "Settings"]
    ]]
  ];

  const path = window.location.pathname.split(/[\\/]/).pop();
  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.className = "sidebar";
    sidebar.innerHTML = `
      <a class="brand" href="dashboard.html">
        <span class="brand-mark">T</span>
        <span>TrackNStock<small>SUPPLY INVENTORY</small></span>
      </a>
      <nav class="nav-links">
        ${navGroups.map(group => `
          <div class="nav-section-label">${group[0]}</div>
          ${group[1].map(([href, icon, label]) => `
            <a class="nav-link ${path === href ? "active" : ""}" href="${href}">
              <span class="nav-icon">${icon}</span>${label}
            </a>
          `).join("")}
        `).join("")}
        <a class="nav-link nav-logout" href="login.html">
          <span class="nav-icon">↪</span>Log out
        </a>
      </nav>
      <div class="sidebar-footer">
        TrackNStock Demo · v1.0<br>Local browser data only
      </div>
    `;
  }

  const tools = window.SS = {
    escape(value) {
      return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));
    },

    money(amount) {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
      }).format(Number(amount) || 0);
    },

    date(value, options) {
      return new Intl.DateTimeFormat(
        "en-PH",
        options || {
          month: "short",
          day: "numeric",
          year: "numeric"
        }
      ).format(new Date(value));
    },

    category(id) {
      return state.categories.find(
        item => Number(item.id) === Number(id)
      )?.name || "Uncategorized";
    },

    supplier(id) {
      return state.suppliers.find(
        item => Number(item.id) === Number(id)
      )?.name || "—";
    },

    product(id) {
      return state.products.find(
        item => Number(item.id) === Number(id)
      );
    },

    status(product) {
      return product.stock <= 0
        ? "Out of stock"
        : product.stock <= product.minStock
          ? "Low stock"
          : "In stock";
    },

    badge(product) {
      const type = product.stock <= 0
        ? "out-stock"
        : product.stock <= product.minStock
          ? "low-stock"
          : "in-stock";

      return `<span class="status ${type}">
        ${product.stock <= 0
          ? "Out of stock"
          : product.stock <= product.minStock
            ? "Low stock"
            : "In stock"}
      </span>`;
    },

    toast(message, isError) {
      let container = document.querySelector(".toast-container");

      if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.append(container);
      }

      const item = document.createElement("div");
      item.className = `toast${isError ? " error" : ""}`;
      item.textContent = message;
      container.append(item);

      setTimeout(() => item.remove(), 3200);
    },

    nextReceipt() {
      return `SS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    }
  };

  const topbar = document.getElementById("topbar");
  const userRecord = state.users.find(
    user => user.username === currentUser
  );

  const profileName = currentUser === "staff"
    ? userRecord?.name || "Staff"
    : state.settings.displayName || userRecord?.name || "Administrator";

  const profileRole = userRecord?.role ||
    (currentUser === "staff" ? "Staff" : "Administrator");

  const profileInitials = profileName
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (topbar) {
    topbar.innerHTML = `
      <div class="topbar-search">
        ⌕ <input id="global-search"
          aria-label="Search inventory"
          placeholder="Search inventory...">
      </div>
      <div class="topbar-right">
        <span class="notification" title="Notifications">♧</span>
        <div class="profile-menu">
          <button class="profile-trigger"
            id="profile-trigger"
            type="button"
            aria-haspopup="true"
            aria-expanded="false"
            aria-controls="profile-dropdown">
            <span class="avatar">${tools.escape(profileInitials)}</span>
            <span class="profile-identity">
              <strong>${tools.escape(profileName)}</strong>
              <small>${tools.escape(profileRole)}</small>
            </span>
            <span class="profile-chevron" aria-hidden="true">⌄</span>
          </button>

          <div class="profile-dropdown" id="profile-dropdown" hidden>
            <div class="dropdown-account">
              <strong>${tools.escape(profileName)}</strong>
              <span>${tools.escape(profileRole)}</span>
            </div>
            <a class="dropdown-item" href="settings.html#profile">
              <span aria-hidden="true">♙</span>My Profile
            </a>
            <button class="dropdown-item dropdown-logout"
              type="button" id="dropdown-logout">
              <span aria-hidden="true">↪</span>Logout
            </button>
          </div>
        </div>
      </div>
    `;

    setupProfileMenu();
  }

  if (sidebar) {
    sidebar.querySelector(".nav-logout")?.addEventListener("click", event => {
      event.preventDefault();
      openLogoutModal();
    });
  }

  function setupProfileMenu() {
    const trigger = document.getElementById("profile-trigger");
    const dropdown = document.getElementById("profile-dropdown");

    trigger.addEventListener("click", () => {
      const isOpen = !dropdown.hidden;
      dropdown.hidden = isOpen;
      trigger.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", event => {
      if (!event.target.closest(".profile-menu")) {
        dropdown.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !dropdown.hidden) {
        dropdown.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
    });

    document.getElementById("dropdown-logout")
      .addEventListener("click", openLogoutModal);
  }

  function openLogoutModal() {
    let modal = document.getElementById("logout-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "logout-modal";
      modal.className = "modal-backdrop";

      modal.innerHTML = `
        <section class="confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          aria-describedby="logout-description">
          <span class="confirm-icon" aria-hidden="true">↪</span>
          <h2 id="logout-title">Log out</h2>
          <p id="logout-description">
            Are you sure you want to log out?
          </p>
          <div class="confirm-actions">
            <button type="button"
              class="button secondary"
              id="cancel-logout">Cancel</button>
            <button type="button"
              class="button primary"
              id="confirm-logout">Yes, Logout</button>
          </div>
        </section>
      `;

      document.body.append(modal);

      modal.addEventListener("click", event => {
        if (event.target === modal) closeLogoutModal();
      });

      document.getElementById("cancel-logout")
        .addEventListener("click", closeLogoutModal);

      document.getElementById("confirm-logout")
        .addEventListener("click", () => {
          sessionStorage.removeItem("schoolstock-user");
          sessionStorage.removeItem("schoolstock-last-sale");
          window.location.replace("login.html");
        });

      modal.addEventListener("keydown", event => {
        if (event.key === "Escape") closeLogoutModal();
      });
    }

    modal.hidden = false;
    document.getElementById("cancel-logout").focus();
  }

  function closeLogoutModal() {
    const modal = document.getElementById("logout-modal");
    if (modal) modal.hidden = true;
    document.getElementById("profile-trigger")?.focus();
  }

  function dashboard() {
    const stats = document.getElementById("dashboard-stats");
    if (!stats) return;

    const today = new Date().toDateString();

    const todaysSales = state.sales
      .filter(sale => new Date(sale.timestamp).toDateString() === today)
      .reduce((sum, sale) => sum + Number(sale.total), 0);

    const low = state.products.filter(
      item => item.stock <= item.minStock
    );

    stats.innerHTML = [
      ["▦", "Total products", state.products.length],
      ["₱", "Sales today", tools.money(todaysSales)],
      ["◉", "Low-stock items", low.length],
      ["♧", "Total suppliers", state.suppliers.length]
    ].map(([icon, label, value]) => `
      <article class="stat-card">
        <span class="stat-icon">${icon}</span>
        <div>
          <p>${label}</p>
          <strong>${value}</strong>
        </div>
      </article>
    `).join("");

    const chart = document.getElementById("sales-chart");

    if (chart) {
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const totals = Array(7).fill(0);
      const now = new Date();

      state.sales.forEach(sale => {
        const date = new Date(sale.timestamp);

        const dayDiff = Math.floor(
          (
            new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
            new Date(date.getFullYear(), date.getMonth(), date.getDate())
          ) / 86400000
        );

        if (dayDiff >= 0 && dayDiff < 7) {
          totals[(now.getDay() + 6 - dayDiff) % 7] += Number(sale.total);
        }
      });

      const maximum = Math.max(1, ...totals);

      chart.innerHTML = totals.map((total, index) => `
        <div class="chart-column">
          <span class="chart-bar"
            title="${tools.money(total)}"
            style="height:${Math.max(total ? 6 : 2, total / maximum * 130)}px">
          </span>
          ${dayNames[index]}
        </div>
      `).join("");
    }

    const alerts = document.getElementById("dashboard-alerts");

    if (alerts) {
      alerts.innerHTML = low.length
        ? low.slice(0, 5).map(item => `
          <div class="alert-row">
            <span class="alert-dot ${item.stock === 0 ? "out" : ""}"></span>
            <span>
              <strong>${tools.escape(item.name)}</strong>
              <small>Minimum ${item.minStock} units</small>
            </span>
            <span class="alert-qty">${item.stock} left</span>
          </div>
        `).join("")
        : `<div class="empty-state">
            All products are above their minimum stock level.
          </div>`;
    }

    const recent = document.getElementById("recent-sales");

    if (recent) {
      recent.innerHTML = state.sales
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(sale => `
          <tr>
            <td><strong>${tools.escape(sale.id)}</strong></td>
            <td>${tools.date(sale.timestamp)}</td>
            <td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)} items</td>
            <td>${tools.escape(sale.user || "Alex Morgan")}</td>
            <td class="align-right">${tools.money(sale.total)}</td>
          </tr>
        `).join("") ||
        `<tr><td colspan="5" class="empty-state">No transactions yet.</td></tr>`;
    }
  }

  function login() {
    const form = document.getElementById("login-form");
    if (!form) return;

    const rememberedUsername = localStorage.getItem(
      "schoolstock-remembered-username"
    );

    if (rememberedUsername) {
      form.elements.username.value = rememberedUsername;
      document.getElementById("remember").checked = true;
    }

    document.querySelector("[data-toggle-password]")
      .addEventListener("click", event => {
        const input = document.getElementById("password");

        input.type = input.type === "password" ? "text" : "password";
        event.currentTarget.textContent =
          input.type === "password" ? "Show" : "Hide";
      });

    form.addEventListener("submit", event => {
      event.preventDefault();

      const data = new FormData(form);

      if (
        (data.get("username") === "admin" ||
          data.get("username") === "staff") &&
        data.get("password") === "schoolstock"
      ) {
        sessionStorage.setItem("schoolstock-user", data.get("username"));

        if (document.getElementById("remember").checked) {
          localStorage.setItem(
            "schoolstock-remembered-username",
            data.get("username")
          );
        } else {
          localStorage.removeItem("schoolstock-remembered-username");
        }

        location.href = "dashboard.html";
      } else {
        document.getElementById("login-error").textContent =
          "Username or password is incorrect. Try the demo credentials shown below.";
      }
    });
  }

  function settings() {
    const form = document.getElementById("settings-form");
    if (!form) return;

    Object.entries(state.settings).forEach(([key, value]) => {
      if (form.elements[key]) {
        form.elements[key].value = value;
      }
    });

    const username = sessionStorage.getItem("schoolstock-user") || "admin";

    form.elements.username.value = username;
    form.elements.role.value =
      state.users.find(user => user.username === username)?.role ||
      "Administrator";

    form.addEventListener("submit", event => {
      event.preventDefault();

      const data = new FormData(form);

      state.settings = {
        ...state.settings,
        storeName: data.get("storeName").trim(),
        contact: data.get("contact").trim(),
        currency: data.get("currency"),
        minStock: Number(data.get("minStock")),
        displayName: data.get("displayName").trim()
      };

      window.SchoolStock.save();
      tools.toast("Settings saved.");
      setTimeout(() => location.reload(), 400);
    });

    const resetButton = document.getElementById("reset-demo");
    if (!resetButton) return;

    resetButton.addEventListener("click", async () => {
      const confirmed = confirm(
        "Reset demo data to the original sample quantities? This will clear stock transaction history and demo sales. This cannot be undone."
      );

      if (!confirmed) return;

      resetButton.disabled = true;
      resetButton.textContent = "Resetting...";

      const apiUrl = "https://tracknstock-3fk4.onrender.com/api";

      try {
        const response = await fetch(`${apiUrl}/demo/reset`, {
          method: "POST"
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to reset demo data."
          );
        }

        const productsResponse = await fetch(`${apiUrl}/products`);

        if (!productsResponse.ok) {
          throw new Error("Could not refresh product data.");
        }

        const products = await productsResponse.json();

        state.products.forEach(product => {
          const updatedProduct = products.find(
            item => Number(item.id) === Number(product.id)
          );

          if (updatedProduct) {
            product.stock = Number(updatedProduct.stock);
          }
        });

        state.sales = [];
        state.history = [];

        window.SchoolStock.save();
        sessionStorage.removeItem("schoolstock-last-sale");

        alert("Demo data has been reset successfully!");
        location.reload();

      } catch (error) {
        console.error("Reset error:", error);

        alert(
          error.message ||
          "Could not reset demo data. Please try again."
        );

        resetButton.disabled = false;
        resetButton.textContent = "Reset demo data";
      }
    });
  }

  function users() {
    const table = document.getElementById("users-table");
    if (!table) return;

    const count = document.getElementById("users-count");
    const addModal = document.getElementById("add-user-modal");
    const successModal = document.getElementById("user-success-modal");
    const form = document.getElementById("add-user-form");
    const error = document.getElementById("add-user-error");

    const draw = () => {
      if (count) {
        count.textContent = `${state.users.length} ${
          state.users.length === 1 ? "user" : "users"
        } total`;
      }

      table.innerHTML = state.users.map(user => `
        <tr>
          <td><strong>${tools.escape(user.name)}</strong></td>
          <td>${tools.escape(user.username)}</td>
          <td>${tools.escape(user.email)}</td>
          <td><span class="user-pill">${tools.escape(user.role)}</span></td>
          <td>
            ${user.status === "Active"
              ? '<span class="status in-stock">Active</span>'
              : '<span class="status out-stock">Inactive</span>'}
          </td>
          <td>
            <button class="action-link" data-edit="${user.id}">Edit</button>
            <button class="action-link danger-link" data-delete="${user.id}">Delete</button>
          </td>
        </tr>
      `).join("");
    };

    const closeAddModal = () => {
      addModal.hidden = true;
      form.reset();
      error.textContent = "";
      document.getElementById("add-user").focus();
    };

    const showDetails = user => {
      const details = document.getElementById("success-user-details");

      const fields = [
        ["Full Name", user.name],
        ["Username", user.username],
        ["Email Address", user.email],
        ["Contact Number", user.phone],
        ["User Role", user.role],
        ["Account Status", user.status],
        [
          "Date Created",
          tools.date(user.createdAt, {
            month: "long",
            day: "numeric",
            year: "numeric"
          })
        ]
      ];

      details.replaceChildren();

      fields.forEach(([label, value]) => {
        const item = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");

        term.textContent = label;
        description.textContent = value;

        item.append(term, description);
        details.append(item);
      });

      successModal.hidden = false;
      document.getElementById("done-user-success").focus();
    };

    const hashPassword = async password => {
      if (!window.crypto?.subtle) {
        throw new Error(
          "Secure password hashing is unavailable in this browser. Open the project using VS Code Live Server and try again."
        );
      }

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const encoder = new TextEncoder();

      const key = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
      );

      const derived = await window.crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt,
          iterations: 210000,
          hash: "SHA-256"
        },
        key,
        256
      );

      const toBase64 = bytes =>
        btoa(String.fromCharCode(...new Uint8Array(bytes)));

      return `pbkdf2-sha256$210000$${toBase64(salt)}$${toBase64(derived)}`;
    };

    draw();

    document.getElementById("add-user").addEventListener("click", () => {
      addModal.hidden = false;
      form.elements.name.focus();
    });

    document.getElementById("close-add-user")
      .addEventListener("click", closeAddModal);

    document.getElementById("cancel-add-user")
      .addEventListener("click", closeAddModal);

    addModal.addEventListener("click", event => {
      if (event.target === addModal) closeAddModal();
    });

    addModal.addEventListener("keydown", event => {
      if (event.key === "Escape") closeAddModal();
    });

    document.getElementById("done-user-success")
      .addEventListener("click", () => {
        successModal.hidden = true;
        document.getElementById("add-user").focus();
      });

    successModal.addEventListener("click", event => {
      if (event.target === successModal) {
        successModal.hidden = true;
        document.getElementById("add-user").focus();
      }
    });

    successModal.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        successModal.hidden = true;
        document.getElementById("add-user").focus();
      }
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      error.textContent = "";

      if (!form.reportValidity()) return;

      const values = new FormData(form);

      const name = values.get("name").trim();
      const username = values.get("username").trim();
      const email = values.get("email").trim();
      const phone = values.get("phone").trim();
      const password = values.get("password");

      if (!name || !username || !email || !phone) {
        error.textContent = "Complete all required fields.";
        return;
      }

      if (state.users.some(
        user => user.username.trim().toLowerCase() === username.toLowerCase()
      )) {
        error.textContent =
          "That username is already in use. Choose another username.";
        form.elements.username.focus();
        return;
      }

      if (state.users.some(
        user => (user.email || "").trim().toLowerCase() === email.toLowerCase()
      )) {
        error.textContent =
          "That email address is already in use. Enter a different email.";
        form.elements.email.focus();
        return;
      }

      if (password !== values.get("confirmPassword")) {
        error.textContent = "Password and Confirm Password do not match.";
        form.elements.confirmPassword.focus();
        return;
      }

      const submit = document.getElementById("save-user");
      submit.disabled = true;
      submit.textContent = "Saving…";

      try {
        const user = {
          id: window.SchoolStock.nextId("users"),
          name,
          username,
          email,
          phone,
          role: values.get("role"),
          status: values.get("status"),
          createdAt: new Date().toISOString(),
          passwordHash: await hashPassword(password)
        };

        state.users.push(user);

        try {
          window.SchoolStock.save();
        } catch (saveError) {
          state.users.pop();
          throw saveError;
        }

        draw();
        closeAddModal();
        showDetails(user);

      } catch (saveError) {
        console.error("Could not add the demo user.", saveError);
        error.textContent =
          saveError.message || "Could not save the user. Please try again.";

      } finally {
        submit.disabled = false;
        submit.textContent = "Save User";
      }
    });

    table.addEventListener("click", event => {
      const edit = event.target.closest("[data-edit]");
      const remove = event.target.closest("[data-delete]");

      if (edit) {
        const user = state.users.find(
          item => item.id === Number(edit.dataset.edit)
        );

        const name = prompt("Full name:", user.name);
        if (!name?.trim()) return;

        const role = prompt(
          "Role (Administrator or Staff):",
          user.role
        );
        if (!role) return;

        const status = prompt(
          "Account status (Active or Inactive):",
          user.status
        );
        if (!status) return;

        Object.assign(user, {
          name: name.trim(),
          role: role.trim(),
          status: status.trim()
        });

        window.SchoolStock.save();
        draw();
      }

      if (remove && confirm("Delete this sample user?")) {
        const index = state.users.findIndex(
          item => item.id === Number(remove.dataset.delete)
        );

        const [removed] = state.users.splice(index, 1);

        try {
          window.SchoolStock.save();
          draw();
        } catch (saveError) {
          state.users.splice(index, 0, removed);
          tools.toast(
            saveError.message || "Could not delete the user.",
            true
          );
        }
      }
    });
  }

  dashboard();
  login();
  settings();
  users();
})();