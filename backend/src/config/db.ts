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

export const connectDB = async (): Promise<void> => {
  try {
    const p = getPool();
    const connection = await p.getConnection();
    console.log(`MySQL Connected to database: ${process.env.DB_NAME || 'smartprice'}`);
    connection.release();
  } catch (error) {
    console.error(`Error connecting to MySQL database: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default getPool;
