(function () {
  if (!window.SS) return;

  const state = window.SchoolStock.get();
  const ui = window.SS;

  let products = state.products;

  function loadProducts() {
    products = state.products;
    return products;
  }

  function saveProduct(record, productId = null) {
    if (productId) {
      const index = state.products.findIndex(
        item => Number(item.id) === Number(productId)
      );

      if (index === -1) {
        throw new Error("Product not found.");
      }

      state.products[index] = {
        ...state.products[index],
        ...record,
        id: Number(productId)
      };
    } else {
      state.products.push({
        ...record,
        id: window.SchoolStock.nextId("products"),
        unit: "piece"
      });
    }

    window.SchoolStock.save();
    loadProducts();
  }

  const table = document.getElementById("products-table");
  const search = document.getElementById("product-search");
  const categoryFilter = document.getElementById("category-filter");

  if (table) {
    categoryFilter.innerHTML += state.categories.map(item =>
      `<option value="${item.id}">${ui.escape(item.name)}</option>`
    ).join("");

    function draw() {
      const term = search.value.trim().toLowerCase();
      const category = categoryFilter.value;

      const list = products.filter(item =>
        (!term ||
          item.name.toLowerCase().includes(term) ||
          String(item.id).includes(term)) &&
        (!category || String(item.categoryId) === category)
      );

      document.getElementById("product-count").textContent =
        `${list.length} products`;

      table.innerHTML = list.length ? list.map(item =>
        `<tr>
          <td>
            <div class="product-name">
              <span class="product-symbol">✎</span>
              <span>
                <strong>${ui.escape(item.name)}</strong>
                <small>SS-${item.id}</small>
              </span>
            </div>
          </td>
          <td>${ui.escape(ui.category(item.categoryId))}</td>
          <td>${ui.escape(ui.supplier(item.supplierId))}</td>
          <td>${ui.money(item.price)}</td>
          <td><strong>${item.stock}</strong></td>
          <td>${item.minStock}</td>
          <td>${ui.badge(item)}</td>
          <td>
            <a class="action-link" href="product-form.html?id=${item.id}">Edit</a>
            <button class="action-link danger-link" data-delete="${item.id}">Delete</button>
          </td>
        </tr>`
      ).join("") :
        `<tr><td colspan="8" class="empty-state">No products match your search.</td></tr>`;
    }

    search.addEventListener("input", draw);
    categoryFilter.addEventListener("change", draw);

    table.addEventListener("click", event => {
      const button = event.target.closest("[data-delete]");
      if (!button) return;

      const product = products.find(
        item => Number(item.id) === Number(button.dataset.delete)
      );

      if (!product) return;

      if (confirm(`Delete "${product.name}" from the inventory?`)) {
        try {
          state.products = state.products.filter(
            item => Number(item.id) !== Number(product.id)
          );

          window.SchoolStock.save();
          loadProducts();
          draw();

          ui.toast("Product deleted from demo inventory.");
        } catch (error) {
          console.error(error);
          ui.toast(error.message || "Unable to delete product.", true);
        }
      }
    });

    loadProducts();
    draw();
  }

  const form = document.getElementById("product-form");

  if (form) {
    function setupForm() {
      loadProducts();

      const id = new URLSearchParams(location.search).get("id");
      const product = id
        ? products.find(item => Number(item.id) === Number(id))
        : null;

      if (id && !product) {
        ui.toast("That product could not be found.", true);
        location.href = "products.html";
        return;
      }

      document.getElementById("form-title").textContent =
        product ? "Edit product" : "Add product";

      document.getElementById("form-breadcrumb").textContent =
        product ? "Edit product" : "Add product";

      form.elements.categoryId.innerHTML =
        `<option value="">Select category</option>` +
        state.categories.map(item =>
          `<option value="${item.id}">${ui.escape(item.name)}</option>`
        ).join("");

      form.elements.supplierId.innerHTML =
        `<option value="">No supplier</option>` +
        state.suppliers.map(item =>
          `<option value="${item.id}">${ui.escape(item.name)}</option>`
        ).join("");

      if (product) {
        form.elements.name.value = product.name;
        form.elements.categoryId.value = product.categoryId;
        form.elements.supplierId.value = product.supplierId || "";
        form.elements.price.value = product.price;
        form.elements.stock.value = product.stock;
        form.elements.minStock.value = product.minStock;
        form.elements.description.value = product.description || "";
      }

      form.addEventListener("submit", event => {
        event.preventDefault();

        const data = new FormData(form);
        const name = data.get("name").trim();
        const categoryId = Number(data.get("categoryId"));
        const price = Number(data.get("price"));
        const stock = Number(data.get("stock"));
        const minStock = Number(data.get("minStock"));

        if (
          !name ||
          !categoryId ||
          !Number.isFinite(price) ||
          price <= 0 ||
          !Number.isInteger(stock) ||
          stock < 0 ||
          !Number.isInteger(minStock) ||
          minStock < 0
        ) {
          return ui.toast(
            "Enter a name, category, positive price, and valid whole-number stock levels.",
            true
          );
        }

        const record = {
          name,
          categoryId,
          supplierId: Number(data.get("supplierId")) || null,
          price,
          stock,
          minStock,
          description: data.get("description").trim()
        };

        try {
          saveProduct(record, product ? product.id : null);

          ui.toast(
            product
              ? "Product updated successfully."
              : "Product added successfully."
          );

          location.href = "products.html";
        } catch (error) {
          console.error(error);
          ui.toast(error.message || "Unable to save product.", true);
        }
      });
    }

    setupForm();
  }

  const lowTable = document.getElementById("low-stock-table");

  if (lowTable) {
    const searchField = document.getElementById("low-stock-search");
    const filter = document.getElementById("low-stock-filter");

    function setupLowStock() {
      loadProducts();

      const alerts = products.filter(
        item => item.stock <= item.minStock
      );

      document.getElementById("low-stock-stats").innerHTML = [
        ["◉", "Products to replenish", alerts.length],
        ["!", "Out of stock", alerts.filter(item => item.stock === 0).length],
        ["↗", "Low stock", alerts.filter(item => item.stock > 0).length],
        ["▦", "Total products", products.length]
      ].map(([icon, label, value]) =>
        `<article class="stat-card">
          <span class="stat-icon">${icon}</span>
          <div><p>${label}</p><strong>${value}</strong></div>
        </article>`
      ).join("");

      const draw = () => {
        const term = searchField.value.trim().toLowerCase();

        const filtered = alerts.filter(item =>
          (!term || item.name.toLowerCase().includes(term)) &&
          (filter.value === "all" ||
            (filter.value === "out"
              ? item.stock === 0
              : item.stock > 0))
        );

        lowTable.innerHTML = filtered.length ? filtered.map(item =>
          `<tr>
            <td>
              <div class="product-name">
                <span class="product-symbol">▦</span>
                <strong>${ui.escape(item.name)}</strong>
              </div>
            </td>
            <td>${ui.escape(ui.category(item.categoryId))}</td>
            <td>${item.stock}</td>
            <td>${item.minStock}</td>
            <td>${ui.badge(item)}</td>
            <td><a class="action-link" href="stock-in.html">Replenish</a></td>
          </tr>`
        ).join("") :
          `<tr><td colspan="6" class="empty-state">No products match this view.</td></tr>`;
      };

      searchField.addEventListener("input", draw);
      filter.addEventListener("change", draw);
      draw();
    }

    setupLowStock();
  }
})();