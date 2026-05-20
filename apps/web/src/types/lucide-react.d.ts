declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react';

  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

  export const AlertTriangle: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Bell: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Clock: LucideIcon;
  export const Database: LucideIcon;
  export const Download: LucideIcon;
  export const KeyRound: LucideIcon;
  export const Mail: LucideIcon;
  export const MapPin: LucideIcon;
  export const ReceiptText: LucideIcon;
  export const ScanSearch: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Smartphone: LucideIcon;
  export const ShoppingBasket: LucideIcon;
  export const Users: LucideIcon;
}
