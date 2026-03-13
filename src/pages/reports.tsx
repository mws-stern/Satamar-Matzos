import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, TrendingUp, Users, Package } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import type { Order, Product, Customer } from "@/types";

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState < Order[] > ([]);
    const [products, setProducts] = useState < Product[] > ([]);
    const [customers, setCustomers] = useState < Customer[] > ([]);
    const [dateRange, setDateRange] = useState < "week" | "month" | "year" > ("month");

    useEffect(() => {
        loadReportData();
    }, []);

    const loadReportData = async () => {
        setLoading(true);

        try {
            const { data: ordersData } = await supabaseService.getOrders();
            const { data: productsData } = await supabaseService.getProducts();
            const { data: customersData } = await supabaseService.getCustomers();

            // Map DB snake_case rows to typed Order objects
            const mappedOrders: Order[] = ((ordersData || []) as any[]).map((o: any) => ({
                id: o.id,
                orderNumber: o.order_number,
                customerId: o.customer_id,
                customerName: o.customer_name,
                customerEmail: o.customer_email,
                items: o.items || [],
                subtotal: Number(o.subtotal || 0),
                tax: Number(o.tax || 0),
                total: Number(o.total || 0),
                discount: Number(o.discount || 0),
                discountType: o.discount_type ?? "fixed",
                status: o.status ?? "pending",
                paymentStatus: o.payment_status ?? "unpaid",
                amountPaid: Number(o.amount_paid || 0),
                amountDue: Number(o.amount_due || 0),
                notes: o.notes || "",
                deliveryDate: o.delivery_date,
                orderTime: o.order_time,
                inventoryDeducted: Boolean(o.inventory_deducted),
                createdAt: o.created_at,
                updatedAt: o.updated_at,
            }));

            setOrders(mappedOrders);
            setProducts((productsData || []) as Product[]);
            setCustomers((customersData || []) as Customer[]);
        } catch (error) {
            console.error("[ReportsPage][loadReportData] error", error);
            setOrders([]);
            setProducts([]);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredOrders = () => {
        const now = new Date();
        const startDate = new Date();

        switch (dateRange) {
            case "week":
                startDate.setDate(now.getDate() - 7);
                break;
            case "month":
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "year":
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        return orders.filter((order) => new Date(order.createdAt) >= startDate);
    };

    const filteredOrders = getFilteredOrders();

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const paidRevenue = filteredOrders
        .filter((order) => order.paymentStatus === "paid")
        .reduce((sum, order) => sum + order.total, 0);
    const pendingRevenue = filteredOrders
        .filter((order) => order.paymentStatus !== "paid")
        .reduce((sum, order) => sum + order.amountDue, 0);

    // Sales by product
    const salesByProduct: Record<string, { quantity: number; revenue: number; productName: string }> = {};
    filteredOrders.forEach((order) => {
        order.items.forEach((item) => {
            if (!salesByProduct[item.productId]) {
                salesByProduct[item.productId] = {
                    quantity: 0,
                    revenue: 0,
                    productName: item.productName,
                };
            }
            salesByProduct[item.productId].quantity += item.quantity ?? 0;
            salesByProduct[item.productId].revenue += item.finalPrice ?? item.totalPrice ?? 0;
        });
    });

    const topProducts = Object.entries(salesByProduct)
        .map(([id, data]) => ({ productId: id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    // Sales by customer
    const salesByCustomer: Record<string, { orders: number; revenue: number; customerName: string }> = {};
    filteredOrders.forEach((order) => {
        if (!salesByCustomer[order.customerId]) {
            salesByCustomer[order.customerId] = {
                orders: 0,
                revenue: 0,
                customerName: order.customerName,
            };
        }
        salesByCustomer[order.customerId].orders += 1;
        salesByCustomer[order.customerId].revenue += order.total;
    });

    const topCustomers = Object.entries(salesByCustomer)
        .map(([id, data]) => ({ customerId: id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    // Order status breakdown
    const ordersByStatus: Record<string, number> = {};
    filteredOrders.forEach((order) => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    if (loading) {
        return (
            <>
                <SEO title="Reports - Bakery Sales" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading reports...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO title="Reports - Bakery Sales" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-orange-500" />
                        <h1 className="text-3xl font-bold">Reports</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setDateRange("week")}
                            className={`px-4 py-2 rounded-lg transition-colors ${dateRange === "week"
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Last Week
                        </button>
                        <button
                            onClick={() => setDateRange("month")}
                            className={`px-4 py-2 rounded-lg transition-colors ${dateRange === "month"
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Last Month
                        </button>
                        <button
                            onClick={() => setDateRange("year")}
                            className={`px-4 py-2 rounded-lg transition-colors ${dateRange === "year"
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Last Year
                        </button>
                    </div>
                </div>

                {/* Revenue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Revenue</p>
                                    <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Paid Revenue</p>
                                    <p className="text-2xl font-bold text-green-600">${paidRevenue.toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Pending Revenue</p>
                                    <p className="text-2xl font-bold text-orange-600">${pendingRevenue.toFixed(2)}</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-orange-500" />
                            Top Selling Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                            Quantity Sold
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {topProducts.map((product, index) => (
                                        <tr key={product.productId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                                                    <span className="font-medium">{product.productName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                                {product.quantity.toFixed(2)} lbs
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                ${product.revenue.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Customers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-orange-500" />
                            Top Customers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                            Orders
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                            Total Spent
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {topCustomers.map((customer, index) => (
                                        <tr key={customer.customerId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                                                    <span className="font-medium">{customer.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                                {customer.orders}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                ${customer.revenue.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Status Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(ordersByStatus).map(([status, count]) => (
                                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1 capitalize">{status}</p>
                                    <p className="text-2xl font-bold">{count}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}