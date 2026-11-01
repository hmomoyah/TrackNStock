# TrackNStock

A browser-only school supply inventory demo built with semantic HTML, CSS, and vanilla JavaScript. It has separate pages for the requested workflows and stores demonstration changes in the browser's `localStorage`. There is no backend, database, remote API, or real authentication. The file structure leaves the UI and data-handling code separated so a Java/MySQL service can be introduced in a future version.

## Open in VS Code

1. Open Visual Studio Code and choose **File → Open Folder**.
2. Select the `schoolsupplyinventoysystem` project folder.
3. Install the **Live Server** extension by Ritwick Dey from the Extensions view.
4. In Explorer, right-click `login.html` or `dashboard.html` and choose **Open with Live Server**. You can also open either HTML file directly in a browser; Live Server is recommended for consistent local behavior.
5. Use the sidebar links to navigate among all 14 pages. Each page is its own HTML file and opens directly.

## Demo sign-in

- Administrator demo: `admin` / `schoolstock`
- Staff demo: `staff` / `schoolstock`

This is only a front-end demonstration. The credentials are visible in `js/app.js` and must never be used for real accounts or security.

## Demo data and persistence

- Fictional seed records live in `js/data.js`, separate from the UI behavior.
- `js/storage.js` initializes `localStorage` on first load, then saves edits, inventory movements, and sales in the `schoolstock-demo-v1` browser key.
- Changes persist in that browser on that device. They do not sync to another browser or computer.
- To restore the original sample products and records, open **Settings → Reset demo data**.
- If browser storage is disabled or full, the demo reports an error rather than claiming a save succeeded.

## Project map

```text
login.html, dashboard.html, products.html, product-form.html
categories.html, suppliers.html, stock-in.html, stock-out.html
sales.html, receipt.html, reports.html, low-stock.html
users.html, settings.html
css/
  style.css       theme, layout, responsive rules
  components.css  navigation and reusable interface components
  print.css       receipt and report print rules
js/
  data.js         separate fictional sample data
  storage.js      localStorage demo data access
  app.js          shared navigation, helpers, dashboard, settings
  products.js     product form, catalog, and low-stock view
  categories.js   category demo CRUD
  suppliers.js    supplier demo CRUD
  inventory.js    stock-in and stock-out movements
  sales.js        cart, checkout, and receipt
  reports.js      date filtering, CSV export, and printing
```

## Demonstration checklist

- Sign in with either demo account; use **Show** to reveal the password.
- Click the top-right profile to open **My Profile** or **Logout**. Logout asks for confirmation; **Cancel** keeps the session active, while **Yes, Logout** clears it and returns to the login page. The sidebar logout uses the same confirmation. Protected pages check the session on load and when restored with the browser Back button. The Remember Me choice only retains the demo username.
- Add or edit a product, search by name or ID, filter by category, and test deletion confirmation.
- Open **Users → Add User** to create a demo account. Usernames and email addresses must be unique; passwords are PBKDF2-hashed before the demo data is saved, and are never shown in the success details. Newly created accounts are for display/persistence demonstrations only and do not enable real authentication. Use Live Server for secure browser cryptography support.
- Add and edit categories and suppliers. Categories or suppliers assigned to products cannot be deleted until those products are reassigned.
- Record stock in and stock out. Stock-out quantities greater than available stock are rejected.
- Make a sale, adjust quantities, enter cash, and complete checkout. Insufficient cash or stock is rejected; successful sales update inventory and appear on the receipt, dashboard, and sales report.
- Change report type/date filters, export CSV, and print a report or receipt.
- Use Settings to adjust the store details or restore the original sample dataset.

## Future integration notes

`js/storage.js` is the demo persistence boundary and the modules use the `SchoolStock` state object. A future Java backend can replace that boundary with API calls while keeping the page structure and most rendering behavior. Do not place database credentials or private information in browser JavaScript.
