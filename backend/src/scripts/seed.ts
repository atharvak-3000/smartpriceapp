import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import getPool from '../config/db';
import productsData from '../data/products.json';

dotenv.config();

const seedDB = async () => {
  try {
    const pool = getPool();
    console.log('Connecting to MySQL for seeding...');

    // Create tables if not exist with VARCHAR(50) for flexible price representation (e.g. 'Not Listed')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('owner', 'admin', 'staff', 'salesperson') NOT NULL DEFAULT 'staff',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        productName VARCHAR(255) NOT NULL,
        productCode VARCHAR(100) NOT NULL UNIQUE,
        barcode VARCHAR(100) UNIQUE DEFAULT NULL,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        description TEXT DEFAULT NULL,
        price VARCHAR(50) NOT NULL DEFAULT 'Not Listed',
        salePrice VARCHAR(50) NOT NULL DEFAULT 'Not Listed',
        mrpPrice VARCHAR(50) NOT NULL DEFAULT 'Not Listed',
        wholesalePrice VARCHAR(50) DEFAULT 'Not Listed',
        stock INT NOT NULL DEFAULT 0,
        imageUrl VARCHAR(500) DEFAULT NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_brand (brand),
        INDEX idx_category (category),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Clear Users
    await pool.query('DELETE FROM users');
    console.log('Cleared existing users.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    // Create Owner & Sales Person
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
      [
        'Store Owner', 'owner@smartprice.com', hashedPassword, 'owner',
        'Sales Person', 'sales@smartprice.com', hashedPassword, 'staff'
      ]
    );
    console.log('Created Owner (owner@smartprice.com) & Sales Person (sales@smartprice.com)');

    // Clear All Existing Products Data
    await pool.query('DELETE FROM products');
    console.log('Cleared all existing products data.');

    // Batch insert products
    const batchSize = 50;
    for (let i = 0; i < productsData.length; i += batchSize) {
      const batch = productsData.slice(i, i + batchSize);
      for (const p of batch) {
        await pool.query(
          `INSERT INTO products 
           (id, productName, productCode, barcode, category, brand, price, salePrice, mrpPrice, wholesalePrice, stock, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.productName,
            p.productCode,
            p.barcode || null,
            p.category,
            p.brand,
            String(p.price),
            String(p.salePrice),
            String(p.mrpPrice),
            String(p.wholesalePrice),
            p.stock || 0,
            p.status || 'active',
          ]
        );
      }
    }

    console.log(`Successfully seeded ${productsData.length} new products into MySQL.`);
    console.log('All existing app data cleared and new Excel catalog uploaded!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding MySQL database:', error);
    process.exit(1);
  }
};

seedDB();
