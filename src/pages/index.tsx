import { useEffect, useState } from "react";
import { SEO } from "@/components/SEO";
import useStore from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, BarChart2, Users, ShoppingCart, TrendingUp, AlertCircle, DollarSign, Search, X, PlusCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import { supabaseService } from "@/services/supabaseService";
import { toast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import type { Customer, Order } from "@/types";

const AlertsPanel = dynamic(() => import("@/components/AlertsPanel").then(mod => mod.AlertsPanel), {
  ssr: false,
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg" />
});

export default function Dashboard() {
  const { products, customers, orders, isLoading, isInitialized, initialize, getTotalRevenue, getPendingOrders, getCompletedOrders, getTopCustomers, getLowStockProducts, getRecentOrders } = useStore();

  const [mounted, setMounted] = useState(false);

  // Customer lookup
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showLookup, setShowLookup] = useState(false);

  // Payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [salesStats, setSalesStats] = useState<{name: string, nameHebrew: string, totalLbs: number, totalRevenue: number, orderCount: number}[]>([]);

  const loadSalesStats = async () => {
    try {
      const { data: ordersData } = await supabase.from("orders").select("items, status");
      const { data: productsData } = await supabase.from("products").select("id, name, name_hebrew");
      if (!ordersData || !productsData) return;
      const stats: Record<string, {totalLbs: number, totalRevenue: number, orderCount: number}> = {};
      ordersData.filter((o: any) => o.status !== "cancelled").forEach((order: any) => {
        (order.items || []).forEach((item: any) => {
          if (!stats[item.productId]) stats[item.productId] = {totalLbs: 0, totalRevenue: 0, orderCount: 0};
          const lbs = item.unit === "half_lb" ? item.quantity * 0.5 : item.quantity;
          stats[item.productId].totalLbs += lbs;
          stats[item.productId].totalRevenue += item.finalPrice || item.totalPrice || 0;
          stats[item.productId].orderCount += 1;
        });
      });
      const result = (productsData as any[]).map((p: any) => ({
        name: p.name,
        nameHebrew: p.name_hebrew || "",
        totalLbs: stats[p.id]?.totalLbs || 0,
        totalRevenue: stats[p.id]?.totalRevenue || 0,
        orderCount: stats[p.id]?.orderCount || 0,
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);
      setSalesStats(result);
    } catch(e) { console.error("sales stats error", e); }
  };

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  const totalRevenue = mounted && isInitialized ? getTotalRevenue() : 0;
  const pendingOrders = mounted && isInitialized ? getPendingOrders() : [];
  const lowStockProducts = mounted && isInitialized ? getLowStockProducts() : [];
  const topCustomers = mounted && isInitialized ? getTopCustomers(5) : [];
  const recentOrders = mounted && isInitialized ? getRecentOrders(5) : [];

  useEffect(() => {
    if (mounted) loadSalesStats();
  }, [mounted]);

  // Customer lookup search
  useEffect(() => {
    if (!lookupQuery.trim()) { setLookupResults([]); return; }
    const q = lookupQuery.toLowerCase();
    const allCustomers = customers.length > 0 ? customers : [];
    const filtered = allCustomers.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q) || (c.phone || "").replace(/-/g, "").includes(q.replace(/-/g, "")) ||
      (c.mobile || "").includes(q) || (c.mobile || "").replace(/-/g, "").includes(q.replace(/-/g, "")) ||
      (c.email || "").toLowerCase().includes(q) ||
      ((c as any).nameHebrew || "").includes(q)
    ).slice(0, 8);
    setLookupResults(filtered);
  }, [lookupQuery, customers]);

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLookupQuery("");
    setLookupResults([]);
    setShowLookup(true);
    setLoadingOrders(true);
    try {
      const { data } = await supabaseService.getOrdersByCustomer(customer.id);
      const mapped = ((data || []) as any[]).map((o: any) => ({
        ...o,
        orderNumber: o.order_number,
        customerId: o.customer_id,
        amountPaid: Number(o.amount_paid || 0),
        amountDue: Number(o.amount_due || 0),
        paymentStatus: o.payment_status || "unpaid",
        createdAt: o.created_at,
        deliveryDate: o.delivery_date,
        items: o.items || [],
      }));
      setCustomerOrders(mapped);
    } catch { setCustomerOrders([]); }
    setLoadingOrders(false);
  };

  const openPaymentDialog = (order: any) => {
    setPaymentOrder(order);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setShowPaymentDialog(true);
  };

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setSavingPayment(true);
    try {
      await supabaseService.addPayment({ order_id: paymentOrder.id, amount, payment_method: paymentMethod, payment_date: new Date().toISOString(), notes: paymentNotes });
      const newPaid = (paymentOrder.amountPaid || 0) + amount;
      const newDue = Math.max(0, (paymentOrder.total || 0) - newPaid);
      const newStatus = newDue <= 0 ? "paid" : newPaid > 0 ? "partial" : "unpaid";
      await supabaseService.updateOrder(paymentOrder.id, { amount_paid: newPaid, amount_due: newDue, payment_status: newStatus } as any);

      setCustomerOrders(prev => prev.map(o => o.id === paymentOrder.id ? { ...o, amountPaid: newPaid, amountDue: newDue, paymentStatus: newStatus } : o));

      if (selectedCustomer?.email) {
        await emailService.sendPaymentConfirmation({ ...paymentOrder, amountPaid: newPaid }, selectedCustomer as any, amount, paymentMethod);
      }

      setShowPaymentDialog(false);
      toast({ title: "Payment recorded", description: `$${amount.toFixed(2)} recorded.` });
    } catch {
      toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
    } finally { setSavingPayment(false); }
  };

  const totalOwed = customerOrders.reduce((sum, o) => sum + Math.max(0, (o.total || 0) - (o.amountPaid || 0)), 0);

  if ((isLoading && !isInitialized) || !mounted) {
    return (
      <div className="p-8 space-y-4">
        <div className="text-sm text-muted-foreground">Initializing dashboard...</div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted rounded-t-lg" />
              <CardContent className="h-24 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Dashboard - Satmar Montreal Matzos" description="Sales and inventory management dashboard" />
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <Link href="/orders/new">
            <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
              <ShoppingCart className="mr-2 h-5 w-5" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">{orders.length} total orders</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
              <Package className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{lowStockProducts.length} low stock items</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active customer base</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
              <ShoppingCart className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Lookup */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Search className="h-5 w-5" />
              Customer Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, phone, email..."
                className="pl-9 bg-white"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
              />
              {lookupResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {lookupResults.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0"
                      onClick={() => handleSelectCustomer(c)}
                    >
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500">{c.phone || c.mobile || c.email || ""}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AlertsPanel />

        {/* Products Sold Summary */}
        {mounted && salesStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                Products Sold Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesStats.map((product) => (
                  <div key={product.name} className="border rounded-lg p-4 bg-amber-50/50">
                    <div className="font-semibold text-gray-800">{product.name}</div>
                    {product.nameHebrew && <div className="text-sm text-gray-500 mb-2" dir="rtl">{product.nameHebrew}</div>}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">{product.totalLbs.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">lbs sold</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">${product.totalRevenue.toFixed(0)}</div>
                        <div className="text-xs text-gray-500">revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-700">{product.orderCount}</div>
                        <div className="text-xs text-gray-500">orders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Sold Summary */}
        {mounted && salesStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                Products Sold Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesStats.map((product) => (
                  <div key={product.name} className="border rounded-lg p-4 bg-amber-50/50">
                    <div className="font-semibold text-gray-800">{product.name}</div>
                    {product.nameHebrew && <div className="text-sm text-gray-500 mb-2" dir="rtl">{product.nameHebrew}</div>}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">{product.totalLbs.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">lbs sold</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">${product.totalRevenue.toFixed(0)}</div>
                        <div className="text-xs text-gray-500">revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-700">{product.orderCount}</div>
                        <div className="text-xs text-gray-500">orders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Sold Summary */}
        {mounted && salesStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                Products Sold Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesStats.map((product) => (
                  <div key={product.name} className="border rounded-lg p-4 bg-amber-50/50">
                    <div className="font-semibold text-gray-800">{product.name}</div>
                    {product.nameHebrew && <div className="text-sm text-gray-500 mb-2" dir="rtl">{product.nameHebrew}</div>}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">{product.totalLbs.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">lbs sold</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">${product.totalRevenue.toFixed(0)}</div>
                        <div className="text-xs text-gray-500">revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-700">{product.orderCount}</div>
                        <div className="text-xs text-gray-500">orders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Sold Summary */}
        {mounted && salesStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                Products Sold Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesStats.map((product) => (
                  <div key={product.name} className="border rounded-lg p-4 bg-amber-50/50">
                    <div className="font-semibold text-gray-800">{product.name}</div>
                    {product.nameHebrew && <div className="text-sm text-gray-500 mb-2" dir="rtl">{product.nameHebrew}</div>}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">{product.totalLbs.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">lbs sold</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-700">${product.totalRevenue.toFixed(0)}</div>
                        <div className="text-xs text-gray-500">revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-700">{product.orderCount}</div>
                        <div className="text-xs text-gray-500">orders</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mounted && recentOrders.length > 0 ? recentOrders.map((order) => {
                  const customer = customers.find((c) => c.id === order.customerId);
                  const orderTotal = order.discount ? order.subtotal - order.discount : order.subtotal;
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">Order #{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{customer?.name || "Unknown Customer"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${orderTotal.toFixed(2)}</p>
                        <Badge variant={order.status === "delivered" ? "default" : order.status === "pending" ? "secondary" : "destructive"}>{order.status}</Badge>
                      </div>
                    </Link>
                  );
                }) : (
                  <p className="text-muted-foreground text-center py-8">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No customer data yet</p>
              ) : (
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <button key={customer.id} onClick={() => handleSelectCustomer(customer as any)} className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">{index + 1}</div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${customer.totalSpent.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Total spent</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {lowStockProducts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lowStockProducts.map((product) => (
                  <Link key={product.id} href="/products" className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-white dark:bg-background hover:bg-amber-100 transition-colors">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <Badge variant="destructive">{product.currentInventory || 0} left</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customer Lookup Slide-over */}
      <Dialog open={showLookup} onOpenChange={setShowLookup}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedCustomer?.name}
              {(selectedCustomer as any)?.nameHebrew && (
                <span className="text-sm font-normal text-gray-500 ml-2" dir="rtl">{(selectedCustomer as any).nameHebrew}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              <div className="flex flex-wrap gap-3 mt-1 text-sm">
                {selectedCustomer?.phone && <span>📞 {selectedCustomer.phone}</span>}
                {selectedCustomer?.mobile && <span>📱 {selectedCustomer.mobile}</span>}
                {selectedCustomer?.email && <span>✉️ {selectedCustomer.email}</span>}
                {selectedCustomer?.address && <span>📍 {selectedCustomer.address}{selectedCustomer.city ? `, ${selectedCustomer.city}` : ""}</span>}
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 py-2">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{customerOrders.length}</div>
              <div className="text-xs text-blue-600">Orders</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">${customerOrders.reduce((s, o) => s + (o.total || 0), 0).toFixed(0)}</div>
              <div className="text-xs text-green-600">Total Orders</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-700">${totalOwed.toFixed(0)}</div>
              <div className="text-xs text-red-600">Balance Due</div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Order History</h3>
            {loadingOrders ? (
              <div className="text-center py-6 text-gray-500">Loading orders...</div>
            ) : customerOrders.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No orders found</div>
            ) : customerOrders.map(order => {
              const due = Math.max(0, (order.total || 0) - (order.amountPaid || 0));
              return (
                <div key={order.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">#{order.orderNumber || order.id?.slice(0,8)}</span>
                      <span className="text-xs text-gray-500 ml-2">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}</span>
                      {order.deliveryDate && <span className="text-xs text-amber-600 ml-2">🚚 {new Date(order.deliveryDate).toLocaleDateString()}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}>
                        {order.status}
                      </Badge>
                      <Badge variant={order.paymentStatus === "paid" ? "default" : order.paymentStatus === "partial" ? "secondary" : "destructive"}>
                        {order.paymentStatus === "paid" ? "✓ Paid" : order.paymentStatus === "partial" ? "Partial" : "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total: <strong>${(order.total || 0).toFixed(2)}</strong> · Paid: <strong className="text-green-600">${(order.amountPaid || 0).toFixed(2)}</strong> · Due: <strong className={due > 0 ? "text-red-600" : "text-green-600"}>${due.toFixed(2)}</strong></span>
                    <div className="flex gap-1">
                      {due > 0 && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs px-2" onClick={() => openPaymentDialog(order)}>
                          <PlusCircle className="w-3 h-3 mr-1" />Payment
                        </Button>
                      )}
                      <Link href={`/orders/${order.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2">View</Button>
                      </Link>
                      <Link href={`/orders/${order.id}/edit`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2">Edit</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Link href={`/customers/${selectedCustomer?.id}`}>
              <Button variant="outline">Full Profile</Button>
            </Link>
            <Link href="/orders/new">
              <Button className="bg-amber-600 hover:bg-amber-700">New Order for Customer</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Order #{paymentOrder?.orderNumber} · Balance: <strong>${Math.max(0, (paymentOrder?.total || 0) - (paymentOrder?.amountPaid || 0)).toFixed(2)}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Amount ($)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="e-transfer">E-Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Check #, reference, etc." value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} />
            </div>
            {selectedCustomer?.email && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Confirmation will be emailed to {selectedCustomer.email}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={savingPayment} className="bg-green-600 hover:bg-green-700">
              {savingPayment ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
