import type { SVGProps, FC } from 'react';

// lucide-react-native icons accept React Native style props (color, size, strokeWidth)
declare module 'lucide-react-native' {
  export interface LucideProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    style?: any;
  }

  export type LucideIcon = FC<LucideProps>;

  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowDownRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const Barcode: LucideIcon;
  export const Bolt: LucideIcon;
  export const BoltOff: LucideIcon;
  export const Camera: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Edit2: LucideIcon;
  export const Edit3: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const FileText: LucideIcon;
  export const FolderOpen: LucideIcon;
  export const Hash: LucideIcon;
  export const History: LucideIcon;
  export const Image: LucideIcon;
  export const ImagePlus: LucideIcon;
  export const IndianRupee: LucideIcon;
  export const Layers: LucideIcon;
  export const Lock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const MapPin: LucideIcon;
  export const Minus: LucideIcon;
  export const Moon: LucideIcon;
  export const Package: LucideIcon;
  export const Percent: LucideIcon;
  export const Phone: LucideIcon;
  export const Plus: LucideIcon;
  export const RotateCw: LucideIcon;
  export const Scan: LucideIcon;
  export const ScanBarcode: LucideIcon;
  export const Search: LucideIcon;
  export const Share2: LucideIcon;
  export const Shield: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Store: LucideIcon;
  export const Sun: LucideIcon;
  export const Tag: LucideIcon;
  export const Trash2: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const User: LucideIcon;
  export const Users: LucideIcon;
  export const X: LucideIcon;
  export const Zap: LucideIcon;
  export const ZapOff: LucideIcon;
}
