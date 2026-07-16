import { Router } from 'express';
import {
  getProducts,
  searchProducts,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
} from '../controllers/productController';
import { upload, uploadProductImage, deleteProductImage } from '../controllers/uploadController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// --- Public routes (available to all staff / unauthenticated users) ---
router.get('/', getProducts);
router.get('/search', searchProducts);

// --- Protected routes (Owner only) ---
router.post('/', protect, authorize('owner'), createProduct);
router.put('/:id', protect, authorize('owner'), updateProduct);
router.patch('/:id/stock', protect, authorize('owner'), updateStock);
router.delete('/:id', protect, authorize('owner'), deleteProduct);

// --- Image upload routes (Owner only) ---
router.post(
  '/upload/image',
  protect,
  authorize('owner'),
  upload.single('image'),
  uploadProductImage
);
router.delete(
  '/upload/image/:filename',
  protect,
  authorize('owner'),
  deleteProductImage
);

export default router;
