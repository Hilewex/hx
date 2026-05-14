export interface AppRoute {
  href: string;
  label: string;
  description: string;
}

export const primaryRoutes: AppRoute[] = [
  { href: '/', label: 'Home', description: 'Projection-ready platform overview.' },
  { href: '/search', label: 'Search', description: 'BFF-backed search route foundation.' },
  { href: '/category', label: 'Category', description: 'Category projection route foundation.' },
  { href: '/creator', label: 'Creator', description: 'Creator storefront management projection surface.' },
  { href: '/supplier', label: 'Supplier', description: 'Supplier operational projection surface.' },
  { href: '/admin', label: 'Admin', description: 'Admin ops projection surface.' },
  { href: '/admin/refunds', label: 'Refund review', description: 'Finance refund review projection surface.' },
  { href: '/cart', label: 'Cart', description: 'Cart read route foundation.' },
  { href: '/support', label: 'Support', description: 'Support entry route foundation.' },
];

export const routeSkeletons: Record<string, AppRoute> = {
  search: { href: '/search', label: 'Search', description: 'Search UI shell prepared for read projections.' },
  category: { href: '/category', label: 'Category', description: 'Category landing shell prepared for BFF read data.' },
  product: { href: '/product/[id]', label: 'Product', description: 'Product detail shell without local price or stock truth.' },
  store: { href: '/store/[slug]', label: 'Store', description: 'Creator storefront shell without local eligibility decisions.' },
  creator: { href: '/creator', label: 'Creator', description: 'Creator management shell without local owner or permission truth.' },
  supplier: { href: '/supplier', label: 'Supplier', description: 'Supplier operations shell without local stock, price, shipment, or payout truth.' },
  admin: { href: '/admin', label: 'Admin', description: 'Admin ops shell without local approval, activation, moderation, or risk truth.' },
  cart: { href: '/cart', label: 'Cart', description: 'Cart shell waiting for BFF cart projection.' },
  checkout: { href: '/checkout', label: 'Checkout', description: 'Checkout shell without payment or order finalization.' },
  payment: { href: '/payment', label: 'Payment', description: 'Payment shell without provider integration or state decisions.' },
  orders: { href: '/orders', label: 'Orders', description: 'Orders shell waiting for read model data.' },
  support: { href: '/support', label: 'Support', description: 'Support shell prepared for BFF-backed workflows.' },
};
