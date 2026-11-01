(function () {
  if (!window.SS) return;
  const state = window.SchoolStock.get(), ui = window.SS;
  const productsNode = document.getElementById("sales-products");
  if (productsNode) {
    const cart = new Map();
    const search = document.getElementById("sales-search");
    const cartNode = document.getElementById("cart-items");
    function drawProducts() {
      const term = search.value.trim().toLowerCase();
      const list = state.products.filter(item => item.stock > 0 && item.name.toLowerCase().includes(term));
      productsNode.innerHTML = list.length ? list.map(item => `<article class="product-option"><div><strong>${ui.escape(item.name)}</strong><small>${ui.money(item.price)} · ${item.stock} in stock</small></div><button class="button secondary" data-add="${item.id}">Add</button></article>`).join("") : `<div class="empty-state">No available products match your search.</div>`;
    }
    function drawCart() {
      const items = [...cart.entries()];
      cartNode.innerHTML = items.length ? items.map(([id, quantity]) => {
        const product = ui.product(id); return `<div class="cart-row"><span><strong>${ui.escape(product.name)}</strong><small>${ui.money(product.price)} each · ${ui.money(product.price * quantity)}</small></span><span class="quantity-control"><button data-qty="${id}" data-delta="-1" aria-label="Decrease quantity">−</button><strong>${quantity}</strong><button data-qty="${id}" data-delta="1" aria-label="Increase quantity">+</button></span><button class="action-link danger-link" data-remove="${id}" aria-label="Remove item">×</button></div>`;
      }).join("") : `<div class="empty-state">Your cart is empty. Add a product to begin.</div>`;
      const total = items.reduce((sum, [id, quantity]) => sum + ui.product(id).price * quantity, 0);
      document.getElementById("cart-count").textContent = `${items.reduce((sum, [, quantity]) => sum + quantity, 0)} items`;
      document.getElementById("cart-subtotal").textContent = ui.money(total);
      const cash = Number(document.getElementById("cash-received").value) || 0;
      document.getElementById("cash-change").textContent = ui.money(Math.max(0, cash - total));
    }
    productsNode.addEventListener("click", event => {
      const button = event.target.closest("[data-add]"); if (!button) return;
      const id = Number(button.dataset.add), product = ui.product(id);
      if ((cart.get(id) || 0) >= product.stock) return ui.toast(`Only ${product.stock} units are available.`, true);
      cart.set(id, (cart.get(id) || 0) + 1); drawCart();
    });
    cartNode.addEventListener("click", event => {
      const quantity = event.target.closest("[data-qty]"), remove = event.target.closest("[data-remove]");
      if (remove) cart.delete(Number(remove.dataset.remove));
      if (quantity) {
        const id = Number(quantity.dataset.qty), next = (cart.get(id) || 0) + Number(quantity.dataset.delta);
        if (next <= 0) cart.delete(id);
        else if (next > ui.product(id).stock) ui.toast(`Only ${ui.product(id).stock} units are available.`, true);
        else cart.set(id, next);
      }
      drawCart();
    });
    search.addEventListener("input", drawProducts);
    document.getElementById("cash-received").addEventListener("input", drawCart);
    document.getElementById("clear-cart").addEventListener("click", () => { cart.clear(); drawCart(); });
    document.getElementById("complete-sale").addEventListener("click", () => {
      if (!cart.size) return ui.toast("Add at least one product to the cart.", true);
      const total = [...cart.entries()].reduce((sum, [id, quantity]) => sum + ui.product(id).price * quantity, 0);
      const cash = Number(document.getElementById("cash-received").value);
      if (!Number.isFinite(cash) || cash < total) return ui.toast("Cash received must be at least " + ui.money(total) + ".", true);
      for (const [id, quantity] of cart) if (quantity > ui.product(id).stock) return ui.toast(`Stock changed. Only ${ui.product(id).stock} units of ${ui.product(id).name} are available.`, true);
      const sale = { id: ui.nextReceipt(), timestamp: new Date().toISOString(), user: state.settings.displayName || "Alex Morgan", items: [...cart.entries()].map(([id, quantity]) => { const product = ui.product(id); return { productId: id, name: product.name, quantity, price: product.price }; }), total, cash, change: cash - total };
      sale.items.forEach(item => { ui.product(item.productId).stock -= item.quantity; state.history.push({ id: Date.now() + item.productId, productId: item.productId, type: "OUT", quantity: item.quantity, date: sale.timestamp, reason: "Sale", reference: sale.id }); });
      state.sales.unshift(sale);
      try { window.SchoolStock.save(); sessionStorage.setItem("schoolstock-last-sale", JSON.stringify(sale)); }
      catch (error) { sale.items.forEach(item => { ui.product(item.productId).stock += item.quantity; }); state.sales.shift(); ui.toast(error.message || "Could not save the sale.", true); return; }
      location.href = "receipt.html";
    });
    drawProducts(); drawCart();
  }
  const receipt = document.getElementById("receipt-content");
  if (receipt) {
    let sale;
    try { sale = JSON.parse(sessionStorage.getItem("schoolstock-last-sale") || "null"); } catch (error) { console.error("Unable to read the last sale.", error); }
    if (!sale) {
      receipt.innerHTML = `<div class="empty-state"><h2>No recent receipt</h2><p>Complete a sale to see its receipt preview here.</p><a class="button primary" href="sales.html">Start a sale</a></div>`;
    } else {
      receipt.innerHTML = `<div class="receipt-head"><span class="brand-mark" style="margin:auto">S</span><h2>${ui.escape(state.settings.storeName)}</h2><p class="muted">${ui.escape(state.settings.contact || "School supplies and more")}</p><p class="muted">OFFICIAL DEMO RECEIPT</p></div><div class="receipt-meta"><span>Transaction</span><strong>${ui.escape(sale.id)}</strong></div><div class="receipt-meta"><span>Date &amp; time</span><strong>${ui.date(sale.timestamp, { month:"short", day:"numeric", year:"numeric", hour:"numeric", minute:"2-digit" })}</strong></div><div class="receipt-meta"><span>Served by</span><strong>${ui.escape(sale.user)}</strong></div><div class="table-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th class="align-right">Amount</th></tr></thead><tbody>${sale.items.map(item => `<tr><td>${ui.escape(item.name)}</td><td>${item.quantity}</td><td>${ui.money(item.price)}</td><td class="align-right">${ui.money(item.price * item.quantity)}</td></tr>`).join("")}</tbody></table></div><div class="receipt-total"><div class="grand"><span>Total</span><span>${ui.money(sale.total)}</span></div><div><span>Cash received</span><span>${ui.money(sale.cash)}</span></div><div><span>Change</span><span>${ui.money(sale.change)}</span></div></div><p class="muted" style="text-align:center;margin-top:22px">Thank you for supporting our school community!</p>`;
    }
    document.getElementById("print-receipt").addEventListener("click", () => window.print());
  }
})();
