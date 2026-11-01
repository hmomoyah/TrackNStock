INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Writing', 'Pens, pencils, and writing instruments'),
(2, 'Paper', 'Notebooks, pads, and paper products'),
(3, 'Art & Craft', 'Coloring and creative supplies'),
(4, 'Classroom', 'Everyday classroom essentials'),
(5, 'Organization', 'Folders and storage supplies')
ON DUPLICATE KEY UPDATE
category_name = VALUES(category_name),
description = VALUES(description);

INSERT INTO suppliers
(supplier_id, supplier_name, contact_person, phone, email, address) VALUES
(1, 'BrightStart School Goods', 'Mia Santos', '(02) 8123-4567', 'orders@brightstart.example', 'Quezon City, Metro Manila'),
(2, 'PaperTrail Trading', 'Noah Reyes', '(02) 8765-1020', 'sales@papertrail.example', 'Makati City, Metro Manila'),
(3, 'Classroom Corner Supply', 'Lia Cruz', '(032) 555-0198', 'hello@classroomcorner.example', 'Cebu City, Cebu')
ON DUPLICATE KEY UPDATE
supplier_name = VALUES(supplier_name),
contact_person = VALUES(contact_person),
phone = VALUES(phone),
email = VALUES(email),
address = VALUES(address);

INSERT INTO products
(product_id, product_name, category_id, supplier_id, quantity, unit, price, reorder_level, description) VALUES
(1001, 'Classic Ruled Notebook', 2, 2, 86, 'piece', 42.50, 20, '80 leaves, notebook-size ruled pages'),
(1002, 'Blue Ballpen', 1, 1, 145, 'piece', 12.00, 30, 'Smooth blue ink ballpoint pen'),
(1003, 'Yellow Pad Paper', 2, 2, 14, 'piece', 38.00, 20, 'Intermediate-size yellow writing pad'),
(1004, 'Bond Paper A4', 2, 2, 32, 'ream', 265.00, 10, 'Ream of 500 sheets, 80 gsm'),
(1005, 'Plastic Ruler 30cm', 4, 1, 48, 'piece', 18.50, 12, 'Clear 30 cm ruler'),
(1006, 'Safety Scissors', 3, 3, 9, 'piece', 55.00, 12, 'Rounded-tip student scissors'),
(1007, 'White Glue 40ml', 3, 3, 27, 'bottle', 24.00, 10, 'Washable white school glue'),
(1008, 'Pencil Eraser', 1, 1, 0, 'piece', 8.00, 15, 'Soft, non-smudge eraser'),
(1009, 'Expanding Folder', 5, 1, 18, 'piece', 32.00, 15, 'Durable assorted-color folder'),
(1010, 'Crayon Set 12 Colors', 3, 3, 22, 'set', 68.00, 10, '12 bright wax crayons')
ON DUPLICATE KEY UPDATE
product_name = VALUES(product_name),
category_id = VALUES(category_id),
supplier_id = VALUES(supplier_id),
quantity = VALUES(quantity),
unit = VALUES(unit),
price = VALUES(price),
reorder_level = VALUES(reorder_level),
description = VALUES(description);