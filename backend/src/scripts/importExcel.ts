import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import getPool from '../config/db';
import ProductModel from '../models/Product';

dotenv.config();

const showUsageAndExit = () => {
  console.log('\nUsage: npm run import-excel -- <path-to-excel-file> [--clear]\n');
  console.log('Example: npm run import-excel -- sample_products.xlsx --clear\n');
  process.exit(1);
};

// Clean price cell value into number or 'Not Listed'
const parsePriceCell = (value: any): number | string => {
  if (value === undefined || value === null || value === '' || String(value).trim() === '') {
    return 'Not Listed';
  }
  const str = String(value).trim();
  if (str.toLowerCase() === 'not listed') {
    return 'Not Listed';
  }
  const num = Number(str.replace(/[^0-9.-]+/g, ''));
  return isNaN(num) || num <= 0 ? 'Not Listed' : num;
};

// Map spreadsheet headers to product schema keys
const normalizeRow = (row: any, fallbackIndex: number): any => {
  const normalized: any = {};
  
  for (const key of Object.keys(row)) {
    const value = row[key];
    if (value === undefined || value === null || value === '') continue;

    const normalizedKey = key.toLowerCase().trim().replace(/[\s_*#-]/g, '');
    
    if (['productname', 'name', 'title', 'itemname'].includes(normalizedKey)) {
      normalized.productName = String(value).trim();
    } else if (['productcode', 'code', 'sku', 'itemcode'].includes(normalizedKey)) {
      normalized.productCode = String(value).toUpperCase().trim();
    } else if (['barcode', 'ean', 'upc', 'code128', 'bar'].includes(normalizedKey)) {
      normalized.barcode = String(value).trim();
    } else if (['category', 'type', 'group', 'dept', 'department'].includes(normalizedKey)) {
      normalized.category = String(value).trim();
    } else if (['brand', 'manufacturer', 'make', 'mfg'].includes(normalizedKey)) {
      normalized.brand = String(value).trim();
    } else if (['price', 'rate'].includes(normalizedKey)) {
      normalized.price = parsePriceCell(value);
    } else if (['saleprice', 'sellingprice', 'salesprice'].includes(normalizedKey)) {
      normalized.salePrice = parsePriceCell(value);
    } else if (['mrpprice', 'mrp'].includes(normalizedKey)) {
      normalized.mrpPrice = parsePriceCell(value);
    } else if (['wholesaleprice', 'dealerprice', 'wsprice'].includes(normalizedKey)) {
      normalized.wholesalePrice = parsePriceCell(value);
    } else if (['stock', 'qty', 'quantity'].includes(normalizedKey)) {
      normalized.stock = parseInt(String(value), 10) || 0;
    } else if (['status'].includes(normalizedKey)) {
      normalized.status = String(value).toLowerCase().trim() === 'inactive' ? 'inactive' : 'active';
    }
  }

  // Auto-generate SKU / Product Code if missing
  if (!normalized.productCode) {
    normalized.productCode = `SP-${String(fallbackIndex).padStart(4, '0')}`;
  }

  // Synchronize price and salePrice
  if (normalized.salePrice !== undefined && normalized.price === undefined) {
    normalized.price = normalized.salePrice;
  } else if (normalized.price !== undefined && normalized.salePrice === undefined) {
    normalized.salePrice = normalized.price;
  } else if (normalized.price === undefined && normalized.salePrice === undefined) {
    normalized.price = 'Not Listed';
    normalized.salePrice = 'Not Listed';
  }

  if (normalized.mrpPrice === undefined) {
    normalized.mrpPrice = 'Not Listed';
  }

  if (normalized.wholesalePrice === undefined) {
    normalized.wholesalePrice = 'Not Listed';
  }

  if (normalized.stock === undefined) {
    normalized.stock = 0;
  }

  if (normalized.status === undefined) {
    normalized.status = 'active';
  }

  return normalized;
};

const run = async () => {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  
  // Find index of the file path argument (ignore flags)
  const filePathArg = args.find(arg => !arg.startsWith('-'));
  if (!filePathArg) {
    console.error('Error: Excel file path is required.');
    showUsageAndExit();
  }

  const resolvedPath = path.resolve(filePathArg as string);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: File not found at ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`Reading Excel file: ${resolvedPath}...`);
  let workbook;
  try {
    workbook = XLSX.readFile(resolvedPath);
  } catch (err) {
    console.error('Failed to read Excel file:', err);
    process.exit(1);
  }

  // Choose 'Products' sheet if available, otherwise first sheet
  const sheetName = workbook.SheetNames.includes('Products') ? 'Products' : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

  if (rawRows.length === 0) {
    console.error('Error: Excel sheet is empty.');
    process.exit(1);
  }

  console.log(`Found ${rawRows.length} rows in sheet "${sheetName}". Connecting to MySQL database...`);
  
  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('Database connected successfully.');
  } catch (dbErr) {
    console.error('Database connection failed:', dbErr);
    process.exit(1);
  }

  if (shouldClear) {
    console.log('Flag --clear specified: Clearing existing products table...');
    await pool.query('DELETE FROM products');
    console.log('Existing products cleared.');
  }

  let successCount = 0;
  let updateCount = 0;
  let skipCount = 0;
  
  const errors: string[] = [];
  const codesInExcel = new Set<string>();

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2;
    const rawRow = rawRows[i];
    const data = normalizeRow(rawRow, i + 1);

    // Skip empty or instruction rows
    if (!data.productName || !data.category || !data.brand) {
      skipCount++;
      continue;
    }

    if (codesInExcel.has(data.productCode)) {
      data.productCode = `${data.productCode}-${i + 1}`;
    }
    codesInExcel.add(data.productCode);

    try {
      const existingProduct = await ProductModel.findByCode(data.productCode);

      if (existingProduct) {
        await ProductModel.update(existingProduct.id, {
          productName: data.productName,
          category: data.category,
          brand: data.brand,
          price: data.price,
          salePrice: data.salePrice,
          mrpPrice: data.mrpPrice,
          wholesalePrice: data.wholesalePrice,
          stock: data.stock,
          barcode: data.barcode || null,
          status: data.status,
        });
        updateCount++;
      } else {
        await ProductModel.create({
          productName: data.productName,
          productCode: data.productCode,
          barcode: data.barcode,
          category: data.category,
          brand: data.brand,
          price: data.price,
          salePrice: data.salePrice,
          mrpPrice: data.mrpPrice,
          wholesalePrice: data.wholesalePrice,
          stock: data.stock,
          status: data.status,
        });
        successCount++;
      }
    } catch (saveErr: any) {
      errors.push(`Row ${rowNum} (${data.productCode}): DB Save error: ${saveErr.message}`);
      skipCount++;
    }
  }

  console.log('\n======================================');
  console.log('        EXCEL IMPORT SUMMARY          ');
  console.log('======================================');
  console.log(`Successfully Created : ${successCount}`);
  console.log(`Successfully Updated : ${updateCount}`);
  console.log(`Skipped Rows         : ${skipCount}`);
  console.log(`Total Rows Processed : ${rawRows.length}`);
  console.log('======================================\n');

  if (errors.length > 0) {
    console.log('--- Warnings / Errors during import ---');
    errors.forEach(err => console.log(err));
    console.log('---------------------------------------\n');
  }

  process.exit(0);
};

run();
