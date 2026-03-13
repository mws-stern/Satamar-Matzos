import type { Product, Order, Invoice } from "@/types";
import useStore from "./store";

// Low stock threshold
const LOW_STOCK_THRESHOLD = 50;

export interface Alert {
  id: string;
  type: "inventory" | "payment" | "system";
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  date: string;
  link?: string;
  read?: boolean;
  productId?: string;
  orderId?: string;
  invoiceId?: string;
}

export type AutomationAlert = Alert;

/**
 * Check for low inventory levels
 */
export const checkLowInventory = (): Alert[] => {
  const products = useStore.getState().products;
  const alerts: Alert[] = [];

  products.forEach(product => {
    if ((product.currentInventory || 0) < LOW_STOCK_THRESHOLD) {
      alerts.push({
        id: `inv-${product.id}-${Date.now()}`,
        type: "inventory",
        title: "Low Stock Alert",
        message: `${product.name} is running low (${product.currentInventory?.toFixed(1)} lbs remaining)`,
        severity: "warning",
        date: new Date().toISOString(),
        link: "/inventory",
        read: false,
        productId: product.id
      });
    }
  });

  return alerts;
};

/**
 * Generate reminders for overdue invoices
 */
export const generateOverdueReminders = (): Alert[] => {
  // Mock invoices since they aren't in the store yet
  const invoices: any[] = []; // useStore.getState().invoices if added later
  const now = new Date();
  const alerts: Alert[] = [];

  invoices.forEach(invoice => {
    if (!invoice.paid && new Date(invoice.dueDate) < now) {
      const daysOverdue = Math.floor((now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      alerts.push({
        id: `due-${invoice.id}-${Date.now()}`,
        type: "payment",
        title: "Overdue Invoice",
        message: `Invoice #${invoice.invoiceNumber} for ${invoice.customerName} is ${daysOverdue} days overdue`,
        severity: "critical",
        date: new Date().toISOString(),
        link: `/invoices/${invoice.id}`,
        read: false,
        invoiceId: invoice.id
      });
    }
  });

  return alerts;
};

/**
 * Get recent high-value orders
 */
export const getRecentHighValueOrders = (threshold: number = 500): Order[] => {
  const orders = useStore.getState().orders;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return orders
    .filter(order => order.total >= threshold && new Date(order.createdAt) >= weekAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get all active alerts
 */
export const getAllAlerts = (): Alert[] => {
  return [
    ...checkLowInventory(),
    ...generateOverdueReminders()
  ].sort((a, b) => {
    // Sort critical first, then warning, then info
    const severityScore = { critical: 3, warning: 2, info: 1 };
    return severityScore[b.severity] - severityScore[a.severity];
  });
};