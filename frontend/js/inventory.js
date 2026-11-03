(function () {
  if (!window.SS) return;

  const state = window.SchoolStock.get();
  const ui = window.SS;

  const form = document.getElementById("stock-in-form") ||
               document.getElementById("stock-out-form");

  if (!form) return;

  const stockIn = form.id === "stock-in-form";
  const select = form.elements.productId;
  const history = document.getElementById("stock-history");

  let products = [];

  function loadProducts() {
    products = state.products.map(item => ({
      ...item,
      stock: Number(item.stock) || 0,
      unit: item.unit || "piece"
    }));

    refreshProductOptions();
  }

  function loadSuppliers() {
    if (stockIn && form.elements.supplierId) {
      form.elements.supplierId.innerHTML =
        `<option value="">Select supplier</option>` +
        state.suppliers.map(item =>
          `<option value="${item.id}">${ui.escape(item.name)}</option>`
        ).join("");
    }
  }

  function loadHistory() {
    drawHistory(state.history || []);
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

  function saveTransaction(product, quantity, data) {
    const localProduct = state.products.find(
      item => Number(item.id) === Number(product.id)
    );

    if (!localProduct) {
      throw new Error("Product is not available in demo data.");
    }

    localProduct.stock = Number(localProduct.stock) || 0;
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
      reason: data.notes || ""
    };

    state.history.unshift(transaction);

    window.SchoolStock.save();

    loadProducts();
    loadHistory();
  }

  if (form.elements.date) {
    form.elements.date.value = new Date().toISOString().slice(0, 10);
  }

  loadSuppliers();
  loadProducts();
  loadHistory();

  form.addEventListener("submit", event => {
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
      date: values.get("date"),
      notes: remarks
    };

    try {
      saveTransaction(product, quantity, data);

      form.reset();

      if (form.elements.date) {
        form.elements.date.value = new Date().toISOString().slice(0, 10);
      }

      ui.toast(
        `Demo stock ${stockIn ? "in" : "out"} recorded successfully!`
      );
    } catch (error) {
      console.error(error);
      ui.toast(error.message || "Unable to save stock movement.", true);
    }
  });
})();