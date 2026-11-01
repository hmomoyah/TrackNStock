(function () {
  if (!window.SS) return;
  const state = window.SchoolStock.get(), ui = window.SS, table = document.getElementById("categories-table");
  if (!table) return;
  const search = document.getElementById("category-search");
  const modal = document.getElementById("category-modal"), form = document.getElementById("category-form");
  const nameInput = document.getElementById("category-name"), descriptionInput = document.getElementById("category-description");
  const modalTitle = document.getElementById("category-modal-title"), modalDescription = document.getElementById("category-modal-description");
  const formError = document.getElementById("category-form-error");
  let editingCategory = null, returnFocus = null;
  const draw = () => {
    const term = search.value.trim().toLowerCase();
    const list = state.categories.filter(item => item.name.toLowerCase().includes(term));
    table.innerHTML = list.length ? list.map(item => `<tr><td><strong>${ui.escape(item.name)}</strong></td><td>${ui.escape(item.description || "—")}</td><td>${state.products.filter(product => product.categoryId === item.id).length}</td><td><button class="action-link" data-edit="${item.id}">Edit</button><button class="action-link danger-link" data-delete="${item.id}">Delete</button></td></tr>`).join("") : `<tr><td colspan="4" class="empty-state">No categories found.</td></tr>`;
  };
  const closeModal = (restoreFocus = true) => {
    modal.hidden = true;
    form.reset();
    formError.textContent = "";
    if (restoreFocus && returnFocus) returnFocus.focus();
  };
  const openModal = (item, trigger) => {
    editingCategory = item;
    returnFocus = trigger;
    modalTitle.textContent = item ? "Edit category" : "Add category";
    modalDescription.textContent = item ? "Update the category details." : "Enter the category details.";
    nameInput.value = item?.name || "";
    descriptionInput.value = item?.description || "";
    formError.textContent = "";
    modal.hidden = false;
    nameInput.focus();
  };
  document.getElementById("add-category").addEventListener("click", event => openModal(null, event.currentTarget));
  document.getElementById("close-category-modal").addEventListener("click", closeModal);
  document.getElementById("cancel-category").addEventListener("click", closeModal);
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = nameInput.value.trim(), description = descriptionInput.value.trim();
    if (!name) {
      formError.textContent = "Enter a category name.";
      nameInput.focus();
      return;
    }
    if (state.categories.some(category => category.name.toLowerCase() === name.toLowerCase() && category.id !== editingCategory?.id)) {
      formError.textContent = "A category with that name already exists.";
      nameInput.focus();
      return;
    }
    const updated = Boolean(editingCategory);
    if (editingCategory) Object.assign(editingCategory, { name, description });
    else state.categories.push({ id: window.SchoolStock.nextId("categories"), name, description });
    window.SchoolStock.save();
    closeModal(false);
    draw();
    editingCategory = null;
    document.getElementById("add-category").focus();
    ui.toast(updated ? "Category updated." : "Category added.");
  });
  search.addEventListener("input", draw);
  table.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit]"), remove = event.target.closest("[data-delete]");
    if (edit) openModal(state.categories.find(item => item.id === Number(edit.dataset.edit)), edit);
    if (remove) {
      const item = state.categories.find(category => category.id === Number(remove.dataset.delete));
      if (state.products.some(product => product.categoryId === item.id)) return ui.toast("This category is assigned to products. Reassign them before deleting it.", true);
      if (confirm(`Delete category “${item.name}”?`)) { state.categories = state.categories.filter(category => category.id !== item.id); window.SchoolStock.save(); draw(); ui.toast("Category deleted."); }
    }
  });
  draw();
})();
