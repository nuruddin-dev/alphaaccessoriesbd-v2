const apiUrl = process.env.API_URL || (typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost:3000/api' : '/api');
export const API_URL = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

export const SOCKET_URL =
  window.location.host.indexOf('localhost') >= 0
    ? 'http://127.0.0.1:3000'
    : window.location.host;

export const ROLES = {
  Admin: 'ROLE ADMIN',
  Member: 'ROLE MEMBER',
  Merchant: 'ROLE MERCHANT'
};

export const PRODUCT_COLORS = {
  Black: '#000'
};

export const CART_ITEMS = 'cart_items';
export const CART_TOTAL = 'cart_total';
export const DELIVERY_CHARGE = 'delivery_charge';
export const CART_ID = 'cart_id';

export const CART_ITEM_STATUS = {
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
  Not_processed: 'Not processed'
};

export const ORDER_STATUS = {
  Pending: 'Pending',
  OnHold: 'On Hold',
  Ordered: 'Ordered',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Canceled: 'Canceled',
  Spam: 'Spam'
};

export const MERCHANT_STATUS = {
  Rejected: 'Rejected',
  Approved: 'Approved',
  Waiting_Approval: 'Waiting Approval'
};

export const REVIEW_STATUS = {
  Rejected: 'Rejected',
  Approved: 'Approved',
  Waiting_Approval: 'Waiting Approval'
};

export const EMAIL_PROVIDER = {
  Email: 'Email',
  Google: 'Google',
  Facebook: 'Facebook'
};
