(function () {
  if (!window.SS) return;
  const state = window.SchoolStock.get(), ui = window.SS, table = document.getElementById("suppliers-table");
  if (!table) return;
  const search = document.getElementById("supplier-search");
  const modal = document.getElementById("supplier-modal"), form = document.getElementById("supplier-form");
  const nameInput = document.getElementById("supplier-name"), contactInput = document.getElementById("supplier-contact");
  const phoneInput = document.getElementById("supplier-phone"), emailInput = document.getElementById("supplier-email");
  const addressInput = document.getElementById("supplier-address");
  const modalTitle = document.getElementById("supplier-modal-title"), modalDescription = document.getElementById("supplier-modal-description");
  const formError = document.getElementById("supplier-form-error");
  const addButton = document.getElementById("add-supplier");
  let editingSupplier = null, returnFocus = null;
  const draw = () => {
    const term = search.value.trim().toLowerCase();
    const list = state.suppliers.filter(item => [item.name, item.contact, item.email].some(value => value.toLowerCase().includes(term)));
    table.innerHTML = list.length ? list.map(item => `<tr><td><strong>${ui.escape(item.name)}</strong></td><td>${ui.escape(item.contact)}</td><td>${ui.escape(item.phone)}</td><td>${ui.escape(item.email)}</td><td>${ui.escape(item.address)}</td><td><button class="action-link" data-edit="${item.id}">Edit</button><button class="action-link danger-link" data-delete="${item.id}">Delete</button></td></tr>`).join("") : `<tr><td colspan="6" class="empty-state">No suppliers found.</td></tr>`;
  };
  const closeModal = (restoreFocus = true) => {
    modal.hidden = true;
    form.reset();
    formError.textContent = "";
    if (restoreFocus && returnFocus) returnFocus.focus();
  };
  const openModal = (item, trigger) => {
    editingSupplier = item;
    returnFocus = trigger;
    modalTitle.textContent = item ? "Edit supplier" : "Add supplier";
    modalDescription.textContent = item ? "Update the supplier details." : "Enter the supplier details.";
    nameInput.value = item?.name || "";
    contactInput.value = item?.contact || "";
    phoneInput.value = item?.phone || "";
    emailInput.value = item?.email || "";
    addressInput.value = item?.address || "";
    formError.textContent = "";
    modal.hidden = false;
    nameInput.focus();
  };
  addButton.addEventListener("click", event => openModal(null, event.currentTarget));
  document.getElementById("close-supplier-modal").addEventListener("click", closeModal);
  document.getElementById("cancel-supplier").addEventListener("click", closeModal);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = nameInput.value.trim(), contact = contactInput.value.trim();
    const phone = phoneInput.value.trim(), email = emailInput.value.trim();
    const address = addressInput.value.trim();
    if (!name) {
      formError.textContent = "Enter a supplier name.";
      nameInput.focus();
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formError.textContent = "Enter a valid email address.";
      emailInput.focus();
      return;
    }
    const updated = Boolean(editingSupplier);
    const values = { name, contact, phone, email, address };
    if (editingSupplier) Object.assign(editingSupplier, values);
    else state.suppliers.push({ id: window.SchoolStock.nextId("suppliers"), ...values });
    window.SchoolStock.save();
    closeModal(false);
    draw();
    editingSupplier = null;
    addButton.focus();
    ui.toast(updated ? "Supplier updated." : "Supplier added.");
  });
  search.addEventListener("input", draw);
  table.addEventListener("click", event => {
    const button = event.target.closest("[data-edit]"), remove = event.target.closest("[data-delete]");
    if (button) openModal(state.suppliers.find(item => item.id === Number(button.dataset.edit)), button);
    if (remove) {
      const item = state.suppliers.find(supplier => supplier.id === Number(remove.dataset.delete));
      if (state.products.some(product => product.supplierId === item.id)) return ui.toast("This supplier is assigned to products. Update those products before deleting it.", true);
      if (confirm(`Delete supplier “${item.name}”?`)) { state.suppliers = state.suppliers.filter(supplier => supplier.id !== item.id); window.SchoolStock.save(); draw(); ui.toast("Supplier deleted."); }
    }
  });
  draw();
})();
