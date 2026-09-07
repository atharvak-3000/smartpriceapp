import { Router } from 'express';
import {
  getProducts,
  searchProducts,
  createProduct,
  updateProduct,
  quickUpdatePrice,
  updateStock,
  deleteProduct,
} from '../controllers/productController';
import { upload, uploadProductImage, deleteProductImage } from '../controllers/uploadController';
import { protect, authorize, optionalProtect } from '../middleware/authMiddleware';

const router = Router();

// --- Public / Read routes (with optional auth to detect role) ---
router.get('/', optionalProtect, getProducts);
router.get('/search', optionalProtect, searchProducts);

// --- Stock management (Both Admin and Sales Person can add / release stock manually) ---
router.patch('/:id/stock', protect, authorize('owner', 'admin', 'staff', 'salesperson'), updateStock);

// --- Quick Price Update (Easy price updation for Admin / Owner) ---
router.patch('/:id/quick-price', protect, authorize('owner', 'admin'), quickUpdatePrice);

// --- Protected CRUD routes (Owner / Admin only) ---
router.post('/', protect, authorize('owner', 'admin'), createProduct);
router.put('/:id', protect, authorize('owner', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteProduct);

// --- Image upload routes (Owner / Admin only) ---
router.post(
  '/upload/image',
  protect,
  authorize('owner', 'admin'),
  upload.single('image'),
  uploadProductImage
);
router.delete(
  '/upload/image/:filename',
  protect,
  authorize('owner', 'admin'),
  deleteProductImage
);

export default router;
