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
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [downloading, setDownloading] = useState(false);

    const downloadOrdersPDF = async () => {
        setDownloading(true);
        try {
            const filtered = orders.filter(o => {
                if (!fromDate && !toDate) return true;
                const d = new Date(o.createdAt);
                if (fromDate && d < new Date(fromDate)) return false;
                if (toDate && d > new Date(toDate + "T23:59:59")) return false;
                return true;
            });
            if (filtered.length === 0) { alert("No orders in selected date range"); setDownloading(false); return; }
            const jsPDFModule = await import("jspdf");
            const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF;
            const JSZipModule = await import("jszip");
            const JSZip = JSZipModule.default;
            const zip = new JSZip();
            for (const order of filtered) {
                const doc = new jsPDF({ format: "letter", unit: "mm" });
                const pw = 215.9; const ph = 279.4;
                // Header brown bar
                doc.setFillColor(146, 64, 14);
                doc.rect(0, 0, pw, 38, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22); doc.setFont("helvetica", "bold");
                doc.text("Satmar Montreal Matzos", pw/2, 14, { align: "center" });
                doc.setFontSize(10); doc.setFont("helvetica", "normal");
                doc.text("2765 Chemin Bates, Montreal, QC | sales@satmarmatzosmtl.ca | 438-300-8425", pw/2, 23, { align: "center" });
                doc.setFontSize(13); doc.setFont("helvetica", "bold");
                doc.text("ORDER PREP SHEET", pw/2, 33, { align: "center" });
                // Order info
                doc.setTextColor(0,0,0);
                let y = 45;
                doc.setFontSize(14); doc.setFont("helvetica", "bold");
                doc.text(`#${order.orderNumber || order.id.slice(0,8)} - ${order.customerName || ""}`, 15, y); y+=8;
                doc.setFontSize(10); doc.setFont("helvetica", "normal");
                doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 15, y);
                if (order.deliveryDate) doc.text(`Delivery: ${new Date(order.deliveryDate).toLocaleDateString()}`, 90, y);
                doc.text(`Status: ${order.status.toUpperCase()}`, 160, y); y+=7;
                // Customer address - fetch from customers array
                const cust = customers.find((c: any) => c.id === order.customerId);
                if (cust) {
                    const addr = [cust.phone || cust.mobile, cust.address || cust.street, cust.city].filter(Boolean).join(" | ");
                    if (addr) { doc.text(addr, 15, y); y+=7; }
                }
                // Divider
                doc.setDrawColor(215, 119, 6); doc.setLineWidth(0.8);
                doc.line(15, y, pw-15, y); y+=6;
                // Table header
                doc.setFillColor(254, 243, 199);
                doc.rect(15, y, pw-30, 9, "F");
                doc.setDrawColor(215,119,6); doc.rect(15, y, pw-30, 9);
                doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0,0,0);
                doc.text("PRODUCT", 18, y+6);
                doc.text("QTY", 120, y+6, { align: "center" });
                doc.text("PRICE/LB", 148, y+6, { align: "center" });
                doc.text("DISCOUNT", 172, y+6, { align: "center" });
                doc.text("TOTAL", 198, y+6, { align: "right" });
                y+=9;
                // Items
                doc.setFont("helvetica", "normal");
                (order.items || []).forEach((item: any, i: number) => {
                    const rowH = 10;
                    if (i%2===0) { doc.setFillColor(255,255,255); } else { doc.setFillColor(255,251,235); }
                    doc.rect(15, y, pw-30, rowH, "F");
                    doc.setDrawColor(229,231,235); doc.rect(15, y, pw-30, rowH);
                    doc.setTextColor(0,0,0); doc.setFontSize(9);
                    doc.text(item.productName || "", 18, y+6.5);
                    const qty = item.unit === "half_lb" ? `${item.quantity} half-lb` : `${item.quantity} lb`;
                    doc.text(qty, 120, y+6.5, { align: "center" });
                    doc.text(`$${(item.pricePerLb||0).toFixed(2)}`, 148, y+6.5, { align: "center" });
                    const disc = item.discount > 0 ? (item.discountType==="percent" ? `${item.discount}%` : `$${item.discount}`) : "-";
                    doc.text(disc, 172, y+6.5, { align: "center" });
                    doc.text(`$${(item.finalPrice||item.totalPrice||0).toFixed(2)}`, 198, y+6.5, { align: "right" });
                    y+=rowH;
                });
                y+=5;
                // Totals
                doc.setDrawColor(215,119,6); doc.setLineWidth(0.5); doc.line(140, y, pw-15, y); y+=6;
                doc.setFont("helvetica", "normal"); doc.setFontSize(10);
                doc.text("Subtotal:", 145, y); doc.text(`$${(order.subtotal||0).toFixed(2)}`, pw-15, y, { align: "right" }); y+=7;
                if ((order.discount||0) > 0) { doc.text("Discount:", 145, y); doc.text(`-$${(order.discount||0).toFixed(2)}`, pw-15, y, { align: "right" }); y+=7; }
                doc.setFont("helvetica", "bold"); doc.setFontSize(12);
                doc.text("TOTAL:", 145, y); doc.text(`$${(order.total||0).toFixed(2)}`, pw-15, y, { align: "right" }); y+=8;
                doc.setTextColor(22,163,74); doc.setFontSize(10);
                doc.text("Paid:", 145, y); doc.text(`$${(order.amountPaid||0).toFixed(2)}`, pw-15, y, { align: "right" }); y+=7;
                doc.setTextColor(220,38,38);
                doc.text("Balance Due:", 145, y); doc.text(`$${(order.amountDue||0).toFixed(2)}`, pw-15, y, { align: "right" });
                // Notes
                if (order.notes) { doc.setTextColor(0,0,0); doc.setFontSize(9); doc.text(`Notes: ${order.notes}`, 15, ph-18); }
                // Footer
                doc.setFillColor(146,64,14); doc.rect(0, ph-12, pw, 12, "F");
                doc.setTextColor(255,255,255); doc.setFontSize(8);
                doc.text("Satmar Montreal Matzos | Thank you for your order!", pw/2, ph-5, { align: "center" });
                zip.file(`Order-${order.orderNumber || order.id.slice(0,8)}.pdf`, doc.output("blob"));

            }
            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Orders-${fromDate || "all"}-to-${toDate || "all"}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch(e) { console.error("PDF ZIP error:", e); alert("Download failed: " + e); }
        setDownloading(false);
    };

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

    const getCustomerName = (order: any) => {
        if (order.customerName) return order.customerName;
        const customer = customers.find((c) => c.id === order.customerId);
        return customer?.name || "Unknown";
    };

    const filteredOrders = orders.filter((order) => {
        const customerName = getCustomerName(order);
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
                    <div className="flex gap-2 items-center flex-wrap">
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                        <span className="text-sm">to</span>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                        <Button variant="outline" onClick={downloadOrdersPDF} disabled={downloading}>
                            {downloading ? "Downloading..." : "Download ZIP"}
                        </Button>
                        <Link href="/orders/new">
                            <Button><Plus className="w-4 h-4 mr-2" />New Order</Button>
                        </Link>
                    </div>
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
                                                <p className="font-semibold text-lg">{getCustomerName(order)}</p>
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