(function () {
  if (!window.SS) return;

  const state = window.SchoolStock.get();
  const ui = window.SS;
  const API_URL = "https://tracknstock-3fk4.onrender.com/api";

  const form = document.getElementById("stock-in-form") ||
               document.getElementById("stock-out-form");

  if (!form) return;

  const stockIn = form.id === "stock-in-form";
  const select = form.elements.productId;
  const history = document.getElementById("stock-history");

  let products = [];
  let usingOffline = false;

  function useOfflineProducts() {
    products = state.products.map(item => ({
      ...item,
      unit: item.unit || "piece"
    }));
    usingOffline = true;
  }

  async function loadProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) throw new Error("Unable to load products.");

      products = await response.json();
      usingOffline = false;
    } catch (error) {
      console.error(error);
      useOfflineProducts();
      ui.toast("Using offline demo inventory.", true);
    }

    select.innerHTML =
      `<option value="">Select product</option>` +
      products
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(item =>
          `<option value="${item.id}">
            ${ui.escape(item.name)} · ${item.stock} available
          </option>`
        )
        .join("");
  }

  function loadSuppliers() {
    if (stockIn && form.elements.supplierId) {
      form.elements.supplierId.innerHTML =
        `<option value="">Select supplier</option>` +
        state.suppliers.map(item =>
          `<option value="${item.id}">
            ${ui.escape(item.name)}
          </option>`
        ).join("");
    }
  }

  async function loadHistory() {
    if (usingOffline) {
      drawHistory(state.history);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/stock-transactions`);

      if (!response.ok) throw new Error("Unable to load stock history.");

      const records = await response.json();
      drawHistory(records);
    } catch (error) {
      console.error(error);
      usingOffline = true;
      drawHistory(state.history);
      ui.toast("Using offline stock history.", true);
    }
  }

  function drawHistory(records) {
    if (!history) return;

    history.innerHTML = records.length
      ? records.slice(0, 10).map(item => {
          const isIn = item.type === "STOCK_IN" || item.type === "IN";

          return `
            <tr>
              <td>${ui.date(item.date)}</td>
              <td>${ui.escape(item.productName || ui.product(item.productId)?.name || "Unknown product")}</td>
              <td>
                <span class="status ${isIn ? "in-stock" : "low-stock"}">
                  ${isIn ? "Stock in" : "Stock out"}
                </span>
              </td>
              <td>${isIn ? "+" : "−"}${item.quantity}</td>
              <td>${ui.escape(item.remarks || item.reason || "—")}</td>
            </tr>
          `;
        }).join("")
      : `<tr>
           <td colspan="5" class="empty-state">
             No stock movements recorded yet.
           </td>
         </tr>`;
  }

  function refreshProductOptions() {
    select.innerHTML =
      `<option value="">Select product</option>` +
      products
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(item =>
          `<option value="${item.id}">
            ${ui.escape(item.name)} · ${item.stock} available
          </option>`
        )
        .join("");
  }

  function saveOfflineTransaction(product, quantity, data) {
    const localProduct = state.products.find(
      item => Number(item.id) === Number(product.id)
    );

    if (!localProduct) {
      throw new Error("Product is not available in offline demo data.");
    }

    localProduct.stock += stockIn ? quantity : -quantity;

    const transaction = {
      id: Date.now(),
      productId: localProduct.id,
      productName: localProduct.name,
      type: stockIn ? "IN" : "OUT",
      quantity,
      date: data.date
        ? new Date(`${data.date}T00:00:00`).toISOString()
        : new Date().toISOString(),
      reason: data.notes || data.reason || ""
    };

    state.history.unshift(transaction);
    window.SchoolStock.save();

    useOfflineProducts();
    refreshProductOptions();
    drawHistory(state.history);
  }

  if (form.elements.date) {
    form.elements.date.value = new Date().toISOString().slice(0, 10);
  }

  loadSuppliers();

  async function initialize() {
    await loadProducts();
    await loadHistory();
  }

  initialize();

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const values = new FormData(form);
    const productId = Number(values.get("productId"));
    const quantity = Number(values.get("quantity"));

    const product = products.find(
      item => Number(item.id) === productId
    );

    if (!product || !Number.isInteger(quantity) || quantity <= 0) {
      return ui.toast(
        "Select a product and enter a whole quantity greater than zero.",
        true
      );
    }

    if (!stockIn && quantity > product.stock) {
      return ui.toast(
        `Only ${product.stock} units of ${product.name} are available.`,
        true
      );
    }

    const reference = (values.get("reference") || "").trim();
    const notes = (values.get("notes") || "").trim();
    const reason = (values.get("reason") || "").trim();

    const remarks = [
      reference ? `Reference: ${reference}` : "",
      stockIn ? notes : reason
    ].filter(Boolean).join(" | ");

    const data = {
      productId,
      quantity,
      date: values.get("date"),
      notes: remarks,
      reason: remarks
    };

    if (usingOffline) {
      try {
        saveOfflineTransaction(product, quantity, data);
        form.reset();

        if (form.elements.date) {
          form.elements.date.value = new Date().toISOString().slice(0, 10);
        }

        ui.toast(`Offline stock ${stockIn ? "in" : "out"} recorded successfully!`);
      } catch (error) {
        console.error(error);
        ui.toast(error.message || "Unable to save offline transaction.", true);
      }

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${stockIn ? "stock-in" : "stock-out"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Stock transaction failed.");
      }

      await loadProducts();
      await loadHistory();

      form.reset();

      if (form.elements.date) {
        form.elements.date.value = new Date().toISOString().slice(0, 10);
      }

      ui.toast(`Stock ${stockIn ? "in" : "out"} recorded successfully!`);
    } catch (error) {
      console.error(error);
      ui.toast(error.message || "Unable to record stock movement.", true);
    }
  });
})();