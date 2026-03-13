import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Customer, Order, Invoice, AppState, Payment, InventoryEntry, Settings } from "@/types";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";

// Memoization cache
const cache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5000;

function memoize<T>(key: string, fn: () => T): T {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  const value = fn();
  cache.set(key, { value, timestamp: now });
  return value;
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      customers: [],
      orders: [],
      invoices: [],
      payments: [],
      inventoryEntries: [],
      settings: null,
      isLoading: false,
      isInitializing: false,
      lastSync: null,
      isInitialized: false,

      // Initialize store with authentication check
      initialize: async () => {
        const state = get();
        if (state.isInitializing) return;

        set({ isInitializing: true, isLoading: true });

        try {
          let productsData: any[] | null = null;

          try {
            const { data, error } = await supabase
              .from("products")
              .select("*")
              .order("name", { ascending: true });

            if (error) {
              console.error("[initialize][products] error", error);
            } else {
              productsData = data || [];
            }
          } catch (err: any) {
            console.error("[initialize][products] thrown error", {
              message: err?.message,
              stack: err?.stack,
              error: err,
            });
          }

          const products: Product[] = (productsData || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            nameHebrew: p.name_hebrew,
            pricePerLb: Number(p.price_per_lb || 0),
            category: (p.category as Product["category"]) ?? "regular",
            description: p.description || "",
            inStock: Boolean(p.in_stock),
            currentInventory: Number(p.current_inventory || 0),
          }));

          set({ products });

          // Load customers and orders in background with soft failures
          Promise.all([
            (async () => {
              try {
                const { data, error } = await supabase
                  .from("customers")
                  .select("*")
                  .order("name", { ascending: true });
                if (error) {
                  console.error("[initialize][customers] error", error);
                  return [];
                }
                return data || [];
              } catch (err: any) {
                console.error("[initialize][customers] thrown error", {
                  message: err?.message,
                  stack: err?.stack,
                  error: err,
                });
                return [];
              }
            })(),
            (async () => {
              try {
                const { data, error } = await supabase
                  .from("orders")
                  .select("*")
                  .order("created_at", { ascending: false });

                if (error) {
                  console.error("[initialize][orders] error", error);
                  return [];
                }

                return data || [];
              } catch (err: any) {
                console.error("[initialize][orders] thrown error", {
                  message: err?.message,
                  stack: err?.stack,
                  error: err,
                });
                return [];
              }
            })(),
          ])
            .then(([customersRaw, ordersRaw]) => {
              const customers: Customer[] = (customersRaw || []).map((c: any) => ({
                id: c.id,
                name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
                nameHebrew: c.name_hebrew || `${c.first_name_hebrew || ""} ${c.last_name_hebrew || ""}`.trim(),
                titleHebrew: c.title_hebrew,
                titleEnglish: c.title_english,
                first_name_hebrew: c.first_name_hebrew,
                last_name_hebrew: c.last_name_hebrew,
                first_name: c.first_name,
                last_name: c.last_name,
                house_number: c.house_number,
                apt: c.apt,
                street: c.street,
                email: c.email,
                phone: c.phone,
                mobile: c.mobile,
                address: c.address,
                city: c.city,
                state: c.state,
                zip: c.zip,
                notes: c.notes || "",
                created_at: c.created_at,
              }));

              const orders: Order[] = (ordersRaw || []).map((o: any) => ({
                id: o.id,
                orderNumber: o.order_number,
                customerId: o.customer_id,
                customerName: o.customer_name,
                customerEmail: o.customer_email,
                items: (o.items || []) as Order["items"],
                subtotal: Number(o.subtotal || 0),
                tax: Number(o.tax || 0),
                total: Number(o.total || 0),
                discount: Number(o.discount || 0),
                discountType: (o.discount_type as Order["discountType"]) ?? "fixed",
                status: (o.status as Order["status"]) ?? "pending",
                paymentStatus: (o.payment_status as Order["paymentStatus"]) ?? "unpaid",
                amountPaid: Number(o.amount_paid || 0),
                amountDue: Number(o.amount_due || 0),
                notes: o.notes || "",
                deliveryDate: o.delivery_date,
                orderTime: o.order_time,
                inventoryDeducted: Boolean(o.inventory_deducted),
                createdAt: o.created_at,
                updatedAt: o.updated_at,
              }));

              set({
                customers,
                orders,
                isLoading: false,
                lastSync: Date.now(),
              });
            })
            .catch((error) => {
              console.error("[initialize][background] thrown error", {
                message: (error as any)?.message,
                stack: (error as any)?.stack,
                error,
              });
              set({ isLoading: false });
            });

          set({ isInitialized: true });
        } catch (error: any) {
          console.error("[initialize][root] thrown error", {
            message: error?.message,
            stack: error?.stack,
            error,
          });
          set({ isLoading: false, isInitialized: true });
        }

        set({ isInitializing: false });
      },

      refreshData: async () => {
        try {
          set({ isLoading: true });

          const [
            productsResult,
            customersResult,
            ordersResult,
          ] = await Promise.all([
            supabase.from("products").select("*"),
            supabase.from("customers").select("*").order("name", { ascending: true }),
            supabase.from("orders").select("*"),
          ]);

          if (productsResult.error) {
            console.error("[refreshData][products] error", productsResult.error);
          }
          if (customersResult.error) {
            console.error("[refreshData][customers] error", customersResult.error);
          }
          if (ordersResult.error) {
            console.error("[refreshData][orders] error", ordersResult.error);
          }

          const products: Product[] = (productsResult.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            nameHebrew: p.name_hebrew,
            pricePerLb: Number(p.price_per_lb || 0),
            category: (p.category as Product["category"]) ?? "regular",
            description: p.description || "",
            inStock: Boolean(p.in_stock),
            currentInventory: Number(p.current_inventory || 0),
          }));

          const customers: Customer[] = (customersResult.data || []).map((c: any) => ({
            id: c.id,
            name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
            nameHebrew: c.name_hebrew || `${c.first_name_hebrew || ""} ${c.last_name_hebrew || ""}`.trim(),
            titleHebrew: c.title_hebrew,
            titleEnglish: c.title_english,
            first_name_hebrew: c.first_name_hebrew,
            last_name_hebrew: c.last_name_hebrew,
            first_name: c.first_name,
            last_name: c.last_name,
            house_number: c.house_number,
            apt: c.apt,
            street: c.street,
            email: c.email,
            phone: c.phone,
            mobile: c.mobile,
            address: c.address,
            city: c.city,
            state: c.state,
            zip: c.zip,
            notes: c.notes || "",
            created_at: c.created_at,
          }));

          const orders: Order[] = (ordersResult.data || []).map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            customerId: o.customer_id,
            customerName: o.customer_name,
            customerEmail: o.customer_email,
            items: (o.items || []) as Order["items"],
            subtotal: Number(o.subtotal || 0),
            tax: Number(o.tax || 0),
            total: Number(o.total || 0),
            discount: Number(o.discount || 0),
            discountType: (o.discount_type as Order["discountType"]) ?? "fixed",
            status: (o.status as Order["status"]) ?? "pending",
            paymentStatus: (o.payment_status as Order["paymentStatus"]) ?? "unpaid",
            amountPaid: Number(o.amount_paid || 0),
            amountDue: Number(o.amount_due || 0),
            notes: o.notes || "",
            deliveryDate: o.delivery_date,
            orderTime: o.order_time,
            inventoryDeducted: Boolean(o.inventory_deducted),
            createdAt: o.created_at,
            updatedAt: o.updated_at,
          }));

          set({
            products,
            customers,
            orders,
            lastSync: Date.now(),
            isLoading: false,
          });
        } catch (error: any) {
          console.error("[refreshData][root] thrown error", {
            message: error?.message,
            stack: error?.stack,
            error,
          });
          set({ isLoading: false });
        }
      },

      addProduct: async (product: Omit<Product, "id">) => {
        try {
          const { data, error } = await supabase
            .from("products")
            .insert({
              name: product.name,
              name_hebrew: product.nameHebrew,
              price_per_lb: product.pricePerLb,
              category: product.category,
              description: product.description,
              in_stock: product.inStock,
              current_inventory: product.currentInventory,
            })
            .select("*")
            .single();

          if (error || !data) {
            throw error || new Error("Failed to insert product");
          }

          const newProduct: Product = {
            id: data.id,
            name: data.name,
            nameHebrew: data.name_hebrew,
            pricePerLb: Number(data.price_per_lb || 0),
            category: data.category as Product["category"],
            description: data.description || "",
            inStock: Boolean(data.in_stock),
            currentInventory: Number(data.current_inventory || 0),
          };

          set((state) => ({
            products: [...state.products, newProduct],
          }));

          return newProduct;
        } catch (error) {
          console.error("Error adding product:", error);
          throw error;
        }
      },

      updateProduct: async (id: string, updates: Partial<Product>) => {
        try {
          const payload: any = {};
          if (updates.name !== undefined) payload.name = updates.name;
          if (updates.nameHebrew !== undefined) payload.name_hebrew = updates.nameHebrew;
          if (updates.pricePerLb !== undefined) payload.price_per_lb = updates.pricePerLb;
          if (updates.category !== undefined) payload.category = updates.category;
          if (updates.description !== undefined) payload.description = updates.description;
          if (updates.inStock !== undefined) payload.in_stock = updates.inStock;
          if (updates.currentInventory !== undefined) payload.current_inventory = updates.currentInventory;

          const { error } = await supabase
            .from("products")
            .update(payload)
            .eq("id", id);

          if (error) throw error;

          set((state) => ({
            products: state.products.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          }));
        } catch (error) {
          console.error("Error updating product:", error);
          throw error;
        }
      },

      deleteProduct: async (id: string) => {
        try {
          const { error } = await supabase.from("products").delete().eq("id", id);
          if (error) throw error;

          set((state) => ({
            products: state.products.filter((p) => p.id !== id),
          }));
        } catch (error) {
          console.error("Error deleting product:", error);
          throw error;
        }
      },

      addCustomer: async (customer: Omit<Customer, "id">) => {
        try {
          const { data, error } = await supabase
            .from("customers")
            .insert({
              name: customer.name,
              name_hebrew: customer.nameHebrew,
              title_hebrew: customer.titleHebrew,
              title_english: customer.titleEnglish,
              first_name_hebrew: customer.first_name_hebrew,
              last_name_hebrew: customer.last_name_hebrew,
              first_name: customer.first_name,
              last_name: customer.last_name,
              house_number: customer.house_number,
              apt: customer.apt,
              street: customer.street,
              email: customer.email,
              phone: customer.phone,
              mobile: customer.mobile,
              address: customer.address,
              city: customer.city,
              state: customer.state,
              zip: customer.zip,
              notes: customer.notes,
            })
            .select("*")
            .single();

          if (error || !data) {
            throw error || new Error("Failed to insert customer");
          }

          const newCustomer: Customer = {
            id: data.id,
            name: data.name,
            nameHebrew: data.name_hebrew,
            titleHebrew: data.title_hebrew,
            titleEnglish: data.title_english,
            first_name_hebrew: data.first_name_hebrew,
            last_name_hebrew: data.last_name_hebrew,
            first_name: data.first_name,
            last_name: data.last_name,
            house_number: data.house_number,
            apt: data.apt,
            street: data.street,
            email: data.email,
            phone: data.phone,
            mobile: data.mobile,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
            notes: data.notes || "",
            created_at: data.created_at,
          };

          set((state) => ({
            customers: [...state.customers, newCustomer],
          }));

          return newCustomer;
        } catch (error) {
          console.error("Error adding customer:", error);
          throw error;
        }
      },

      updateCustomer: async (id: string, updates: Partial<Customer>) => {
        try {
          const payload: any = {};
          if (updates.name !== undefined) payload.name = updates.name;
          if (updates.nameHebrew !== undefined) payload.name_hebrew = updates.nameHebrew;
          if (updates.titleHebrew !== undefined) payload.title_hebrew = updates.titleHebrew;
          if (updates.titleEnglish !== undefined) payload.title_english = updates.titleEnglish;
          if (updates.first_name_hebrew !== undefined) payload.first_name_hebrew = updates.first_name_hebrew;
          if (updates.last_name_hebrew !== undefined) payload.last_name_hebrew = updates.last_name_hebrew;
          if (updates.first_name !== undefined) payload.first_name = updates.first_name;
          if (updates.last_name !== undefined) payload.last_name = updates.last_name;
          if (updates.house_number !== undefined) payload.house_number = updates.house_number;
          if (updates.apt !== undefined) payload.apt = updates.apt;
          if (updates.street !== undefined) payload.street = updates.street;
          if (updates.email !== undefined) payload.email = updates.email;
          if (updates.phone !== undefined) payload.phone = updates.phone;
          if (updates.mobile !== undefined) payload.mobile = updates.mobile;
          if (updates.address !== undefined) payload.address = updates.address;
          if (updates.city !== undefined) payload.city = updates.city;
          if (updates.state !== undefined) payload.state = updates.state;
          if (updates.zip !== undefined) payload.zip = updates.zip;
          if (updates.notes !== undefined) payload.notes = updates.notes;

          const { error } = await supabase
            .from("customers")
            .update(payload)
            .eq("id", id);

          if (error) throw error;

          set((state) => ({
            customers: state.customers.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          }));
        } catch (error) {
          console.error("Error updating customer:", error);
          throw error;
        }
      },

      deleteCustomer: async (id: string) => {
        try {
          const { error } = await supabase.from("customers").delete().eq("id", id);
          if (error) throw error;

          set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
          }));
        } catch (error) {
          console.error("Error deleting customer:", error);
          throw error;
        }
      },

      addOrder: async (order: Omit<Order, "id">) => {
        try {
          const { data, error } = await supabase
            .from("orders")
            .insert({
              order_number: order.orderNumber,
              customer_id: order.customerId,
              customer_name: order.customerName,
              customer_email: order.customerEmail,
              items: order.items as any,
              subtotal: order.subtotal,
              tax: order.tax,
              total: order.total,
              discount: order.discount,
              discount_type: order.discountType,
              status: order.status,
              payment_status: order.paymentStatus,
              amount_paid: order.amountPaid,
              amount_due: order.amountDue,
              notes: order.notes,
              delivery_date: order.deliveryDate,
              order_time: order.orderTime,
              inventory_deducted: order.inventoryDeducted,
            })
            .select("*")
            .single();

          if (error || !data) {
            throw error || new Error("Failed to insert order");
          }

          const newOrder: Order = {
            id: data.id,
            orderNumber: data.order_number,
            customerId: data.customer_id,
            customerName: data.customer_name,
            customerEmail: data.customer_email,
            items: ((data as any).items || []) as Order["items"],
            subtotal: Number(data.subtotal || 0),
            tax: Number(data.tax || 0),
            total: Number(data.total || 0),
            discount: Number(data.discount || 0),
            discountType: (data.discount_type as Order["discountType"]) ?? "fixed",
            status: (data.status as Order["status"]) ?? "pending",
            paymentStatus: (data.payment_status as Order["paymentStatus"]) ?? "unpaid",
            amountPaid: Number(data.amount_paid || 0),
            amountDue: Number(data.amount_due || 0),
            notes: data.notes || "",
            deliveryDate: data.delivery_date,
            orderTime: data.order_time,
            inventoryDeducted: Boolean(data.inventory_deducted),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };

          set((state) => ({
            orders: [...state.orders, newOrder],
          }));

          return newOrder;
        } catch (error) {
          console.error("Error adding order:", error);
          throw error;
        }
      },

      updateOrder: async (id: string, updates: Partial<Order>) => {
        try {
          const payload: any = {};
          if (updates.orderNumber !== undefined) payload.order_number = updates.orderNumber;
          if (updates.customerId !== undefined) payload.customer_id = updates.customerId;
          if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
          if (updates.customerEmail !== undefined) payload.customer_email = updates.customerEmail;
          if (updates.items !== undefined) payload.items = updates.items;
          if (updates.subtotal !== undefined) payload.subtotal = updates.subtotal;
          if (updates.tax !== undefined) payload.tax = updates.tax;
          if (updates.total !== undefined) payload.total = updates.total;
          if (updates.discount !== undefined) payload.discount = updates.discount;
          if (updates.discountType !== undefined) payload.discount_type = updates.discountType;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
          if (updates.amountPaid !== undefined) payload.amount_paid = updates.amountPaid;
          if (updates.amountDue !== undefined) payload.amount_due = updates.amountDue;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.deliveryDate !== undefined) payload.delivery_date = updates.deliveryDate;
          if (updates.orderTime !== undefined) payload.order_time = updates.orderTime;
          if (updates.inventoryDeducted !== undefined) payload.inventory_deducted = updates.inventoryDeducted;

          const { error } = await supabase
            .from("orders")
            .update(payload)
            .eq("id", id);

          if (error) throw error;

          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id ? { ...o, ...updates } : o
            ),
          }));
        } catch (error) {
          console.error("Error updating order:", error);
          throw error;
        }
      },

      deleteOrder: async (id: string) => {
        try {
          const { error } = await supabase.from("orders").delete().eq("id", id);
          if (error) throw error;

          set((state) => ({
            orders: state.orders.filter((o) => o.id !== id),
          }));
        } catch (error) {
          console.error("Error deleting order:", error);
          throw error;
        }
      },

      // Memoized calculations with caching
      getTotalRevenue: () => {
        return memoize("totalRevenue", () => {
          const state = get();
          return state.orders
            .filter((o) => o.status !== "cancelled" && o.status !== "draft")
            .reduce((sum, order) => sum + Number(order.subtotal - (order.discount || 0)), 0);
        });
      },

      getPendingOrders: () => {
        return memoize("pendingOrders", () => {
          const state = get();
          return state.orders.filter((o) => o.status === "pending");
        });
      },

      getCompletedOrders: () => {
        return memoize("completedOrders", () => {
          const state = get();
          return state.orders.filter((o) => o.status === "delivered");
        });
      },

      getTopCustomers: (limit = 5) => {
        return memoize(`topCustomers:${limit}`, () => {
          const state = get();
          const customerTotals = state.orders
            .filter((o) => o.status !== "cancelled" && o.status !== "draft")
            .reduce((acc, order) => {
              const customerId = order.customerId;
              if (!acc[customerId]) {
                acc[customerId] = 0;
              }
              acc[customerId] += Number(order.subtotal - (order.discount || 0));
              return acc;
            }, {} as Record<string, number>);

          return Object.entries(customerTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([customerId, total]) => ({
              ...state.customers.find((c) => c.id === customerId)!,
              totalSpent: total,
            }));
        });
      },

      getLowStockProducts: () => {
        return memoize("lowStockProducts", () => {
          const state = get();
          return state.products.filter(
            (p) => (p.currentInventory || 0) < 10
          );
        });
      },

      getRecentOrders: (limit = 5) => {
        return memoize(`recentOrders:${limit}`, () => {
          const state = get();
          return [...state.orders]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
        });
      },
    }),
    {
      name: "bakery-store",
      partialize: (state) => ({
        products: state.products,
        customers: state.customers,
        orders: state.orders,
        lastSync: state.lastSync,
      }),
    }
  )
);

export default useStore;