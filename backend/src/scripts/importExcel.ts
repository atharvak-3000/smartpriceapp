import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import getPool from '../config/db';
import ProductModel from '../models/Product';

dotenv.config();


const showUsageAndExit = () => {
  console.log('\nUsage: npm run import-excel -- <path-to-excel-file>\n');
  console.log('Example: npm run import-excel -- sample_products.xlsx\n');
  process.exit(1);
};

// Map spreadsheet headers to product schema keys
const normalizeRow = (row: any): any => {
  const normalized: any = {};
  
  for (const key of Object.keys(row)) {
    const value = row[key];
    if (value === undefined || value === null || value === '') continue;

    const normalizedKey = key.toLowerCase().trim().replace(/[\s_-]/g, '');
    
    if (['productname', 'name', 'title', 'itemname'].includes(normalizedKey)) {
      normalized.productName = String(value).trim();
    } else if (['productcode', 'code', 'sku', 'itemcode', 'id'].includes(normalizedKey)) {
      normalized.productCode = String(value).toUpperCase().trim();
    } else if (['barcode', 'ean', 'upc', 'code128', 'bar'].includes(normalizedKey)) {
      normalized.barcode = String(value).trim();
    } else if (['category', 'type', 'group', 'dept', 'department'].includes(normalizedKey)) {
      normalized.category = String(value).trim();
    } else if (['brand', 'manufacturer', 'make', 'mfg'].includes(normalizedKey)) {
      normalized.brand = String(value).trim();
    } else if (['price', 'rate', 'cost', 'mrp', 'sellingprice'].includes(normalizedKey)) {
      normalized.price = Number(value);
    }
  }
  return normalized;
};

const run = async () => {
  const args = process.argv.slice(2);
  
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

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

  if (rawRows.length === 0) {
    console.error('Error: Excel sheet is empty.');
    process.exit(1);
  }

  console.log(`Found ${rawRows.length} rows in sheet "${sheetName}". Connecting to MySQL database...`);
  
  try {
    const pool = getPool();
    const conn = await pool.getConnection();
    conn.release();
    console.log('Database connected successfully.');
  } catch (dbErr) {
    console.error('Database connection failed:', dbErr);
    process.exit(1);
  }


  let successCount = 0;
  let updateCount = 0;
  let skipCount = 0;
  
  const errors: string[] = [];

  // Tracks productCodes and barcodes seen in the current Excel file to avoid internal duplicates
  const codesInExcel = new Set<string>();
  const barcodesInExcel = new Set<string>();

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2; // Excel is 1-indexed, header is row 1
    const rawRow = rawRows[i];
    const data = normalizeRow(rawRow);

    // 1. Validation
    const missingFields: string[] = [];
    if (!data.productName) missingFields.push('productName');
    if (!data.productCode) missingFields.push('productCode');
    if (!data.category) missingFields.push('category');
    if (!data.brand) missingFields.push('brand');
    if (data.price === undefined || isNaN(data.price)) missingFields.push('price');

    if (missingFields.length > 0) {
      errors.push(`Row ${rowNum}: Skipped due to missing/invalid fields: ${missingFields.join(', ')}`);
      skipCount++;
      continue;
    }

    if (data.price < 0) {
      errors.push(`Row ${rowNum} (${data.productCode}): Price cannot be negative. Got: ${data.price}`);
      skipCount++;
      continue;
    }

    // 2. Excel sheet uniqueness checks
    if (codesInExcel.has(data.productCode)) {
      errors.push(`Row ${rowNum} (${data.productCode}): Duplicate productCode in Excel sheet.`);
      skipCount++;
      continue;
    }
    codesInExcel.add(data.productCode);

    if (data.barcode) {
      if (barcodesInExcel.has(data.barcode)) {
        errors.push(`Row ${rowNum} (${data.productCode}): Duplicate barcode '${data.barcode}' in Excel sheet.`);
        skipCount++;
        continue;
      }
      barcodesInExcel.add(data.barcode);
    }

    // 3. Database uniqueness and existance check (upsert logic)
    try {
      // Check if code already exists under another ID
      const existingProductByCode = await ProductModel.findByCode(data.productCode);
      
      if (data.barcode) {
        // Enforce barcode uniqueness against DB
        const existingProductByBarcode = await ProductModel.findByBarcode(data.barcode);
        if (existingProductByBarcode && existingProductByBarcode.productCode !== data.productCode) {
          errors.push(`Row ${rowNum} (${data.productCode}): Barcode '${data.barcode}' already registered to product '${existingProductByBarcode.productName}' (${existingProductByBarcode.productCode}) in database.`);
          skipCount++;
          continue;
        }
      }

      if (existingProductByCode) {
        // Update product (Upsert)
        await ProductModel.update(existingProductByCode.id, {
          productName: data.productName,
          category: data.category,
          brand: data.brand,
          price: data.price,
          salePrice: data.price,
          barcode: data.barcode || null,
        });
        updateCount++;
      } else {
        // Insert new product
        await ProductModel.create({
          productName: data.productName,
          productCode: data.productCode,
          barcode: data.barcode,
          category: data.category,
          brand: data.brand,
          price: data.price,
          salePrice: data.price,
          mrpPrice: Math.round(data.price * 1.25),
          stock: 0,
        });
        successCount++;
      }
    } catch (saveErr: any) {
      errors.push(`Row ${rowNum} (${data.productCode}): DB Save error: ${saveErr.message}`);
      skipCount++;
    }
  }


  // 4. Summarize results
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
