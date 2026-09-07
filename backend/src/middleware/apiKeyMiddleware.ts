import { Request, Response, NextFunction } from 'express';

export const verifyApiKey = (req: Request, res: Response, next: NextFunction): void => {
  // Allow health check and root service status without API key
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  const expectedKey = process.env.APP_API_KEY || 'smartprice_mobile_secure_key_2026_9x8f';
  const providedKey = req.headers['x-api-key'] || req.headers['X-API-KEY'] || req.query.apiKey;

  if (!providedKey || providedKey !== expectedKey) {
    res.status(403).json({
      success: false,
      message: 'Access Denied: Missing or invalid application secret key (x-api-key)',
    });
    return;
  }

  next();
};

export default verifyApiKey;
