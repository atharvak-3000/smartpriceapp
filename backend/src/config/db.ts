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
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        salePrice DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        mrpPrice DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        wholesalePrice DECIMAL(10, 2) DEFAULT NULL,
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
      await p.query(`
        INSERT IGNORE INTO products (productName, productCode, barcode, category, brand, price, salePrice, mrpPrice, wholesalePrice, stock) VALUES
        ('Havells Life Line FR 1.5 Sq mm Wire Red', 'HW-15-RD', '8901786151011', 'Wires & Cables', 'Havells', 1540.00, 1540.00, 1925.00, 1309.00, 50),
        ('Havells Life Line FR 2.5 Sq mm Wire Black', 'HW-25-BK', '8901786151028', 'Wires & Cables', 'Havells', 2450.00, 2450.00, 3063.00, 2083.00, 50),
        ('Polycab Green FR 1.0 Sq mm Wire Blue', 'PW-10-BL', '8902891100345', 'Wires & Cables', 'Polycab', 1120.00, 1120.00, 1400.00, 952.00, 50),
        ('Anchor Roma 1 Way Switch 10A', 'AR-SW1-10', '8901112001015', 'Switches & Sockets', 'Anchor', 35.00, 35.00, 44.00, 30.00, 50),
        ('Anchor Roma 2 Way Switch 10A', 'AR-SW2-10', '8901112001022', 'Switches & Sockets', 'Anchor', 55.00, 55.00, 69.00, 47.00, 50),
        ('Legrand Arteor 1 Way Switch 20A', 'LG-SW1-20', '8901234005011', 'Switches & Sockets', 'Legrand', 180.00, 180.00, 225.00, 153.00, 50),
        ('Philips Stellar Bright LED Bulb 9W Cool Day Light', 'PL-LED9-CD', '8901097312015', 'LED & Lighting', 'Philips', 110.00, 110.00, 138.00, 94.00, 50),
        ('Philips Stellar Bright LED Bulb 12W Warm White', 'PL-LED12-WW', '8901097312039', 'LED & Lighting', 'Philips', 145.00, 145.00, 181.00, 123.00, 50),
        ('Havells Octane LED Batten 20W Cool White', 'HL-BT20-CW', '8901786520309', 'LED & Lighting', 'Havells', 320.00, 320.00, 400.00, 272.00, 50);
      `);
      console.log('Seeded default sample products into MySQL.');
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
