import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel, { UserRow } from '../models/User';

export interface AuthRequest extends Request {
  user?: Partial<UserRow> & { _id?: string };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey123!@#') as { id: string };
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    req.user = {
      ...user,
      _id: String(user.id),
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

export const optionalProtect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey123!@#') as { id: string };
    const user = await UserModel.findById(decoded.id);
    if (user) {
      req.user = {
        ...user,
        _id: String(user.id),
      };
    }
    next();
  } catch (error) {
    next();
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role || '')) {
      res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this route`,
      });
      return;
    }
    next();
  };
};
