import { Request, Response } from 'express';
import ProductModel, { formatProduct } from '../models/Product';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get all products (or sync)
// @route   GET /products
// @access  Public
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await ProductModel.findAll();
    const userRole = req.user?.role;
    const isSalesPerson = userRole === 'staff' || userRole === 'salesperson';

    const formatted = products.map((p) => formatProduct(p, isSalesPerson));

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
    const products = await ProductModel.search(searchQuery);

    const userRole = req.user?.role;
    const isSalesPerson = userRole === 'staff' || userRole === 'salesperson';
    const formatted = products.map((p) => formatProduct(p, isSalesPerson));

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

    if (!productName || !productCode || !category || !brand) {
      res.status(400).json({ success: false, message: 'Product name, code, category, and brand are required' });
      return;
    }

    const formattedCode = productCode.toUpperCase().trim();
    const formattedBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : undefined;

    // Check duplicate product code
    const existingCode = await ProductModel.findByCode(formattedCode);
    if (existingCode) {
      res.status(400).json({ success: false, message: `Product with code '${productCode}' already exists` });
      return;
    }

    if (formattedBarcode) {
      const existingBarcode = await ProductModel.findByBarcode(formattedBarcode);
      if (existingBarcode) {
        res.status(400).json({ success: false, message: `Product with barcode '${barcode}' already exists` });
        return;
      }
    }

    const effectiveSalePrice = salePrice !== undefined ? Number(salePrice) : Number(price || 0);
    const effectivePrice = effectiveSalePrice;
    const effectiveMrp = mrpPrice !== undefined ? Number(mrpPrice) : effectiveSalePrice;
    const effectiveWholesale = wholesalePrice !== undefined ? Number(wholesalePrice) : undefined;

    const created = await ProductModel.create({
      productName: productName.trim(),
      productCode: formattedCode,
      barcode: formattedBarcode,
      category: category.trim(),
      brand: brand.trim(),
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
      data: formatProduct(created, false),
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

    const product = await ProductModel.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const formattedCode = productCode ? productCode.toUpperCase().trim() : undefined;
    if (formattedCode && formattedCode !== product.productCode) {
      const existingCode = await ProductModel.findByCode(formattedCode, id);
      if (existingCode) {
        res.status(400).json({ success: false, message: `Product with code '${productCode}' already exists` });
        return;
      }
    }

    if (barcode !== undefined) {
      const formattedBarcode = barcode ? barcode.trim() : null;
      if (formattedBarcode && formattedBarcode !== product.barcode) {
        const existingBarcode = await ProductModel.findByBarcode(formattedBarcode, id);
        if (existingBarcode) {
          res.status(400).json({ success: false, message: `Product with barcode '${barcode}' already exists` });
          return;
        }
      }
    }

    const effectiveSalePrice = salePrice !== undefined ? Number(salePrice) : (price !== undefined ? Number(price) : undefined);

    const updateData: any = {};
    if (productName !== undefined) updateData.productName = productName.trim();
    if (formattedCode !== undefined) updateData.productCode = formattedCode;
    if (barcode !== undefined) updateData.barcode = barcode ? barcode.trim() : null;
    if (category !== undefined) updateData.category = category.trim();
    if (brand !== undefined) updateData.brand = brand.trim();
    if (stock !== undefined) updateData.stock = Number(stock);
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description.trim() !== '' ? description.trim() : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim() !== '' ? imageUrl.trim() : null;

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

    const updated = await ProductModel.update(id, updateData);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatProduct(updated, false),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @desc    Quick update product prices
// @route   PATCH /products/:id/quick-price
// @access  Private (Owner/Admin only)
export const quickUpdatePrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { mrpPrice, wholesalePrice, salePrice } = req.body;

    const product = await ProductModel.findById(id);
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

    const updated = await ProductModel.update(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Prices updated successfully',
      data: updated ? formatProduct(updated, false) : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to quick-update price',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @desc    Update stock quantity
// @route   PATCH /products/:id/stock
// @access  Private (Admin, Owner, Staff, Sales Person)
export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { delta, absolute } = req.body;

    const product = await ProductModel.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    let newStock: number;
    if (absolute !== undefined) {
      newStock = Math.max(0, Number(absolute));
    } else if (delta !== undefined) {
      newStock = Math.max(0, Number(product.stock) + Number(delta));
    } else {
      res.status(400).json({ success: false, message: 'Provide either delta or absolute stock value' });
      return;
    }

    const updated = await ProductModel.updateStock(id, newStock);

    res.status(200).json({
      success: true,
      data: updated ? formatProduct(updated, false) : null,
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

    const product = await ProductModel.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await ProductModel.delete(id);

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
