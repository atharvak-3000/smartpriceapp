import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import getPool from '../config/db';

dotenv.config();


// Helper to generate a 13-digit EAN barcode starting with 890
let barcodeCounter = 1000000001;
const generateBarcode = (): string => {
  barcodeCounter++;
  const base = `890${barcodeCounter}`;
  // EAN-13 check digit calculation
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base}${checkDigit}`;
};

// Generates ~1000 realistic electrical inventory products
const generateProducts = () => {
  const products: any[] = [];
  const generatedCodes = new Set<string>();

  const addProduct = (item: {
    productName: string;
    productCode: string;
    category: string;
    brand: string;
    price: number;
  }) => {
    // Enforce code uniqueness
    let code = item.productCode.toUpperCase().trim();
    let counter = 1;
    while (generatedCodes.has(code)) {
      code = `${item.productCode.toUpperCase()}-${counter}`;
      counter++;
    }
    generatedCodes.add(code);

    products.push({
      productName: item.productName,
      productCode: code,
      barcode: generateBarcode(),
      category: item.category,
      brand: item.brand,
      price: item.price,
    });
  };

  // 1. Wires & Cables (~420 items)
  const wireBrands = ['Havells', 'Polycab', 'Finolex', 'RR Kabel'];
  const wireSizes = ['0.75', '1.0', '1.5', '2.5', '4.0', '6.0', '10.0'];
  const wireColors = ['Red', 'Black', 'Blue', 'Green', 'Yellow'];
  const wireTypes = ['FR', 'FRLH', 'ZHFR'];

  for (const brand of wireBrands) {
    for (const size of wireSizes) {
      for (const color of wireColors) {
        for (const type of wireTypes) {
          const sizeNum = parseFloat(size);
          const price = Math.round((sizeNum * 800 + (type === 'ZHFR' ? 200 : type === 'FRLH' ? 100 : 0)) * (0.9 + Math.random() * 0.2));
          const name = `${brand} ${type} ${size} Sq mm Wire ${color}`;
          const brandCode = brand.substring(0, 2).toUpperCase();
          const typeCode = type;
          const sizeCode = size.replace('.', '');
          const colorCode = color.substring(0, 2).toUpperCase();
          const productCode = `${brandCode}-W-${typeCode}-${sizeCode}-${colorCode}`;

          addProduct({
            productName: name,
            productCode,
            category: 'Wires & Cables',
            brand,
            price,
          });
        }
      }
    }
  }

  // 2. Switches & Sockets (~108 items)
  const switchBrands = ['Anchor', 'Legrand', 'Schneider', 'Goldmedal'];
  const switchSeriesMap: Record<string, string> = {
    Anchor: 'Roma',
    Legrand: 'Arteor',
    Schneider: 'Livia',
    Goldmedal: 'Curve',
  };
  const switchItems = [
    { name: '1 Way Switch 10A', suffix: 'SW1-10', basePrice: 35 },
    { name: '2 Way Switch 10A', suffix: 'SW2-10', basePrice: 55 },
    { name: '1 Way Switch 20A', suffix: 'SW1-20', basePrice: 120 },
    { name: '2 Way Switch 20A', suffix: 'SW2-20', basePrice: 150 },
    { name: '3 Pin Socket 6A', suffix: 'SK3-06', basePrice: 65 },
    { name: '3 Pin Socket 16A', suffix: 'SK3-16', basePrice: 95 },
    { name: 'Universal Socket 13A', suffix: 'SK-UNIV', basePrice: 220 },
    { name: 'Fan Regulator 2 Module', suffix: 'FR-2M', basePrice: 320 },
    { name: '1 Module Dummy Plate', suffix: 'DP-1M', basePrice: 15 },
  ];
  const switchColors = ['White', 'Silver', 'Charcoal'];

  for (const brand of switchBrands) {
    const series = switchSeriesMap[brand];
    for (const item of switchItems) {
      for (const color of switchColors) {
        const colorMultiplier = color === 'Charcoal' ? 1.25 : color === 'Silver' ? 1.15 : 1.0;
        const price = Math.round(item.basePrice * colorMultiplier * (0.95 + Math.random() * 0.1));
        const name = `${brand} ${series} ${item.name} (${color})`;
        const brandCode = brand.substring(0, 2).toUpperCase();
        const colorCode = color.substring(0, 2).toUpperCase();
        const productCode = `${brandCode}-${item.suffix}-${colorCode}`;

        addProduct({
          productName: name,
          productCode,
          category: 'Switches & Sockets',
          brand,
          price,
        });
      }
    }
  }

  // 3. LED & Lighting (~144 items)
  const lightBrands = ['Philips', 'Havells', 'Syska', 'Crompton'];
  const lightStyles = [
    { type: 'LED Bulb', watt: '7W', suffix: 'BLB-7W', basePrice: 85 },
    { type: 'LED Bulb', watt: '9W', suffix: 'BLB-9W', basePrice: 110 },
    { type: 'LED Bulb', watt: '12W', suffix: 'BLB-12W', basePrice: 145 },
    { type: 'LED Bulb', watt: '15W', suffix: 'BLB-15W', basePrice: 195 },
    { type: 'LED Bulb', watt: '18W', suffix: 'BLB-18W', basePrice: 240 },
    { type: 'LED Batten', watt: '18W', suffix: 'BTN-18W', basePrice: 220 },
    { type: 'LED Batten', watt: '20W', suffix: 'BTN-20W', basePrice: 280 },
    { type: 'LED Batten', watt: '22W', suffix: 'BTN-22W', basePrice: 320 },
    { type: 'LED Batten', watt: '24W', suffix: 'BTN-24W', basePrice: 360 },
    { type: 'LED Downlight', watt: '9W', suffix: 'DL-9W', basePrice: 310 },
    { type: 'LED Downlight', watt: '12W', suffix: 'DL-12W', basePrice: 420 },
    { type: 'LED Downlight', watt: '15W', suffix: 'DL-15W', basePrice: 520 },
  ];
  const lightColors = ['Cool Day Light', 'Warm White', 'Neutral White'];

  for (const brand of lightBrands) {
    for (const style of lightStyles) {
      for (const color of lightColors) {
        const name = `${brand} ${style.type} ${style.watt} (${color})`;
        const brandCode = brand.substring(0, 2).toUpperCase();
        const colorCode = color.split(' ').map(w => w[0]).join('').toUpperCase();
        const productCode = `${brandCode}-${style.suffix}-${colorCode}`;
        const price = Math.round(style.basePrice * (0.95 + Math.random() * 0.1));

        addProduct({
          productName: name,
          productCode,
          category: 'LED & Lighting',
          brand,
          price,
        });
      }
    }
  }

  // 4. Circuit Breakers (~256 items)
  const mcbBrands = ['Havells', 'L&T', 'Schneider', 'Legrand'];
  const mcbPoles = [
    { name: 'Single Pole', code: '1P' },
    { name: 'Double Pole', code: '2P' },
    { name: 'Triple Pole', code: '3P' },
    { name: 'Four Pole', code: '4P' }
  ];
  const mcbAmps = ['6A', '10A', '16A', '20A', '25A', '32A', '40A', '63A'];
  const mcbCurves = ['B-Curve', 'C-Curve'];

  for (const brand of mcbBrands) {
    for (const pole of mcbPoles) {
      for (const amp of mcbAmps) {
        for (const curve of mcbCurves) {
          const name = `${brand} ${pole.name} MCB ${amp} ${curve}`;
          const brandCode = brand.substring(0, 2).toUpperCase();
          const poleCode = pole.code;
          const ampVal = amp.replace('A', '');
          const curveCode = curve.substring(0, 1).toUpperCase();
          const productCode = `${brandCode}-MCB-${poleCode}-${ampVal}-${curveCode}`;

          // Price calculation based on poles and amps
          const poleMultiplier = pole.code === '1P' ? 1 : pole.code === '2P' ? 2.2 : pole.code === '3P' ? 3.5 : 4.8;
          const ampMultiplier = parseInt(ampVal) > 32 ? 1.4 : 1.0;
          const price = Math.round(150 * poleMultiplier * ampMultiplier * (0.95 + Math.random() * 0.1));

          addProduct({
            productName: name,
            productCode,
            category: 'Circuit Breakers (MCB)',
            brand,
            price,
          });
        }
      }
    }
  }

  // 5. PVC Conduits (~57 items)
  const pvcBrands = ['Precision', 'Supreme', 'Finolex'];
  const pvcConduits = [
    { type: 'PVC Conduit Pipe 20mm', suffix: 'CP20', basePrice: 60 },
    { type: 'PVC Conduit Pipe 25mm', suffix: 'CP25', basePrice: 80 },
    { type: 'PVC Conduit Pipe 32mm', suffix: 'CP32', basePrice: 110 },
  ];
  const pvcDuties = ['Light Duty', 'Medium Duty', 'Heavy Duty'];

  for (const brand of pvcBrands) {
    // Add conduits
    for (const cond of pvcConduits) {
      for (const duty of pvcDuties) {
        const dutyMultiplier = duty === 'Heavy Duty' ? 1.35 : duty === 'Medium Duty' ? 1.15 : 1.0;
        const price = Math.round(cond.basePrice * dutyMultiplier * (0.98 + Math.random() * 0.04));
        const name = `${brand} ${cond.type} ${duty} 3m`;
        const brandCode = brand.substring(0, 2).toUpperCase();
        const dutyCode = duty.split(' ').map(w => w[0]).join('').toUpperCase();
        const productCode = `${brandCode}-${cond.suffix}-${dutyCode}`;

        addProduct({
          productName: name,
          productCode,
          category: 'PVC Conduits',
          brand,
          price,
        });
      }
    }

    // Add Junction Boxes (1, 2, 3, 4 ways for 20mm and 25mm)
    const jbSizes = ['20mm', '25mm'];
    for (const size of jbSizes) {
      for (let ways = 1; ways <= 4; ways++) {
        const name = `${brand} PVC Deep Junction Box ${ways} Way ${size}`;
        const brandCode = brand.substring(0, 2).toUpperCase();
        const sizeCode = size.replace('mm', '');
        const productCode = `${brandCode}-JB${sizeCode}-${ways}W`;
        const price = Math.round((15 + ways * 3 + (size === '25mm' ? 4 : 0)) * (0.95 + Math.random() * 0.1));

        addProduct({
          productName: name,
          productCode,
          category: 'PVC Conduits',
          brand,
          price,
        });
      }
    }

    // Add PVC Bends
    const bendSizes = ['20mm', '25mm'];
    for (const size of bendSizes) {
      const name = `${brand} PVC Bend ${size}`;
      const brandCode = brand.substring(0, 2).toUpperCase();
      const sizeCode = size.replace('mm', '');
      const productCode = `${brandCode}-BND${sizeCode}`;
      const price = Math.round((8 + (size === '25mm' ? 3 : 0)) * (0.95 + Math.random() * 0.1));

      addProduct({
        productName: name,
        productCode,
        category: 'PVC Conduits',
        brand,
        price,
      });
    }
  }

  // 6. Tools & Accessories (~42 items)
  const toolBrands = ['Taparia', 'Stanley', 'Bosch'];
  const toolTemplates = [
    { name: 'Line Tester 500V', suffix: 'LT-500', price: 85 },
    { name: 'Combination Plier 6 inch', suffix: 'CP-6', price: 180 },
    { name: 'Combination Plier 7 inch', suffix: 'CP-7', price: 220 },
    { name: 'Combination Plier 8 inch', suffix: 'CP-8', price: 265 },
    { name: 'Nose Plier 6 inch', suffix: 'NP-6', price: 175 },
    { name: 'Nose Plier 8 inch', suffix: 'NP-8', price: 210 },
    { name: 'Screwdriver Set (5 Pieces)', suffix: 'SD-5P', price: 290 },
    { name: 'Screwdriver Set (8 Pieces)', suffix: 'SD-8P', price: 420 },
    { name: 'Digital Multimeter', suffix: 'DMM', price: 650 },
    { name: 'PVC Insulation Tape Black 1.8cm x 7m', suffix: 'TAPE-BK', price: 15 },
    { name: 'PVC Insulation Tape Red 1.8cm x 7m', suffix: 'TAPE-RD', price: 15 },
    { name: 'PVC Insulation Tape Blue 1.8cm x 7m', suffix: 'TAPE-BL', price: 15 },
    { name: 'PVC Insulation Tape Yellow 1.8cm x 7m', suffix: 'TAPE-YL', price: 15 },
    { name: 'PVC Insulation Tape Green 1.8cm x 7m', suffix: 'TAPE-GR', price: 15 },
  ];

  for (const brand of toolBrands) {
    for (const tool of toolTemplates) {
      // Modify prices slightly based on brand (Bosch is premium, Stanley mid, Taparia economy)
      const brandMultiplier = brand === 'Bosch' ? 1.6 : brand === 'Stanley' ? 1.3 : 1.0;
      const price = Math.round(tool.price * brandMultiplier * (0.96 + Math.random() * 0.08));
      const name = `${brand} ${tool.name}`;
      const brandCode = brand.substring(0, 2).toUpperCase();
      const productCode = `${brandCode}-${tool.suffix}`;

      addProduct({
        productName: name,
        productCode,
        category: 'Tools & Testers',
        brand,
        price,
      });
    }
  }

  return products;
};

const seedDB = async () => {
  try {
    const pool = getPool();
    console.log('Connecting to MySQL for large seeding...');

    // Clear Users
    await pool.query('DELETE FROM users');
    console.log('Cleared existing users.');

    // Create Owner
    const ownerPassword = 'Password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Store Owner', 'owner@smartprice.com', hashedPassword, 'owner']
    );
    console.log(`Created Owner account:`);
    console.log(`Email: owner@smartprice.com`);
    console.log(`Password: ${ownerPassword}`);

    // Clear Products
    await pool.query('DELETE FROM products');
    console.log('Cleared existing products.');

    // Generate ~1000 Products
    console.log('Generating realistic product list...');
    const generatedProducts = generateProducts();
    console.log(`Generated ${generatedProducts.length} unique items. Seeding into MySQL...`);

    for (const p of generatedProducts) {
      const salePrice = p.salePrice || p.price;
      const mrpPrice = p.mrpPrice || p.price;
      const wholesalePrice = p.wholesalePrice || null;
      await pool.query(
        `INSERT INTO products 
         (productName, productCode, barcode, category, brand, price, salePrice, mrpPrice, wholesalePrice, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.productName, p.productCode, p.barcode, p.category, p.brand, salePrice, salePrice, mrpPrice, wholesalePrice, p.stock || 0]
      );
    }

    console.log(`Successfully seeded ${generatedProducts.length} products into MySQL!`);
    console.log('Large seeding process completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();

