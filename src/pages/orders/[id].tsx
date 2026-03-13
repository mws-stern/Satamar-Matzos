import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Edit2,
    Trash2,
    Calendar,
    User,
    Package,
    DollarSign,
    Mail,
    FileText,
    Printer,
    PlusCircle,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Order, Customer, Product } from "@/types";
import { supabaseService } from "@/services/supabaseService";
import { emailService } from "@/services/emailService";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function OrderDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const [order, setOrder] = useState < Order | null > (null);
    const [customer, setCustomer] = useState < Customer | null > (null);
    const [products, setProducts] = useState < Product[] > ([]);
    const [loading, setLoading] = useState(true);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [sendingInvoice, setSendingInvoice] = useState(false);
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [emailPreviewHtml, setEmailPreviewHtml] = useState("");
    const [emailPreviewType, setEmailPreviewType] = useState < "confirmation" | "invoice" > ("confirmation");
    const [editingEmail, setEditingEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState("");
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [savingPayment, setSavingPayment] = useState(false);
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        if (id && typeof id === "string") {
            loadOrderDetails(id);
        }
    }, [id]);

    const loadOrderDetails = async (orderId: string) => {
        try {
            setLoading(true);

            const { data: orderData, error: orderError } = await supabaseService.getOrder(orderId);
            if (orderError || !orderData) {
                setOrder(null);
                setCustomer(null);
                setProducts([]);
                setLoading(false);
                return;
            }

            // Map DB snake_case row to Order type
            const mappedOrder: Order = {
                id: orderData.id,
                orderNumber: (orderData as any).order_number,
                customerId: (orderData as any).customer_id,
                customerName: (orderData as any).customer_name,
                customerEmail: (orderData as any).customer_email,
                items: ((orderData as any).items || []) as Order["items"],
                subtotal: Number((orderData as any).subtotal || 0),
                tax: Number((orderData as any).tax || 0),
                total: Number((orderData as any).total || 0),
                discount: Number((orderData as any).discount || 0),
                discountType: ((orderData as any).discount_type as Order["discountType"]) ?? "fixed",
                status: ((orderData as any).status as Order["status"]) ?? "pending",
                paymentStatus: ((orderData as any).payment_status as Order["paymentStatus"]) ?? "unpaid",
                amountPaid: Number((orderData as any).amount_paid || 0),
                amountDue: Number((orderData as any).amount_due || 0),
                notes: (orderData as any).notes || "",
                deliveryDate: (orderData as any).delivery_date,
                orderTime: (orderData as any).order_time,
                inventoryDeducted: Boolean((orderData as any).inventory_deducted),
                createdAt: (orderData as any).created_at,
                updatedAt: (orderData as any).updated_at,
            };
            setOrder(mappedOrder);

            const { data: customerData } = await supabaseService.getCustomer(mappedOrder.customerId);
            setCustomer((customerData as Customer) ?? null);

            const { data: productsData } = await supabaseService.getProducts();
            setProducts(((productsData || []) as any[]).map((p: any) => ({
                ...p,
                nameHebrew: p.name_hebrew || "",
                pricePerLb: Number(p.price_per_lb || 0),
                sellByHalfLb: Boolean((p as any).sell_by_half_lb),
                pricePerHalfLb: (p as any).price_per_half_lb ? Number((p as any).price_per_half_lb) : undefined,
                inStock: Boolean(p.in_stock),
                currentInventory: Number(p.current_inventory || 0),
            })) as Product[]);

            const { data: paymentsData } = await supabaseService.getPaymentsByOrder(orderId);
            setPayments(paymentsData || []);
        } catch (error) {
            console.error("[OrderDetail][loadOrderDetails] error", error);
            setOrder(null);
            setCustomer(null);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!order) return;

        try {
            await supabaseService.deleteOrder(order.id);
            toast({
                title: "Success",
                description: "Order deleted successfully",
            });
            router.push("/orders");
        } catch (error) {
            console.error("Error deleting order:", error);
            toast({
                title: "Error",
                description: "Failed to delete order",
                variant: "destructive",
            });
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!order) return;

        try {
            await supabaseService.updateOrder(order.id, { status: newStatus });
            setOrder({ ...order, status: newStatus as Order["status"] });
            toast({
                title: "Success",
                description: "Order status updated successfully",
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                title: "Error",
                description: "Failed to update order status",
                variant: "destructive",
            });
        }
    };

    const handleSaveEmail = async () => {
        if (!tempEmail || !tempEmail.includes("@")) {
            toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
            return;
        }
        await supabaseService.updateCustomer(customer!.id, { email: tempEmail });
        setCustomer({ ...customer!, email: tempEmail });
        setEditingEmail(false);
        toast({ title: "Email saved", description: "Customer email updated successfully." });
    };

    const handleRecordPayment = async () => {
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) {
            toast({ title: "Invalid amount", description: "Please enter a valid payment amount.", variant: "destructive" });
            return;
        }
        setSavingPayment(true);
        try {
            const { data: payment, error } = await supabaseService.addPayment({
                order_id: order!.id,
                amount,
                payment_method: paymentMethod,
                payment_date: new Date().toISOString(),
                notes: paymentNotes,
            });
            if (error) throw error;

            const newAmountPaid = (order!.amountPaid || 0) + amount;
            const newAmountDue = Math.max(0, (order!.total || 0) - newAmountPaid);
            const newPaymentStatus = newAmountDue <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "unpaid";

            await supabaseService.updateOrder(order!.id, {
                amount_paid: newAmountPaid,
                amount_due: newAmountDue,
                payment_status: newPaymentStatus,
            } as any);

            setOrder(prev => prev ? { ...prev, amountPaid: newAmountPaid, amountDue: newAmountDue, paymentStatus: newPaymentStatus as any } : prev);
            setPayments(prev => [payment, ...prev]);
            setShowPaymentDialog(false);
            setPaymentAmount("");
            setPaymentNotes("");

            // Send payment confirmation email if customer has email
            if (customer?.email) {
                await emailService.sendPaymentConfirmation(
                    { ...order!, amountPaid: newAmountPaid },
                    customer,
                    amount,
                    paymentMethod
                );
            }

            toast({ title: "Payment recorded", description: `$${amount.toFixed(2)} payment recorded successfully.` });
        } catch (err) {
            toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
        } finally {
            setSavingPayment(false);
        }
    };

    const handleSendConfirmation = async () => {
        if (!customer?.email) {
            setEditingEmail(true);
            toast({ title: "Email required", description: "Please add a customer email first.", variant: "destructive" });
            return;
        }

        // Generate and show preview
        const html = emailService.generateConfirmationHtml(order, customer);
        setEmailPreviewHtml(html);
        setEmailPreviewType("confirmation");
        setShowEmailPreview(true);
    };

    const handleSendInvoice = async () => {
        if (!customer?.email) {
            setEditingEmail(true);
            toast({ title: "Email required", description: "Please add a customer email first.", variant: "destructive" });
            return;
        }

        // Generate and show preview
        const html = emailService.generateInvoiceHtml(order, customer);
        setEmailPreviewHtml(html);
        setEmailPreviewType("invoice");
        setShowEmailPreview(true);
    };

    const confirmAndSendEmail = async () => {
        setShowEmailPreview(false);

        if (emailPreviewType === "confirmation") {
            setSendingEmail(true);
            try {
                const result = await emailService.sendOrderConfirmation(order, customer!);
                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Order confirmation email sent successfully",
                    });
                } else {
                    throw new Error('Failed to send email');
                }
            } catch (error) {
                console.error("Error sending email:", error);
                toast({
                    title: "Error",
                    description: "Failed to send confirmation email",
                    variant: "destructive",
                });
            } finally {
                setSendingEmail(false);
            }
        } else {
            setSendingInvoice(true);
            try {
                const result = await emailService.sendInvoice(order, customer!);
                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Invoice email sent successfully with PDF attachment",
                    });
                } else {
                    throw new Error('Failed to send email');
                }
            } catch (error) {
                console.error("Error sending invoice:", error);
                toast({
                    title: "Error",
                    description: "Failed to send invoice email",
                    variant: "destructive",
                });
            } finally {
                setSendingInvoice(false);
            }
        }
    };

    const getProductName = (productId: string) => {
        const product = products.find(p => p.id === productId);
        return product?.name || "Unknown Product";
    };

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

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <p>Loading...</p>
            </div>
        );
    }

    if (!order || !customer) {
        return (
            <div className="container mx-auto p-6">
                <p>Order not found</p>
            </div>
        );
    }

    return (
        <>
            <SEO
                title={`Order #${order.id.slice(0, 8)} - Satmar Montreal Matzos`}
                description={`View details for order #${order.id.slice(0, 8)}`}
            />
            <div id="printable-content" className="container mx-auto p-6 space-y-6">

                {/* PRINT-ONLY ORDER PREP SHEET */}
                <div className="hidden print:block">
                    <div style={{borderBottom: "3px solid #d97706", paddingBottom: "12px", marginBottom: "16px"}}>
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
                            <div>
                                <h1 style={{fontSize: "24px", fontWeight: "900", margin: "0 0 2px 0"}}>
                                    ORDER PREP SHEET
                                </h1>
                                <p style={{fontSize: "18px", fontWeight: "700", color: "#92400e", margin: "0"}}>
                                    #{order.orderNumber} — {customer.name}
                                </p>
                                {customer.nameHebrew && <p style={{fontSize: "15px", color: "#6b7280", margin: "2px 0 0 0"}} dir="rtl">{(customer as any).nameHebrew}</p>}
                            </div>
                            <div style={{textAlign: "right", fontSize: "13px", color: "#374151"}}>
                                <p style={{margin: "0"}}><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                                {order.deliveryDate && <p style={{margin: "4px 0 0 0"}}><strong>Delivery:</strong> {new Date(order.deliveryDate).toLocaleDateString()}</p>}
                                <p style={{margin: "4px 0 0 0"}}><strong>Phone:</strong> {customer.phone || customer.mobile || "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items table */}
                    <table style={{width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "14px"}}>
                        <thead>
                            <tr style={{background: "#fef3c7"}}>
                                <th style={{padding: "8px 12px", textAlign: "left", border: "1px solid #d97706", fontWeight: "700"}}>Product</th>
                                <th style={{padding: "8px 12px", textAlign: "center", border: "1px solid #d97706", fontWeight: "700", width: "90px"}}>Qty (lbs)</th>
                                <th style={{padding: "8px 12px", textAlign: "right", border: "1px solid #d97706", fontWeight: "700", width: "90px"}}>Price/lb</th>
                                <th style={{padding: "8px 12px", textAlign: "right", border: "1px solid #d97706", fontWeight: "700", width: "90px"}}>Discount</th>
                                <th style={{padding: "8px 12px", textAlign: "right", border: "1px solid #d97706", fontWeight: "700", width: "100px"}}>Total</th>
                                <th style={{padding: "8px 12px", textAlign: "center", border: "1px solid #d97706", fontWeight: "700", width: "70px"}}>✓ Done</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, i) => (
                                <tr key={i} style={{background: i % 2 === 0 ? "#fff" : "#fffbeb"}}>
                                    <td style={{padding: "10px 12px", border: "1px solid #e5e7eb", fontWeight: "600", fontSize: "15px"}}>{item.productName}</td>
                                    <td style={{padding: "10px 12px", border: "1px solid #e5e7eb", textAlign: "center", fontSize: "16px", fontWeight: "700"}}>{item.quantity}</td>
                                    <td style={{padding: "10px 12px", border: "1px solid #e5e7eb", textAlign: "right"}}>${(item.pricePerLb || 0).toFixed(2)}</td>
                                    <td style={{padding: "10px 12px", border: "1px solid #e5e7eb", textAlign: "right", color: (item.discount||0)>0?"#dc2626":"#6b7280"}}>{(item.discount||0)>0 ? `-$${(item.discount||0).toFixed(2)}` : "—"}</td>
                                    <td style={{padding: "10px 12px", border: "1px solid #e5e7eb", textAlign: "right", fontWeight: "700"}}>${(item.finalPrice || item.totalPrice || 0).toFixed(2)}</td>
                                    <td style={{padding: "10px 12px", border: "1px solid #e5e7eb", textAlign: "center"}}><span style={{display: "inline-block", width: "24px", height: "24px", border: "2px solid #d97706", borderRadius: "4px"}}></span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals + Notes row */}
                    <div style={{display: "flex", justifyContent: "space-between", gap: "20px"}}>
                        <div style={{flex: 1, border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px"}}>
                            <p style={{margin: "0 0 6px 0", fontWeight: "700", fontSize: "13px", textTransform: "uppercase", color: "#6b7280"}}>Notes</p>
                            <p style={{margin: "0", fontSize: "14px", minHeight: "40px"}}>{order.notes || "—"}</p>
                        </div>
                        <div style={{minWidth: "200px", border: "2px solid #d97706", borderRadius: "6px", padding: "12px"}}>
                            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px"}}>
                                <span style={{color: "#6b7280"}}>Subtotal:</span>
                                <span style={{fontWeight: "600"}}>${(order.subtotal||0).toFixed(2)}</span>
                            </div>
                            {(order.discount||0) > 0 && (
                                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px", color: "#dc2626"}}>
                                    <span>Discount:</span>
                                    <span>-${(order.discount||0).toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "2px solid #d97706", fontSize: "18px", fontWeight: "900"}}>
                                <span>TOTAL:</span>
                                <span style={{color: "#92400e"}}>${(order.total||0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* END PRINT-ONLY SECTION */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/orders">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Order #{order.orderNumber || order.id.slice(0, 8)}</h1>
                            <p className="text-muted-foreground">
                                Created on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSendConfirmation}
                            disabled={sendingEmail}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            {sendingEmail ? "Sending..." : "Send Confirmation"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleSendInvoice}
                            disabled={sendingInvoice}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            {sendingInvoice ? "Sending..." : "Send Invoice"}
                        </Button>
                        <Link href={`/orders/${order.id}/edit`} className="no-print">
                            <Button variant="outline" className="gap-2">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Order
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            className="gap-2 no-print"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print / PDF
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the order.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Order Items</CardTitle>
                                <Badge className={getStatusColor(order.status)}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.items && order.items.length > 0 ? (
                                        order.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center border-b pb-4 last:border-0">
                                                <div>
                                                    <p className="font-semibold">{item.productName || getProductName(item.productId)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Quantity: {item.quantity ?? 0} {(item as any).unit === "half_lb" ? "half-lbs" : "lbs"} × ${(item.pricePerLb ?? 0).toFixed(2)}{(item as any).unit === "half_lb" ? "/half-lb" : "/lb"}
                                                    </p>
                                                    {(item.discount ?? 0) > 0 && (
                                                        <p className="text-sm text-green-600">
                                                            Discount: {item.discount}{item.discountType === 'percent' ? '%' : '$'}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="font-bold">${(item.finalPrice ?? 0).toFixed(2)}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground">No items</p>
                                    )}

                                    {/* Order Summary */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Order Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Subtotal:</span>
                                                    <span>${(order.subtotal ?? 0).toFixed(2)}</span>
                                                </div>
                                                {order.discount > 0 && (
                                                    <div className="flex justify-between text-red-600">
                                                        <span>Discount:</span>
                                                        <span>-${(order.discount ?? 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between pt-2 border-t font-semibold text-base">
                                                    <span>Total:</span>
                                                    <span className="text-orange-600">
                                                        ${(order.total ?? 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>

                        {order.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{order.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div className="w-full">
                                        <p className="font-semibold">{customer.name}</p>
                                        {customer.email ? (
                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                        ) : editingEmail ? (
                                            <div className="flex gap-2 mt-1">
                                                <Input
                                                    type="email"
                                                    placeholder="Enter email..."
                                                    value={tempEmail}
                                                    onChange={(e) => setTempEmail(e.target.value)}
                                                    className="h-7 text-sm"
                                                />
                                                <Button size="sm" className="h-7 text-xs" onClick={handleSaveEmail}>Save</Button>
                                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingEmail(false)}>Cancel</Button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditingEmail(true); setTempEmail(""); }}
                                                className="text-sm text-blue-500 hover:text-blue-700 underline mt-0.5"
                                            >
                                                + Add Email
                                            </button>
                                        )}
                                        {customer.phone && (
                                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                        )}
                                    </div>
                                </div>
                                {customer.address && (
                                    <div className="flex items-start gap-3">
                                        <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                                        <p className="text-sm text-muted-foreground">{customer.address}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Order Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={order.status} onValueChange={handleStatusChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {order.deliveryDate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Delivery Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Delivery Date</p>
                                            <p className="font-semibold">
                                                {new Date(order.deliveryDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Payment Information */}
                        <Card className="payment-section">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    Payment
                                </CardTitle>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 no-print" onClick={() => setShowPaymentDialog(true)}>
                                    <PlusCircle className="w-3 h-3 mr-1" /> Record Payment
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Order Total:</span>
                                    <span className="font-semibold">${(order.total ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Amount Paid:</span>
                                    <span className="font-semibold text-green-600">${(order.amountPaid ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t pt-2">
                                    <span className="font-semibold">Balance Due:</span>
                                    <span className={`font-bold text-base ${((order.total ?? 0) - (order.amountPaid ?? 0)) > 0 ? "text-red-600" : "text-green-600"}`}>
                                        ${Math.max(0, (order.total ?? 0) - (order.amountPaid ?? 0)).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    <Badge variant={order.paymentStatus === "paid" ? "default" : order.paymentStatus === "partial" ? "secondary" : "destructive"}>
                                        {order.paymentStatus === "paid" ? "✓ Paid" : order.paymentStatus === "partial" ? "Partial" : "Unpaid"}
                                    </Badge>
                                </div>

                                {/* Payment History */}
                                {payments.length > 0 && (
                                    <div className="mt-3 border-t pt-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Payment History</p>
                                        <div className="space-y-2">
                                            {payments.map((p: any) => (
                                                <div key={p.id} className="flex justify-between items-center text-xs bg-green-50 rounded p-2">
                                                    <div>
                                                        <span className="font-semibold text-green-700">${Number(p.amount).toFixed(2)}</span>
                                                        <span className="text-gray-500 ml-2">{p.payment_method}</span>
                                                        {p.notes && <span className="text-gray-400 ml-2">— {p.notes}</span>}
                                                    </div>
                                                    <span className="text-gray-400">{new Date(p.payment_date).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Payment Dialog */}
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record Payment</DialogTitle>
                            <DialogDescription>
                                Balance due: <strong>${Math.max(0, (order.total ?? 0) - (order.amountPaid ?? 0)).toFixed(2)}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <Label>Amount ($)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
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
                                <Textarea
                                    placeholder="Check #, reference, etc."
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            {customer?.email && (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Payment confirmation will be emailed to {customer.email}
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

                {/* Email Preview Dialog */}
                <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
                    <DialogContent className="max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>
                                {emailPreviewType === "confirmation" ? "Order Confirmation" : "Invoice"} Preview
                            </DialogTitle>
                            <DialogDescription>
                                Review the email content before sending to {customer?.email}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
                            <iframe
                                srcDoc={emailPreviewHtml}
                                style={{ width: "100%", height: "600px", border: "none" }}
                                title="Email Preview"
                            />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowEmailPreview(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmAndSendEmail}
                                disabled={sendingEmail || sendingInvoice}
                            >
                                {sendingEmail || sendingInvoice ? "Sending..." : "Send Email"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}