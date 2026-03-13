import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Order } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/services/supabaseService";
import type { GetServerSideProps } from "next";

interface OrdersPageProps {
    initialOrders: Order[];
    initialCustomers: Array<{ id: string; name: string }>;
}

export default function OrdersPage({ initialOrders, initialCustomers }: OrdersPageProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [customers, setCustomers] = useState(initialCustomers);
    const [searchTerm, setSearchTerm] = useState("");

    // Client-side load
    useEffect(() => {
        const load = async () => {
            const { data: ordersData } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
            const { data: customersData } = await supabase.from("customers").select("id,name,first_name,last_name").order("name", { ascending: true });
            if (ordersData) setOrders((ordersData as any[]).map((o: any) => ({
                id: o.id,
                orderNumber: o.order_number,
                customerId: o.customer_id,
                customerName: o.customer_name,
                customerEmail: o.customer_email,
                items: o.items || [],
                subtotal: Number(o.subtotal || 0),
                tax: 0,
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
            })));
            if (customersData) setCustomers((customersData as any[]).map((c: any) => ({
                id: c.id,
                name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
            })));
        };
        load();
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel("orders-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                async () => {
                    const { data, error } = await supabaseService.getOrders();
                    if (error) {

                        console.error("[OrdersPage][realtime getOrders] error", error);
                        return;
                    }
                    setOrders(((data || []) as any[]).map((o: any) => ({
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
                    })));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getCustomerName = (customerId: string) => {
        const customer = customers.find((c) => c.id === customerId);
        return customer?.name || "Unknown";
    };

    const filteredOrders = orders.filter((order) => {
        const customerName = getCustomerName(order.customerId);
        return (
            customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-500";
            case "confirmed":
                return "bg-blue-500";
            case "completed":
                return "bg-green-500";
            case "cancelled":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <>
            <SEO
                title="Orders - Satmar Montreal Matzos"
                description="Manage customer orders for Satmar Montreal Matzos"
            />
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Orders</h1>
                        <p className="text-muted-foreground">Manage and track all orders</p>
                    </div>
                    <Link href="/orders/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Order
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Search Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Search by customer name or order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4">
                    {filteredOrders.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No orders found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredOrders.map((order) => (
                            <Link key={order.id} href={`/orders/${order.id}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-lg">{getCustomerName(order.customerId)}</p>
                                                <p className="text-sm text-muted-foreground">Order #{order.orderNumber || order.id.slice(0, 8)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <Badge className={getStatusColor(order.status)}>
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </Badge>
                                                <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: { initialOrders: [], initialCustomers: [] } };
};