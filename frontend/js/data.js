// The demo seed data is kept separate from page behavior for an easier future backend swap.
window.SchoolStockSeed = {
  categories: [
    { id: 1, name: "Writing", description: "Pens, pencils, and writing instruments" },
    { id: 2, name: "Paper", description: "Notebooks, pads, and paper products" },
    { id: 3, name: "Art & Craft", description: "Coloring and creative supplies" },
    { id: 4, name: "Classroom", description: "Everyday classroom essentials" },
    { id: 5, name: "Organization", description: "Folders and storage supplies" }
  ],
  suppliers: [
    { id: 1, name: "BrightStart School Goods", contact: "Mia Santos", phone: "(02) 8123-4567", email: "orders@brightstart.example", address: "Quezon City, Metro Manila" },
    { id: 2, name: "PaperTrail Trading", contact: "Noah Reyes", phone: "(02) 8765-1020", email: "sales@papertrail.example", address: "Makati City, Metro Manila" },
    { id: 3, name: "Classroom Corner Supply", contact: "Lia Cruz", phone: "(032) 555-0198", email: "hello@classroomcorner.example", address: "Cebu City, Cebu" }
  ],
  products: [
    { id: 1001, name: "Classic Ruled Notebook", categoryId: 2, supplierId: 2, price: 42.5, stock: 86, minStock: 20, description: "80 leaves,  notebook-size ruled pages" },
    { id: 1002, name: "Blue Ballpen", categoryId: 1, supplierId: 1, price: 12, stock: 145, minStock: 30, description: "Smooth blue ink ballpoint pen" },
    { id: 1003, name: "Yellow Pad Paper", categoryId: 2, supplierId: 2, price: 38, stock: 14, minStock: 20, description: "Intermediate-size yellow writing pad" },
    { id: 1004, name: "Bond Paper A4", categoryId: 2, supplierId: 2, price: 265, stock: 32, minStock: 10, description: "Ream of 500 sheets, 80 gsm" },
    { id: 1005, name: "Plastic Ruler 30cm", categoryId: 4, supplierId: 1, price: 18.5, stock: 48, minStock: 12, description: "Clear 30 cm ruler" },
    { id: 1006, name: "Safety Scissors", categoryId: 3, supplierId: 3, price: 55, stock: 9, minStock: 12, description: "Rounded-tip student scissors" },
    { id: 1007, name: "White Glue 40ml", categoryId: 3, supplierId: 3, price: 24, stock: 27, minStock: 10, description: "Washable white school glue" },
    { id: 1008, name: "Pencil Eraser", categoryId: 1, supplierId: 1, price: 8, stock: 0, minStock: 15, description: "Soft, non-smudge eraser" },
    { id: 1009, name: "Expanding Folder", categoryId: 5, supplierId: 1, price: 32, stock: 18, minStock: 15, description: "Durable assorted-color folder" },
    { id: 1010, name: "Crayon Set 12 Colors", categoryId: 3, supplierId: 3, price: 68, stock: 22, minStock: 10, description: "12 bright wax crayons" }
  ],
  users: [
    { id: 1, username: "admin", name: "Alex Morgan", email: "alex.morgan@example.test", phone: "(02) 8000-0101", role: "Administrator", status: "Active", createdAt: "2026-01-05T09:00:00.000Z" },
    { id: 2, username: "staff", name: "Jamie Rivera", email: "jamie.rivera@example.test", phone: "(02) 8000-0102", role: "Staff", status: "Active", createdAt: "2026-01-12T09:00:00.000Z" },
    { id: 3, username: "stock.clerk", name: "Taylor Santos", email: "taylor.santos@example.test", phone: "(02) 8000-0103", role: "Staff", status: "Active", createdAt: "2026-02-01T09:00:00.000Z" }
  ],
  sales: [
    { id: "SS-2026-0148", timestamp: new Date(Date.now() - 1000 * 60 * 41).toISOString(), user: "Jamie Rivera", items: [{ productId: 1002, name: "Blue Ballpen", quantity: 5, price: 12 }, { productId: 1001, name: "Classic Ruled Notebook", quantity: 2, price: 42.5 }], total: 145, cash: 200, change: 55 },
    { id: "SS-2026-0147", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), user: "Alex Morgan", items: [{ productId: 1004, name: "Bond Paper A4", quantity: 1, price: 265 }], total: 265, cash: 300, change: 35 },
    { id: "SS-2026-0146", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(), user: "Jamie Rivera", items: [{ productId: 1007, name: "White Glue 40ml", quantity: 3, price: 24 }, { productId: 1005, name: "Plastic Ruler 30cm", quantity: 2, price: 18.5 }], total: 109, cash: 150, change: 41 },
    { id: "SS-2026-0145", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), user: "Alex Morgan", items: [{ productId: 1010, name: "Crayon Set 12 Colors", quantity: 2, price: 68 }], total: 136, cash: 150, change: 14 }
  ],
  history: [],
  settings: { storeName: "TrackNStock Supply Store", contact: "tracknstock@example.test · (02) 8000-2026", currency: "PHP", minStock: 10, displayName: "Alex Morgan" }
};
