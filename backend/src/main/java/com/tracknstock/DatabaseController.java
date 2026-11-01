package com.tracknstock;

import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;

@CrossOrigin(origins = "*")
@RestController
public class DatabaseController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/health")
    public Map<String, String> checkConnection() {
        jdbcTemplate.queryForObject("SELECT 1", Integer.class);

        return Map.of(
            "status", "success",
            "message", "TrackNStock database connected successfully!"
        );
    }

    @GetMapping("/api/tables")
    public List<String> getTables() {
        return jdbcTemplate.queryForList(
            "SHOW TABLES",
            String.class
        );
    }

    @GetMapping("/api/products")
    public List<Map<String, Object>> getProducts() {
        String sql = """
            SELECT
                product_id AS id,
                product_name AS name,
                category_id AS categoryId,
                supplier_id AS supplierId,
                quantity AS stock,
                unit,
                price,
                reorder_level AS minStock,
                description
            FROM products
            ORDER BY product_id
            """;

        return jdbcTemplate.queryForList(sql);
    }

    @PostMapping("/api/products")
    public Map<String, Object> addProduct(@RequestBody Map<String, Object> product) {
        String sql = """
            INSERT INTO products
            (product_name, category_id, supplier_id, quantity, unit,
             price, reorder_level, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(
            sql,
            product.get("name"),
            product.get("categoryId"),
            product.get("supplierId"),
            product.get("stock"),
            product.getOrDefault("unit", "piece"),
            product.get("price"),
            product.get("minStock"),
            product.get("description")
        );

        return Map.of("message", "Product added successfully!");
    }

    @PutMapping("/api/products/{id}")
    public Map<String, Object> updateProduct(
            @PathVariable int id,
            @RequestBody Map<String, Object> product) {

        String sql = """
            UPDATE products
            SET product_name = ?,
                category_id = ?,
                supplier_id = ?,
                quantity = ?,
                unit = COALESCE(?, unit),
                price = ?,
                reorder_level = ?,
                description = ?
            WHERE product_id = ?
            """;

        int updated = jdbcTemplate.update(
            sql,
            product.get("name"),
            product.get("categoryId"),
            product.get("supplierId"),
            product.get("stock"),
            product.getOrDefault("unit", "piece"),
            product.get("price"),
            product.get("minStock"),
            product.get("description"),
            id
        );

        if (updated == 0) {
            throw new RuntimeException("Product not found.");
        }

        return Map.of("message", "Product updated successfully!");
    }

    @DeleteMapping("/api/products/{id}")
    public Map<String, Object> deleteProduct(@PathVariable int id) {
        int deleted = jdbcTemplate.update(
            "DELETE FROM products WHERE product_id = ?",
            id
        );

        if (deleted == 0) {
            throw new RuntimeException("Product not found.");
        }

        return Map.of("message", "Product deleted successfully!");
    }

    @PostMapping("/api/stock-in")
    public Map<String, Object> stockIn(@RequestBody Map<String, Object> data) {
        int productId = ((Number) data.get("productId")).intValue();
        int quantity = ((Number) data.get("quantity")).intValue();

        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than zero.");
        }

        int updated = jdbcTemplate.update(
            "UPDATE products SET quantity = quantity + ? WHERE product_id = ?",
            quantity, productId
        );

        if (updated == 0) {
            throw new RuntimeException("Product not found.");
        }

        jdbcTemplate.update(
            """
            INSERT INTO stock_transactions
            (product_id, transaction_type, quantity, transaction_date, remarks)
            VALUES (?, 'STOCK_IN', ?, ?, ?)
            """,
            productId,
            quantity,
            data.get("date"),
            data.get("notes")
        );

        return Map.of("message", "Stock in recorded successfully!");
    }

    @PostMapping("/api/stock-out")
    public Map<String, Object> stockOut(@RequestBody Map<String, Object> data) {
        int productId = ((Number) data.get("productId")).intValue();
        int quantity = ((Number) data.get("quantity")).intValue();

        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than zero.");
        }

        int updated = jdbcTemplate.update(
            """
            UPDATE products
            SET quantity = quantity - ?
            WHERE product_id = ? AND quantity >= ?
            """,
            quantity, productId, quantity
        );

        if (updated == 0) {
            throw new RuntimeException("Insufficient stock or product not found.");
        }

        jdbcTemplate.update(
            """
            INSERT INTO stock_transactions
            (product_id, transaction_type, quantity, transaction_date, remarks)
            VALUES (?, 'STOCK_OUT', ?, ?, ?)
            """,
            productId,
            quantity,
            data.get("date"),
            data.get("reason")
        );

        return Map.of("message", "Stock out recorded successfully!");
    }

    @GetMapping("/api/stock-transactions")
    public List<Map<String, Object>> getStockTransactions() {
        String sql = """
            SELECT
                st.transaction_id AS id,
                st.product_id AS productId,
                p.product_name AS productName,
                st.transaction_type AS type,
                st.quantity,
                st.transaction_date AS date,
                st.remarks
            FROM stock_transactions st
            JOIN products p ON st.product_id = p.product_id
            ORDER BY st.transaction_date DESC
            """;

        return jdbcTemplate.queryForList(sql);
    }

        @Transactional
    @PostMapping("/api/demo/reset")
    public Map<String, Object> resetDemoData() {

        jdbcTemplate.update("DELETE FROM stock_transactions");

        jdbcTemplate.update("""
            UPDATE products
            SET quantity = CASE product_id
                WHEN 1001 THEN 86
                WHEN 1002 THEN 145
                WHEN 1003 THEN 14
                WHEN 1004 THEN 32
                WHEN 1005 THEN 48
                WHEN 1006 THEN 9
                WHEN 1007 THEN 27
                WHEN 1008 THEN 0
                WHEN 1009 THEN 18
                WHEN 1010 THEN 22
                ELSE quantity
            END
            WHERE product_id BETWEEN 1001 AND 1010
            """);

        return Map.of(
            "status", "success",
            "message", "Demo data has been reset successfully!"
        );
    }
}