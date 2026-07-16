import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Only allow image MIME types
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// @desc    Upload a product image
// @route   POST /upload/product-image
// @access  Private (Owner only)
export const uploadProductImage = (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  // Build the public URL to access the image
  const protocol = req.protocol;
  const host = req.get('host');
  const imageUrl = `${protocol}://${host}/uploads/products/${req.file.filename}`;

  res.status(200).json({
    success: true,
    imageUrl,
    filename: req.file.filename,
  });
};

// @desc    Delete a product image file from disk
// @route   DELETE /upload/product-image/:filename
// @access  Private (Owner only)
export const deleteProductImage = (req: Request, res: Response): void => {
  const { filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, message: 'File not found' });
    return;
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Failed to delete file' });
      return;
    }
    res.status(200).json({ success: true, message: 'Image deleted' });
  });
};
