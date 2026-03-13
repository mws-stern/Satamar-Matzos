import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabaseService } from "@/services/supabaseService";
import { toast } from "@/hooks/use-toast";
import type { Order, Customer, Product, OrderItem } from "@/types";

export default function EditOrderPage() {
    const router = useRouter();
    const { id } = router.query;

    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [notes, setNotes] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [status, setStatus] = useState<string>("pending");
    const [orderDiscount, setOrderDiscount] = useState("");
    const [orderDiscountType, setOrderDiscountType] = useState<"fixed" | "percent">("fixed");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id || typeof id !== "string") return;
        loadData(id);
    }, [id]);

    const loadData = async (orderId: string) => {
        setLoading(true);
        const [orderResult, productsResult] = await Promise.all([
            supabaseService.getOrder(orderId),
            supabaseService.getProducts(),
        ]);

        const o = (orderResult as any).data;
        if (!o) { setLoading(false); return; }

        const mappedProducts = ((productsResult as any).data || []).map((p: any) => ({
            ...p,
            nameHebrew: p.name_hebrew || "",
            pricePerLb: Number(p.price_per_lb || 0),
            sellByHalfLb: Boolean(p.sell_by_half_lb),
            pricePerHalfLb: p.price_per_half_lb ? Number(p.price_per_half_lb) : undefined,
            inStock: Boolean(p.in_stock),
            currentInventory: Number(p.current_inventory || 0),
        })) as Product[];
        setProducts(mappedProducts);

        const mappedOrder: Order = {
            ...o,
            orderNumber: o.order_number,
            customerId: o.customer_id,
            customerName: o.customer_name || "",
            customerEmail: o.customer_email || "",
            amountPaid: Number(o.amount_paid || 0),
            amountDue: Number(o.amount_due || 0),
            paymentStatus: o.payment_status || "unpaid",
            discountType: o.discount_type || "fixed",
            createdAt: o.created_at,
            updatedAt: o.updated_at,
            deliveryDate: o.delivery_date || "",
            orderTime: o.order_time || "",
            inventoryDeducted: Boolean(o.inventory_deducted),
            items: o.items || [],
        };
        setOrder(mappedOrder);
        setItems(mappedOrder.items || []);
        setNotes(o.notes || "");
        setDeliveryDate(o.delivery_date ? o.delivery_date.split("T")[0] : "");
        setStatus(o.status || "pending");
        setOrderDiscount(o.discount ? String(o.discount) : "");
        setOrderDiscountType(o.discount_type || "fixed");

        const { data: customerData } = await supabaseService.getCustomer(o.customer_id);
        setCustomer(customerData as Customer ?? null);
        setLoading(false);
    };

    const addItem = () => {
        if (products.length === 0) return;
        const p0 = products[0];
        const unit = p0.sellByHalfLb ? "half_lb" : "lb";
        const price = p0.sellByHalfLb ? (p0.pricePerHalfLb || p0.pricePerLb) : p0.pricePerLb;
        setItems(prev => [...prev, {
            id: crypto.randomUUID(),
            orderId: order?.id || "",
            productId: p0.id,
            productName: p0.name,
            productNameHebrew: p0.nameHebrew,
            quantity: 1,
            unit,
            pricePerLb: price,
            totalPrice: price,
            discount: 0,
            discountType: "fixed",
            finalPrice: price,
        }]);
    };

    const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        if (field === "productId") {
            const product = products.find(p => p.id === value);
            if (product) {
                const unit = product.sellByHalfLb ? "half_lb" : "lb";
                const price = product.sellByHalfLb ? (product.pricePerHalfLb || product.pricePerLb) : product.pricePerLb;
                newItems[index] = { ...newItems[index], productId: product.id, productName: product.name, productNameHebrew: product.nameHebrew, unit, pricePerLb: price, totalPrice: price * newItems[index].quantity, finalPrice: price * newItems[index].quantity };
            }
        } else if (field === "quantity") {
            const qty = parseFloat(value) || 0;
            const base = newItems[index].pricePerLb * qty;
            newItems[index].quantity = qty;
            if (newItems[index].discount && newItems[index].discount > 0) {
                newItems[index].finalPrice = newItems[index].discountType === "percent" ? base * (1 - newItems[index].discount / 100) : base - newItems[index].discount;
            } else {
                newItems[index].totalPrice = base;
                newItems[index].finalPrice = base;
            }
        } else if (field === "discount") {
            const d = parseFloat(value) || 0;
            const base = newItems[index].pricePerLb * newItems[index].quantity;
            newItems[index].discount = d;
            newItems[index].finalPrice = d > 0 ? (newItems[index].discountType === "percent" ? base * (1 - d / 100) : base - d) : base;
        } else if (field === "discountType") {
            newItems[index].discountType = value;
        }
        setItems(newItems);
    };

    const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.finalPrice ?? item.totalPrice), 0);

    const calculateDiscount = () => {
        const subtotal = calculateSubtotal();
        const d = parseFloat(orderDiscount) || 0;
        if (!d) return 0;
        return orderDiscountType === "percent" ? subtotal * (d / 100) : d;
    };

    const calculateTotal = () => calculateSubtotal() - calculateDiscount();

    const handleSave = async () => {
        if (!order) return;
        setSaving(true);
        try {
            const discount = parseFloat(orderDiscount) || undefined;
            const orderItems = items.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                productNameHebrew: item.productNameHebrew || null,
                quantity: item.quantity,
                unit: (item as any).unit ?? "lb",
                pricePerLb: item.pricePerLb,
                totalPrice: item.totalPrice,
                discount: item.discount || 0,
                discountType: item.discountType || "fixed",
                finalPrice: item.finalPrice ?? item.totalPrice,
            }));

            await supabaseService.updateOrder(order.id, {
                items: orderItems,
                notes,
                delivery_date: deliveryDate || null,
                status,
                discount: discount ?? null,
                discount_type: discount ? orderDiscountType : null,
                subtotal: calculateSubtotal(),
                total: calculateTotal(),
                amount_due: Math.max(0, calculateTotal() - (order.amountPaid || 0)),
            } as any);

            toast({ title: "Order updated", description: "Changes saved successfully." });
            router.push(`/orders/${order.id}`);
        } catch (err) {
            toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading order...</div>;
    if (!order) return <div className="p-8 text-center">Order not found.</div>;

    return (
        <>
            <SEO title={`Edit Order #${order.orderNumber}`} />
            <div className="container mx-auto p-6 max-w-4xl space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Order #{order.orderNumber}</h1>
                        <p className="text-muted-foreground text-sm">{customer?.name || order.customerName}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Link href={`/orders/${order.id}`}><Button variant="outline">Cancel</Button></Link>
                        <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                            <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {/* Status & Delivery */}
                <Card>
                    <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Delivery Date</Label>
                            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>Notes</Label>
                            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Order notes..." />
                        </div>
                    </CardContent>
                </Card>

                {/* Items */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Order Items</CardTitle>
                        <Button size="sm" onClick={addItem} className="gap-1">
                            <Plus className="w-3 h-3" />Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.map((item, index) => {
                            const basePrice = item.pricePerLb * item.quantity;
                            const finalPrice = item.finalPrice ?? item.totalPrice;
                            return (
                                <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                                    <div className="flex gap-3 items-start">
                                        <div className="flex-1 grid grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-xs">Product</Label>
                                                <Select value={item.productId} onValueChange={(v) => updateItem(index, "productId", v)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {products.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">{(item as any).unit === "half_lb" ? "Qty (half-lbs)" : "Qty (lbs)"}</Label>
                                                <Input type="number" step="1" min="0" value={item.quantity || ""} onChange={(e) => updateItem(index, "quantity", e.target.value)} />
                                                {(item as any).unit === "half_lb" && item.quantity > 0 && (
                                                    <p className="text-xs text-amber-700 mt-1">= {(item.quantity * 0.5).toFixed(1)} lbs</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label className="text-xs">Price</Label>
                                                <Input value={`$${basePrice.toFixed(2)}`} disabled className="bg-white" />
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="mt-5">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 border-t border-amber-300 pt-3">
                                        <RadioGroup value={item.discountType || "fixed"} onValueChange={(v) => updateItem(index, "discountType", v)} className="flex gap-3 col-span-1">
                                            <div className="flex items-center gap-1"><RadioGroupItem value="fixed" id={`f-${index}`} /><Label htmlFor={`f-${index}`} className="text-xs">$ Fixed</Label></div>
                                            <div className="flex items-center gap-1"><RadioGroupItem value="percent" id={`p-${index}`} /><Label htmlFor={`p-${index}`} className="text-xs">% Off</Label></div>
                                        </RadioGroup>
                                        <div>
                                            <Label className="text-xs">Item Discount</Label>
                                            <Input type="number" step="0.01" min="0" placeholder="0" value={item.discount || ""} onChange={(e) => updateItem(index, "discount", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Final Price</Label>
                                            <Input value={`$${finalPrice.toFixed(2)}`} disabled className="bg-white font-semibold" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                    <CardHeader><CardTitle>Order Discount & Total</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <RadioGroup value={orderDiscountType} onValueChange={(v: any) => setOrderDiscountType(v)} className="flex gap-4 col-span-1 items-end pb-2">
                                <div className="flex items-center gap-1"><RadioGroupItem value="fixed" id="od-fixed" /><Label htmlFor="od-fixed" className="text-xs">$ Fixed</Label></div>
                                <div className="flex items-center gap-1"><RadioGroupItem value="percent" id="od-pct" /><Label htmlFor="od-pct" className="text-xs">% Off</Label></div>
                            </RadioGroup>
                            <div>
                                <Label className="text-xs">Order Discount</Label>
                                <Input type="number" step="0.01" min="0" placeholder="0" value={orderDiscount} onChange={(e) => setOrderDiscount(e.target.value)} />
                            </div>
                            <div className="text-right space-y-1 pt-2">
                                <div className="text-sm text-gray-500">Subtotal: ${calculateSubtotal().toFixed(2)}</div>
                                {calculateDiscount() > 0 && <div className="text-sm text-red-600">Discount: -${calculateDiscount().toFixed(2)}</div>}
                                <div className="text-xl font-bold text-amber-700">Total: ${calculateTotal().toFixed(2)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
