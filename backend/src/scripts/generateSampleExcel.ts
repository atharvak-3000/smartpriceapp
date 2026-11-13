import * as XLSX from 'xlsx';
import * as path from 'path';
import productsData from '../data/products.json';

const run = () => {
  const excelRows = productsData.map((p: any) => ({
    "Product Name *": p.productName,
    "Product Code *": p.productCode,
    "Barcode": p.barcode || "",
    "Category *": p.category,
    "Brand *": p.brand,
    "Price *": p.price,
    "Sale Price *": p.salePrice,
    "MRP *": p.mrpPrice,
    "Wholesale Price": p.wholesalePrice,
    "Stock *": p.stock || 0,
    "Status": p.status || "active"
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  // Output paths
  const outputPathBackend = path.resolve(__dirname, '../../sample_products.xlsx');
  const outputPathRoot = path.resolve(__dirname, '../../../sample_products.xlsx');
  
  XLSX.writeFile(workbook, outputPathBackend);
  XLSX.writeFile(workbook, outputPathRoot);
  
  console.log(`\nSuccessfully generated updated Excel files at:\n${outputPathBackend}\n${outputPathRoot}\n`);
};

run();
