import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'owner' | 'staff';
  matchPassword(enteredPassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  productName: string;
  productCode: string;
  barcode?: string;
  category: string;
  brand: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
