import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smartprice',
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
};

export const initDB = async (): Promise<void> => {
  const p = getPool();
  try {
    // 1. Create users table
    await p.query(`
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

    // 2. Create products table
    await p.query(`
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

    // 3. Seed default users if table is empty
    const [userRows]: any = await p.query('SELECT id FROM users LIMIT 1');
    if (!userRows || userRows.length === 0) {
      // Default bcrypt hash for 'Password123'
      const defaultHash = '$2a$10$Kh8jGUmZEuey.SM61lIwxufwzkTzSuvxB0tsDeaADGQQZVdlB9dKO';
      await p.query(`
        INSERT IGNORE INTO users (name, email, password, role) VALUES 
        ('Store Owner', 'owner@smartprice.com', ?, 'owner'),
        ('Sales Person', 'sales@smartprice.com', ?, 'staff')
      `, [defaultHash, defaultHash]);
      console.log('Seeded default owner & sales person accounts.');
    }

    // 4. Seed sample products if table is empty
    const [productRows]: any = await p.query('SELECT id FROM products LIMIT 1');
    if (!productRows || productRows.length === 0) {
      try {
        const productsData = require('../data/products.json');
        for (const pItem of productsData) {
          await p.query(`
            INSERT IGNORE INTO products (productName, productCode, barcode, category, brand, price, salePrice, mrpPrice, wholesalePrice, stock, status) VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            pItem.productName,
            pItem.productCode,
            pItem.barcode || null,
            pItem.category,
            pItem.brand,
            String(pItem.price),
            String(pItem.salePrice),
            String(pItem.mrpPrice),
            String(pItem.wholesalePrice),
            pItem.stock || 0,
            pItem.status || 'active'
          ]);
        }
        console.log(`Seeded ${productsData.length} catalog products into MySQL.`);
      } catch (seedErr) {
        console.warn('Notice: Catalog preloading skipped or already present.', seedErr);
      }
    }
  } catch (err) {
    console.error('Database auto-initialization notice:', err instanceof Error ? err.message : String(err));
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const p = getPool();
    const connection = await p.getConnection();
    console.log(`MySQL Connected to database: ${process.env.DB_NAME || 'smartprice'}`);
    connection.release();
    await initDB();
  } catch (error) {
    console.error(`Error connecting to MySQL database: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default getPool;
