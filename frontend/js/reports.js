(function () {
  if (!window.SS) return;
  const state = window.SchoolStock.get(), ui = window.SS;
  const type = document.getElementById("report-type"), body = document.getElementById("report-body");
  if (!body) return;
  const from = document.getElementById("date-from"), to = document.getElementById("date-to");
  from.value = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  to.value = new Date().toISOString().slice(0, 10);
  let rows = [], headers = [];
  function draw() {
    const mode = type.value;
    if (mode === "sales") {
      const start = from.value ? new Date(`${from.value}T00:00:00`) : new Date(0);
      const end = to.value ? new Date(`${to.value}T23:59:59.999`) : new Date();
      rows = state.sales.filter(sale => new Date(sale.timestamp) >= start && new Date(sale.timestamp) <= end).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      headers = ["Receipt", "Date", "Processed by", "Items", "Total", "Cash received", "Change"];
      document.getElementById("report-head").innerHTML = `<tr>${headers.map(item => `<th>${item}</th>`).join("")}</tr>`;
      body.innerHTML = rows.length ? rows.map(sale => `<tr><td><strong>${ui.escape(sale.id)}</strong></td><td>${ui.date(sale.timestamp)}</td><td>${ui.escape(sale.user || "Alex Morgan")}</td><td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>${ui.money(sale.total)}</td><td>${ui.money(sale.cash)}</td><td>${ui.money(sale.change)}</td></tr>`).join("") : `<tr><td colspan="7" class="empty-state">No sales in this date range.</td></tr>`;
      const total = rows.reduce((sum, sale) => sum + Number(sale.total), 0);
      document.getElementById("report-summary").innerHTML = summary([["Transactions", rows.length], ["Sales total", ui.money(total)], ["Items sold", rows.reduce((sum, sale) => sum + sale.items.reduce((n, item) => n + item.quantity, 0), 0)]]);
    } else {
      const lowOnly = mode === "low";
      rows = state.products.filter(product => !lowOnly || product.stock <= product.minStock);
      headers = ["Product ID", "Product", "Category", "Supplier", "Unit price", "Current stock", "Minimum stock", "Status"];
      document.getElementById("report-head").innerHTML = `<tr>${headers.map(item => `<th>${item}</th>`).join("")}</tr>`;
      body.innerHTML = rows.length ? rows.map(item => `<tr><td>SS-${item.id}</td><td>${ui.escape(item.name)}</td><td>${ui.escape(ui.category(item.categoryId))}</td><td>${ui.escape(ui.supplier(item.supplierId))}</td><td>${ui.money(item.price)}</td><td>${item.stock}</td><td>${item.minStock}</td><td>${ui.status(item)}</td></tr>`).join("") : `<tr><td colspan="8" class="empty-state">No products to show.</td></tr>`;
      document.getElementById("report-summary").innerHTML = summary([["Products shown", rows.length], ["Low stock", state.products.filter(item => item.stock > 0 && item.stock <= item.minStock).length], ["Out of stock", state.products.filter(item => item.stock === 0).length]]);
    }
  }
  function summary(entries) {
    return entries.map(([label, value]) => `<article class="stat-card"><span class="stat-icon">▥</span><div><p>${label}</p><strong>${value}</strong></div></article>`).join("");
  }
  document.getElementById("apply-dates").addEventListener("click", () => {
    if (from.value && to.value && from.value > to.value) return ui.toast("The start date must be on or before the end date.", true);
    draw();
  });
  type.addEventListener("change", () => { document.querySelectorAll(".toolbar label").forEach(label => label.hidden = type.value !== "sales"); draw(); });
  document.getElementById("export-csv").addEventListener("click", () => {
    if (!rows.length) return ui.toast("There are no rows to export.", true);
    const mode = type.value;
    const values = rows.map(row => mode === "sales"
      ? [row.id, new Date(row.timestamp).toLocaleString(), row.user || "Alex Morgan", row.items.reduce((sum, item) => sum + item.quantity, 0), row.total.toFixed(2), row.cash.toFixed(2), row.change.toFixed(2)]
      : [row.id, row.name, ui.category(row.categoryId), ui.supplier(row.supplierId), Number(row.price).toFixed(2), row.stock, row.minStock, ui.status(row)]);
    const csvCell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...values].map(row => row.map(csvCell).join(",")).join("\r\n");
    const link = document.createElement("a"), url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    link.href = url; link.download = `tracknstock-${mode}-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
    ui.toast("CSV report exported.");
  });
  document.getElementById("print-report").addEventListener("click", () => window.print());
  draw();
})();
