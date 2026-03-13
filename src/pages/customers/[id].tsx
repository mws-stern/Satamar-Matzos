import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Save, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/services/supabaseService";
import type { Customer, Order } from "@/types";
import { format } from "date-fns";

export default function CustomerDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { toast } = useToast();

    const [customer, setCustomer] = useState < Customer | null > (null);
    const [orders, setOrders] = useState < Order[] > ([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedCustomer, setEditedCustomer] = useState < Customer | null > (null);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState("");

    useEffect(() => {
        if (id && typeof id === "string") {
            loadCustomerData(id);
        }
    }, [id]);

    const loadCustomerData = async (customerId: string) => {
        setLoading(true);
        try {
            const { data: customerData, error: customerError } = await supabaseService.getCustomer(customerId);
            if (customerError || !customerData) {
                console.error("[CustomerDetail] getCustomer error", customerError);
                setCustomer(null);
                setLoading(false);
                return;
            }
            const { data: ordersDataRaw } = await supabaseService.getOrders();
            const ordersRaw = (ordersDataRaw || []) as any[];

            const allOrders = ordersRaw;

            if (customerData) {
                const mappedCustomer: Customer = { ...(customerData as any), nameHebrew: (customerData as any).name_hebrew || "", titleHebrew: (customerData as any).title_hebrew || "", titleEnglish: (customerData as any).title_english || "" };
                setCustomer(mappedCustomer);
                // DB rows use customer_id (snake_case); map to our Order type's customerId
                const customerOrders = allOrders
                    .filter((o: any) => (o.customer_id || o.customerId) === customerId)
                    .map((o: any) => ({
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
                    })) as Order[];
                setOrders(customerOrders);
            } else {
                setCustomer(null);
                setOrders([]);
            }
        } catch (error) {
            console.error("[CustomerDetail][loadCustomerData] error", error);
            setCustomer(null);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!customer) return;

        setSaving(true);
        await supabaseService.updateCustomer(customer.id, {
            name: customer.name,
            name_hebrew: customer.nameHebrew,
            email: customer.email,
            phone: customer.phone,
            mobile: customer.mobile,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
            notes: customer.notes,
        });
        setSaving(false);
        setIsEditing(false);

        toast({
            title: "Customer Updated",
            description: "Customer information has been saved successfully",
        });
    };

    async function handleSaveEmail() {
        if (!customer || !tempEmail.includes("@")) {
            alert("Please enter a valid email address");
            return;
        }

        await supabaseService.updateCustomer(customer.id, { email: tempEmail });

        setCustomer({ ...customer, email: tempEmail });
        setIsEditingEmail(false);
        toast({
            title: "Email Updated",
            description: "Email has been saved successfully"
        });
    }

    const handleChange = (field: keyof Customer, value: string) => {
        if (!customer) return;
        setCustomer({ ...customer, [field]: value });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading customer...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="container mx-auto px-6 py-8">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-500">Customer not found</p>
                        <Link href="/customers">
                            <Button className="mt-4">Back to Customers</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const paidOrders = orders.filter(o => o.paymentStatus === "paid").length;

    return (
        <>
            <SEO title={`${customer.name} - Customer Details`} />

            <div className="container mx-auto px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/customers">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
                            {customer.nameHebrew && (
                                <p className="text-gray-600 font-hebrew" dir="rtl">{customer.nameHebrew}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>Edit Customer</Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{orders.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-600">Paid Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{paidOrders}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={customer.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Hebrew Name</Label>
                                <Input
                                    value={customer.nameHebrew || ""}
                                    onChange={(e) => handleChange("nameHebrew", e.target.value)}
                                    disabled={!isEditing}
                                    dir="rtl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={customer.email || ""}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={customer.phone || ""}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Mobile</Label>
                                <Input
                                    value={customer.mobile || ""}
                                    onChange={(e) => handleChange("mobile", e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                                value={customer.address || ""}
                                onChange={(e) => handleChange("address", e.target.value)}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input
                                    value={customer.city || ""}
                                    onChange={(e) => handleChange("city", e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>State/Province</Label>
                                <Input
                                    value={customer.state || ""}
                                    onChange={(e) => handleChange("state", e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>ZIP/Postal Code</Label>
                                <Input
                                    value={customer.zip || ""}
                                    onChange={(e) => handleChange("zip", e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={customer.notes || ""}
                                onChange={(e) => handleChange("notes", e.target.value)}
                                disabled={!isEditing}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Order History</CardTitle>
                        <CardDescription>{orders.length} total orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {orders.length === 0 ? (
                            <p className="text-center py-8 text-gray-500">No orders yet</p>
                        ) : (
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <Link key={order.id} href={`/orders/${order.id}`}>
                                        <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-semibold">{order.orderNumber}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-lg">${order.total.toFixed(2)}</div>
                                                    <Badge variant="outline" className="mt-1">
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
                                                    {order.paymentStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}