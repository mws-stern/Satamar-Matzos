import type { Order, Product, Customer } from "@/types";
import useStore from "./store";

export interface BulkOperationResult {
  success: number;
  failed: number;
  total: number;
  errors?: string[];
}

/**
 * Bulk update order status
 */
export const bulkUpdateOrderStatus = (
  orderIds: string[], 
  status: Order["status"]
): BulkOperationResult => {
  const orders = useStore.getState().orders;
  const updateOrder = useStore.getState().updateOrder;
  let successCount = 0;
  const failedCount = 0;
  const errors: string[] = [];

  orderIds.forEach(orderId => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== status) {
      updateOrder(orderId, { status, updatedAt: new Date().toISOString() });
      successCount++;
    }
  });

  return {
    success: successCount,
    failed: failedCount,
    total: orderIds.length,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Bulk create invoices for orders
 */
export const bulkCreateInvoices = (orderIds: string[]): BulkOperationResult => {
  const orders = useStore.getState().orders;
  const successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  orderIds.forEach(orderId => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      try {
        // useStore.getState().createInvoiceFromOrder(order);
        errors.push(`Not implemented`);
        failedCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Failed to create invoice for order ${order.orderNumber}`);
      }
    } else {
      failedCount++;
      errors.push(`Order ${orderId} not found`);
    }
  });

  return {
    success: successCount,
    failed: failedCount,
    total: orderIds.length,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Bulk update product prices
 */
export const bulkUpdateProductPrices = (
  updates: { id: string; price: number }[]
): BulkOperationResult => {
  const products = useStore.getState().products;
  const updateProduct = useStore.getState().updateProduct;
  let successCount = 0;
  const failedCount = 0;

  updates.forEach(update => {
    const product = products.find(p => p.id === update.id);
    if (product) {
      updateProduct(update.id, { pricePerLb: update.price });
      successCount++;
    }
  });

  return {
    success: successCount,
    failed: failedCount,
    total: updates.length
  };
};

/**
 * Bulk update inventory
 */
export const bulkUpdateInventory = (
  updates: { id: string; amount: number }[]
): BulkOperationResult => {
  const products = useStore.getState().products;
  const updateProduct = useStore.getState().updateProduct;
  let successCount = 0;
  const failedCount = 0;

  updates.forEach(update => {
    const product = products.find(p => p.id === update.id);
    if (product) {
      updateProduct(update.id, { currentInventory: (product.currentInventory || 0) + update.amount });
      successCount++;
    }
  });

  return {
    success: successCount,
    failed: failedCount,
    total: updates.length
  };
};

export async function batchUpdateOrdersStatus(
  orderIds: string[],
  status: Order["status"]
) {
  const { updateOrder } = useStore.getState();

  for (const id of orderIds) {
    await updateOrder(id, { status });
  }
}

export async function batchUpdateProductsInventory(
  productIds: string[],
  delta: number
) {
  const { products, updateProduct } = useStore.getState();

  for (const id of productIds) {
    const product = products.find((p) => p.id === id);
    if (!product) continue;

    await updateProduct(id, {
      currentInventory: (product.currentInventory || 0) + delta,
    });
  }
}

export async function batchSetProductsInventory(
  productIds: string[],
  value: number
) {
  const { updateProduct } = useStore.getState();

  for (const id of productIds) {
    await updateProduct(id, { currentInventory: value });
  }
}