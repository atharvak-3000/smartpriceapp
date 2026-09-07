import getPool from '../config/db';
import bcrypt from 'bcryptjs';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'owner' | 'admin' | 'staff' | 'salesperson';
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  static async findByEmail(email: string): Promise<UserRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async findById(id: number | string): Promise<UserRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, name, email, role, createdAt, updatedAt FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async matchPassword(enteredPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }

  static async create(name: string, email: string, rawPassword: string, role: string = 'staff'): Promise<number> {
    const pool = getPool();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    return result.insertId;
  }
}

export default UserModel;
