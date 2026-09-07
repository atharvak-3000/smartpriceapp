import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import { verifyApiKey } from './middleware/apiKeyMiddleware';

const app: Application = express();

// Ensure upload directory exists for production deployments
const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Trust proxy header when running behind Hostinger / Nginx / Cloudflare
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-API-KEY'],
}));
app.use(express.json());

// Serve uploaded product images as static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 1. Public Health Check & Root endpoints (Accessible without API key for uptime monitors)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'SmartPrice Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. Rate Limiting Protection (Prevents DoS and Scraping)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after a few minutes.',
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 login attempts per 15 min (brute force protection)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Account temporarily throttled, please wait 15 minutes.',
  },
});

// Apply general rate limiting
app.use(generalLimiter);

// 3. Application API Key Verification (Blocks unauthorized web bots & scrapers)
app.use(verifyApiKey);

// Routes
app.use('/auth/login', loginLimiter);
app.use('/auth', authRoutes);
app.use('/products', productRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

export default app;
