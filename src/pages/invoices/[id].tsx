import { SEO } from "@/components/SEO";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabaseService } from "@/services/supabaseService";
import { emailService } from "@/services/emailService";
import type { Invoice, Settings } from "@/types";

type InvoiceItem = {
    productName: string;
    productNameHebrew?: string;
    quantity: number;
    pricePerLb: number;
    finalPrice: number;
};

type UiInvoice = any;

export default function InvoiceDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState < UiInvoice | null > (null);
    const [settings, setSettings] = useState < Settings | null > (null);
    const [sending, setSending] = useState(false);
    const printRef = useRef < HTMLDivElement > (null);

    useEffect(() => {
        if (id && typeof id === "string") {
            loadInvoice(id);
            loadSettings();
        }
    }, [id]);

    const loadInvoice = async (invoiceId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabaseService.getInvoice(invoiceId);
            if (error || !data) {

                console.error("[InvoiceDetailPage][getInvoice] error", error);
                setInvoice(null);
                setLoading(false);
                return;
            }

            let parsedItems: InvoiceItem[] = [];
            try {
                const raw = data.items_json ? JSON.parse(data.items_json) : [];
                parsedItems = Array.isArray(raw)
                    ? raw.map((item: any) => ({
                        productName: item.productName,
                        productNameHebrew: item.productNameHebrew,
                        quantity: Number(item.quantity || 0),
                        pricePerLb: Number(item.pricePerLb || 0),
                        finalPrice: Number(item.finalPrice ?? item.totalPrice ?? 0),
                    }))
                    : [];
            } catch (parseError) {

                console.error("[InvoiceDetailPage][parse items_json] error", parseError);
                parsedItems = [];
            }

            setInvoice({
                ...data,
                items: parsedItems,
            });
        } catch (err) {

            console.error("[InvoiceDetailPage][getInvoice] thrown error", err);
            setInvoice(null);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const { data, error } = await supabaseService.getSettings();
            if (error || !data) {

                console.error("[InvoiceDetailPage][getSettings] error", error);
                setSettings(null);
                return;
            }
            const raw = data as any;
            setSettings({
                id: raw.id,
                companyName: raw.company_name || "",
                companyNameHebrew: raw.company_name_hebrew || "",
                email: raw.email || "",
                phone: raw.phone || "",
                address: raw.address || "",
                taxRate: Number(raw.tax_rate || 0),
                currency: raw.currency || "USD",
            } as Settings);
        } catch (err) {

            console.error("[InvoiceDetailPage][getSettings] thrown error", err);
            setSettings(null);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendEmail = async () => {
        if (!invoice) return;

        setSending(true);

        // Fetch order and customer to satisfy email service requirements
        const orderRes = await supabaseService.getOrder(invoice.order_id || invoice.orderId);
        const customerRes = await supabaseService.getCustomer(invoice.customer_id || invoice.customerId);

        const orderRaw = (orderRes as any).data || orderRes;
        const customer = (customerRes as any).data || customerRes;

        const order = orderRaw ? {
            ...orderRaw,
            orderNumber: orderRaw.order_number,
            customerId: orderRaw.customer_id,
            customerName: orderRaw.customer_name,
            customerEmail: orderRaw.customer_email,
            subtotal: Number(orderRaw.subtotal || 0),
            tax: Number(orderRaw.tax || 0),
            total: Number(orderRaw.total || 0),
            discount: Number(orderRaw.discount || 0),
            discountType: orderRaw.discount_type ?? "fixed",
            paymentStatus: orderRaw.payment_status ?? "unpaid",
            amountPaid: Number(orderRaw.amount_paid || 0),
            amountDue: Number(orderRaw.amount_due || 0),
            deliveryDate: orderRaw.delivery_date,
            createdAt: orderRaw.created_at,
            items: orderRaw.items || [],
        } : null;

        if (!order || !customer) {
            toast({
                title: "Failed to send invoice",
                description: "Could not find related order or customer details.",
                variant: "destructive",
            });
            setSending(false);
            return;
        }

        const result = await emailService.sendInvoice(order, customer);

        if (result.success) {
            toast({
                title: "Invoice sent",
                description: `Invoice has been sent to ${invoice.customer_email || invoice.customerEmail}`,
            });
        } else {
            toast({
                title: "Failed to send invoice",
                description: "Please check the email configuration and try again.",
                variant: "destructive",
            });
        }
        setSending(false);
    };

    const getPaymentBadge = (status: string) => {
        const variants: Record<string, string> = {
            unpaid: "bg-red-100 text-red-800 border-red-300",
            partial: "bg-yellow-100 text-yellow-800 border-yellow-300",
            paid: "bg-green-100 text-green-800 border-green-300",
        };

        return (
            <Badge variant="outline" className={variants[status] || variants.unpaid}>
                {status === "paid" && <CheckCircle className="h-3 w-3 mr-1" />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    if (loading) {
        return (
            <>
                <SEO title="Invoice Details - Bakery Sales" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading invoice...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!invoice) {
        return (
            <>
                <SEO title="Invoice Not Found - Bakery Sales" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-xl text-gray-600 mb-4">Invoice not found</p>
                        <Link href="/orders">
                            <Button>Back to Orders</Button>
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO title={`Invoice ${invoice.invoice_number} - Bakery Sales`} />
            <div className="space-y-6">
                <div className="flex items-center justify-between print:hidden">
                    <Link href="/orders">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                        {invoice.customer_email && (
                            <Button onClick={handleSendEmail} disabled={sending}>
                                <Mail className="h-4 w-4 mr-2" />
                                {sending ? "Sending..." : "Send Email"}
                            </Button>
                        )}
                    </div>
                </div>

                <div ref={printRef} className="bg-white p-8 rounded-lg border">
                    <div className="mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{settings?.companyName || "Satmar Montreal Matzos"}</h1>
                                <p className="text-xl mb-2" dir="rtl">
                                    {settings?.companyNameHebrew || "סאטמאר מאנטרעאל מצות"}
                                </p>
                                <p className="text-gray-600">{settings?.address}</p>
                                <p className="text-gray-600">{settings?.phone}</p>
                                <p className="text-gray-600">{settings?.email}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
                                <p className="text-gray-600">Invoice #: {invoice.invoice_number}</p>
                                <p className="text-gray-600">
                                    Date: {new Date(invoice.created_at).toLocaleDateString()}
                                </p>
                                {invoice.due_date && (
                                    <p className="text-gray-600">
                                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="font-semibold mb-2">Bill To:</h3>
                                <p className="font-medium">{invoice.customer_name}</p>
                                {invoice.customer_email && (
                                    <p className="text-gray-600">{invoice.customer_email}</p>
                                )}
                            </div>
                            <div className="text-right">
                                {getPaymentBadge(invoice.payment_status)}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold">Quantity</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold">Price/lb</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoice.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                {item.productNameHebrew && (
                                                    <p className="text-sm text-gray-600" dir="rtl">
                                                        {item.productNameHebrew}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">{item.quantity} lbs</td>
                                        <td className="px-4 py-3 text-right">${item.pricePerLb.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            ${item.finalPrice.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax ({((settings?.taxRate || 0) * 100).toFixed(3)}%):</span>
                                <span className="font-medium">${invoice.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                                <span className="font-bold">Total:</span>
                                <span className="font-bold text-lg">${invoice.total.toFixed(2)}</span>
                            </div>
                            {invoice.payment_status !== "paid" && (
                                <>
                                    <div className="flex justify-between text-green-600">
                                        <span>Paid:</span>
                                        <span className="font-medium">${invoice.amount_paid.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-orange-600 pt-2 border-t">
                                        <span className="font-bold">Balance Due:</span>
                                        <span className="font-bold text-lg">${invoice.amount_due.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}