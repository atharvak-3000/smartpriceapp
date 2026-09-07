import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';

// Helper to format product based on user role (Access Control: Sales person cannot view wholesalePrice)
const formatProductForRole = (doc: any, isSalesPerson: boolean) => {
  const p = doc.toObject ? doc.toObject() : { ...doc };
  p.salePrice = p.salePrice !== undefined && p.salePrice !== null ? p.salePrice : p.price;
  p.mrpPrice = p.mrpPrice !== undefined && p.mrpPrice !== null ? p.mrpPrice : p.salePrice;
  p.price = p.salePrice;

  if (isSalesPerson) {
    delete p.wholesalePrice;
  }
  return p;
};

// @desc    Get all products (or sync)
// @route   GET /products
// @access  Public
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find({}).sort({ productName: 1 });
    const userRole = req.user?.role;
    const isSalesPerson = userRole === 'staff' || userRole === 'salesperson';

    const formatted = products.map((p) => formatProductForRole(p, isSalesPerson));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @desc    Search products on server
// @route   GET /products/search
// @access  Public
export const searchProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, message: 'Please provide a search query' });
      return;
    }

    const searchQuery = q.trim();

    // Find products matching Name, Code, or Barcode (exact)
    const products = await Product.find({
      $or: [
        { productName: { $regex: searchQuery, $options: 'i' } },
        { productCode: { $regex: searchQuery, $options: 'i' } },
        { barcode: searchQuery },
      ],
    }).sort({ productName: 1 });

    const userRole = req.user?.role;
    const isSalesPerson = userRole === 'staff' || userRole === 'salesperson';
    const formatted = products.map((p) => formatProductForRole(p, isSalesPerson));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @desc    Create a product
// @route   POST /products
// @access  Private (Owner/Admin only)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productName,
      productCode,
      barcode,
      category,
      brand,
      description,
      price,
      salePrice,
      mrpPrice,
      wholesalePrice,
      stock,
      imageUrl,
      status,
    } = req.body;

    const formattedCode = productCode.toUpperCase().trim();
    const formattedBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : undefined;

    // Check duplicate product code
    const existingCode = await Product.findOne({ productCode: formattedCode });
    if (existingCode) {
      res.status(400).json({ success: false, message: `Product with code '${productCode}' already exists` });
      return;
    }

    if (formattedBarcode) {
      const existingBarcode = await Product.findOne({ barcode: formattedBarcode });
      if (existingBarcode) {
        res.status(400).json({ success: false, message: `Product with barcode '${barcode}' already exists` });
        return;
      }
    }

    const effectiveSalePrice = salePrice !== undefined ? Number(salePrice) : Number(price || 0);
    const effectivePrice = effectiveSalePrice;
    const effectiveMrp = mrpPrice !== undefined ? Number(mrpPrice) : effectiveSalePrice;
    const effectiveWholesale = wholesalePrice !== undefined ? Number(wholesalePrice) : undefined;

    const product = await Product.create({
      productName,
      productCode: formattedCode,
      barcode: formattedBarcode,
      category,
      brand,
      description: description?.trim() || undefined,
      price: effectivePrice,
      salePrice: effectiveSalePrice,
      mrpPrice: effectiveMrp,
      wholesalePrice: effectiveWholesale,
      stock: stock !== undefined ? Number(stock) : 0,
      imageUrl: imageUrl?.trim() || undefined,
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @desc    Update a product
// @route   PUT /products/:id
// @access  Private (Owner/Admin only)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      productName,
      productCode,
      barcode,
      category,
      brand,
      description,
      price,
      salePrice,
      mrpPrice,
      wholesalePrice,
      stock,
      imageUrl,
      status,
    } = req.body;

    const formattedCode = productCode ? productCode.toUpperCase().trim() : undefined;

    let product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (productCode && productCode.toUpperCase().trim() !== product.productCode) {
      const existingCode = await Product.findOne({
        productCode: productCode.toUpperCase().trim(),
        _id: { $ne: id },
      });
      if (existingCode) {
        res.status(400).json({ success: false, message: `Product with code '${productCode}' already exists` });
        return;
      }
    }

    if (barcode && barcode.trim() !== product.barcode) {
      const existingBarcode = await Product.findOne({
        barcode: barcode.trim(),
        _id: { $ne: id },
      });
      if (existingBarcode) {
        res.status(400).json({ success: false, message: `Product with barcode '${barcode}' already exists` });
        return;
      }
    }

    const effectiveSalePrice = salePrice !== undefined ? Number(salePrice) : (price !== undefined ? Number(price) : undefined);

    const updateData: any = {
      productName,
      category,
      brand,
      stock: stock !== undefined ? Number(stock) : undefined,
      status: status || undefined,
    };

    if (effectiveSalePrice !== undefined) {
      updateData.salePrice = effectiveSalePrice;
      updateData.price = effectiveSalePrice;
    }
    if (mrpPrice !== undefined) {
      updateData.mrpPrice = Number(mrpPrice);
    }
    if (wholesalePrice !== undefined) {
      updateData.wholesalePrice = Number(wholesalePrice);
    }
    if (description !== undefined) {
      updateData.description = description.trim() !== '' ? description.trim() : undefined;
    }
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl.trim() !== '' ? imageUrl.trim() : undefined;
    }
    if (formattedCode) {
      updateData.productCode = formattedCode;
    }

    // Remove undefined keys
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updateQuery: any = { $set: updateData };

    if (barcode !== undefined) {
      if (barcode.trim() === '') {
        updateQuery.$unset = { barcode: 1 };
      } else {
        updateQuery.$set.barcode = barcode.trim();
      }
    }

    product = await Product.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @desc    Quick update product prices (Easy Price Updation for MRP, Wholesale, Sale Price)
// @route   PATCH /products/:id/quick-price
// @access  Private (Owner/Admin only)
export const quickUpdatePrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { mrpPrice, wholesalePrice, salePrice } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const updateData: any = {};

    if (salePrice !== undefined) {
      const numSale = Number(salePrice);
      updateData.salePrice = numSale;
      updateData.price = numSale;
    }
    if (mrpPrice !== undefined) {
      updateData.mrpPrice = Number(mrpPrice);
    }
    if (wholesalePrice !== undefined) {
      updateData.wholesalePrice = Number(wholesalePrice);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Prices updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to quick-update price',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @desc    Update stock quantity (increment or decrement or absolute)
// @route   PATCH /products/:id/stock
// @access  Private (Admin, Owner, Staff, Sales Person)
export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { delta, absolute } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    let newStock: number;

    if (absolute !== undefined) {
      // Set stock to an absolute value (e.g., stock-take / full count)
      newStock = Math.max(0, Number(absolute));
    } else if (delta !== undefined) {
      // Increment or decrement relative to current stock (e.g. customer bought 3)
      newStock = Math.max(0, product.stock + Number(delta));
    } else {
      res.status(400).json({ success: false, message: 'Provide either delta or absolute stock value' });
      return;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: { stock: newStock } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @desc    Delete a product
// @route   DELETE /products/:id
// @access  Private (Owner/Admin only)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : error,
    });
  }
};
