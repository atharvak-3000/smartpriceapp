import getPool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface ProductRow extends RowDataPacket {
  id: number;
  productName: string;
  productCode: string;
  barcode: string | null;
  category: string;
  brand: string;
  description: string | null;
  price: number | string;
  salePrice: number | string;
  mrpPrice: number | string;
  wholesalePrice: number | string | null;
  stock: number;
  imageUrl: string | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface FormattedProduct {
  _id: string;
  id: string;
  productName: string;
  productCode: string;
  barcode?: string;
  category: string;
  brand: string;
  description?: string;
  price: number;
  salePrice: number;
  mrpPrice: number;
  wholesalePrice?: number;
  stock: number;
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export const formatProduct = (row: ProductRow, isSalesPerson: boolean = false): FormattedProduct => {
  const salePrice = Number(row.salePrice !== null && row.salePrice !== undefined ? row.salePrice : row.price);
  const mrpPrice = Number(row.mrpPrice !== null && row.mrpPrice !== undefined ? row.mrpPrice : salePrice);
  const wholesalePrice = row.wholesalePrice !== null && row.wholesalePrice !== undefined ? Number(row.wholesalePrice) : undefined;

  const formatted: FormattedProduct = {
    _id: String(row.id),
    id: String(row.id),
    productName: row.productName,
    productCode: row.productCode,
    barcode: row.barcode || undefined,
    category: row.category,
    brand: row.brand,
    description: row.description || undefined,
    price: salePrice,
    salePrice,
    mrpPrice,
    stock: Number(row.stock || 0),
    imageUrl: row.imageUrl || undefined,
    status: row.status || 'active',
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };

  if (!isSalesPerson && wholesalePrice !== undefined) {
    formatted.wholesalePrice = wholesalePrice;
  }

  return formatted;
};

export class ProductModel {
  static async findAll(): Promise<ProductRow[]> {
    const pool = getPool();
    const [rows] = await pool.query<ProductRow[]>('SELECT * FROM products ORDER BY productName ASC');
    return rows;
  }

  static async findById(id: number | string): Promise<ProductRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<ProductRow[]>('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByCode(code: string, excludeId?: number | string): Promise<ProductRow | null> {
    const pool = getPool();
    if (excludeId) {
      const [rows] = await pool.query<ProductRow[]>(
        'SELECT * FROM products WHERE UPPER(productCode) = UPPER(?) AND id != ? LIMIT 1',
        [code, excludeId]
      );
      return rows.length > 0 ? rows[0] : null;
    }
    const [rows] = await pool.query<ProductRow[]>(
      'SELECT * FROM products WHERE UPPER(productCode) = UPPER(?) LIMIT 1',
      [code]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByBarcode(barcode: string, excludeId?: number | string): Promise<ProductRow | null> {
    const pool = getPool();
    if (excludeId) {
      const [rows] = await pool.query<ProductRow[]>(
        'SELECT * FROM products WHERE barcode = ? AND id != ? LIMIT 1',
        [barcode, excludeId]
      );
      return rows.length > 0 ? rows[0] : null;
    }
    const [rows] = await pool.query<ProductRow[]>('SELECT * FROM products WHERE barcode = ? LIMIT 1', [barcode]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async search(query: string): Promise<ProductRow[]> {
    const pool = getPool();
    const pattern = `%${query}%`;
    const [rows] = await pool.query<ProductRow[]>(
      `SELECT * FROM products 
       WHERE productName LIKE ? OR productCode LIKE ? OR barcode = ? 
       ORDER BY productName ASC`,
      [pattern, pattern, query]
    );
    return rows;
  }

  static async create(data: {
    productName: string;
    productCode: string;
    barcode?: string;
    category: string;
    brand: string;
    description?: string;
    price: number;
    salePrice: number;
    mrpPrice: number;
    wholesalePrice?: number;
    stock: number;
    imageUrl?: string;
    status?: 'active' | 'inactive';
  }): Promise<ProductRow> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products 
       (productName, productCode, barcode, category, brand, description, price, salePrice, mrpPrice, wholesalePrice, stock, imageUrl, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.productName,
        data.productCode.toUpperCase().trim(),
        data.barcode ? data.barcode.trim() : null,
        data.category,
        data.brand,
        data.description || null,
        data.salePrice,
        data.salePrice,
        data.mrpPrice,
        data.wholesalePrice !== undefined ? data.wholesalePrice : null,
        data.stock || 0,
        data.imageUrl || null,
        data.status || 'active',
      ]
    );

    const created = await this.findById(result.insertId);
    if (!created) throw new Error('Failed to retrieve newly created product');
    return created;
  }

  static async update(
    id: number | string,
    data: Partial<{
      productName: string;
      productCode: string;
      barcode: string | null;
      category: string;
      brand: string;
      description: string | null;
      price: number;
      salePrice: number;
      mrpPrice: number;
      wholesalePrice: number | null;
      stock: number;
      imageUrl: string | null;
      status: 'active' | 'inactive';
    }>
  ): Promise<ProductRow | null> {
    const pool = getPool();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) {
        fields.push(`\`${key}\` = ?`);
        values.push(val);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async updateStock(id: number | string, newStock: number): Promise<ProductRow | null> {
    const pool = getPool();
    await pool.query('UPDATE products SET stock = ? WHERE id = ?', [Math.max(0, newStock), id]);
    return this.findById(id);
  }

  static async delete(id: number | string): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export default ProductModel;
