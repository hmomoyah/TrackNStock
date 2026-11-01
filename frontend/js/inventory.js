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

  async function loadProducts() {
    const response = await fetch(`${API_URL}/products`);

    if (!response.ok) {
      throw new Error("Unable to load products.");
    }

    products = await response.json();

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
    const response = await fetch(`${API_URL}/stock-transactions`);

    if (!response.ok) {
      throw new Error("Unable to load stock history.");
    }

    const records = await response.json();

    history.innerHTML = records.length
      ? records.slice(0, 10).map(item => {
          const isIn = item.type === "STOCK_IN";

          return `
            <tr>
              <td>${ui.date(item.date)}</td>
              <td>${ui.escape(item.productName)}</td>
              <td>
                <span class="status ${isIn ? "in-stock" : "low-stock"}">
                  ${isIn ? "Stock in" : "Stock out"}
                </span>
              </td>
              <td>${isIn ? "+" : "−"}${item.quantity}</td>
              <td>${ui.escape(item.remarks || "—")}</td>
            </tr>
          `;
        }).join("")
      : `<tr>
           <td colspan="5" class="empty-state">
             No stock movements recorded yet.
           </td>
         </tr>`;
  }

  if (form.elements.date) {
    form.elements.date.value = new Date().toISOString().slice(0, 10);
  }

  loadSuppliers();

  Promise.all([loadProducts(), loadHistory()])
    .catch(error => {
      console.error(error);
      ui.toast("Unable to load inventory data.", true);
    });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const values = new FormData(form);
    const productId = Number(values.get("productId"));
    const quantity = Number(values.get("quantity"));

    const product = products.find(item => Number(item.id) === productId);

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
      productId: productId,
      quantity: quantity,
      date: values.get("date"),
      notes: remarks,
      reason: remarks
    };

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

      await Promise.all([loadProducts(), loadHistory()]);

      form.reset();

      if (form.elements.date) {
        form.elements.date.value = new Date().toISOString().slice(0, 10);
      }

      ui.toast(
        `Stock ${stockIn ? "in" : "out"} recorded successfully!`
      );

    } catch (error) {
      console.error(error);
      ui.toast(error.message || "Unable to record stock movement.", true);
    }
  });
})();