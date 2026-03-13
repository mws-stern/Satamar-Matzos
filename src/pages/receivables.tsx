import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, Search, CreditCard, Banknote, Building2, Receipt } from "lucide-react";
import Link from "next/link";
import { supabaseService } from "@/services/supabaseService";
import type { Payment, Invoice, Order } from "@/types";

export default function ReceivablesPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState < any > (null);
    const [payments, setPayments] = useState < Payment[] > ([]);
    const [invoices, setInvoices] = useState < Invoice[] > ([]);
    const [orders, setOrders] = useState < Order[] > ([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState < "all" | "paid" | "unpaid" > ("all");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [
                { data: paymentsData, error: paymentsError },
                { data: invoicesData, error: invoicesError },
                { data: ordersData, error: ordersError },
            ] = await Promise.all([
                supabaseService.getAllPayments(),
                supabaseService.getInvoices(),
                supabaseService.getOrders(),
            ]);

            if (paymentsError) {

                console.error("[ReceivablesPage][getAllPayments] error", paymentsError);
            }
            if (invoicesError) {

                console.error("[ReceivablesPage][getInvoices] error", invoicesError);
            }
            if (ordersError) {

                console.error("[ReceivablesPage][getOrders] error", ordersError);
            }

            const safePayments: Payment[] = ((paymentsData || []) as any[]).map((p: any) => ({
                ...p,
                orderId: p.order_id || "",
                invoiceId: p.invoice_id || "",
                paymentMethod: p.payment_method || "cash",
                paymentDate: p.payment_date || "",
                creditCardLast4: p.credit_card_last4 || "",
                confirmedAt: p.confirmed_at || "",
            }));
            const safeInvoices = (invoicesData || []) as Invoice[];
            const safeOrders: Order[] = ((ordersData || []) as any[]).map((o: any) => ({
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

            setPayments(safePayments);
            setInvoices(safeInvoices);
            setOrders(safeOrders);

            const totalReceivables = safeOrders.reduce((sum, order) => sum + (order.amountDue || 0), 0);
            const totalPaid = safeOrders.reduce((sum, order) => sum + (order.amountPaid || 0), 0);
            const totalOverdue = safeInvoices
                .filter((inv) => {
                    if (!inv.due_date || inv.paid) return false;
                    return new Date(inv.due_date) < new Date();
                })
                .reduce((sum, inv) => sum + (inv.amount_due || 0), 0);

            setSummary({
                totalReceivables,
                totalPaid,
                totalOverdue,
                unpaidInvoices: safeInvoices.filter((inv) => !inv.paid).length,
            });
        } catch (err) {

            console.error("[ReceivablesPage][loadData] thrown error", err);
            setPayments([]);
            setInvoices([]);
            setOrders([]);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter((payment) => {
        const matchesSearch = payment.orderId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case "credit_card":
                return <CreditCard className="h-4 w-4" />;
            case "cash":
                return <Banknote className="h-4 w-4" />;
            case "check":
                return <Receipt className="h-4 w-4" />;
            case "bank_transfer":
                return <Building2 className="h-4 w-4" />;
            default:
                return <DollarSign className="h-4 w-4" />;
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            credit_card: "Credit Card",
            cash: "Cash",
            check: "Check",
            bank_transfer: "Bank Transfer",
            e_transfer: "E-Transfer",
            voucher: "Voucher",
        };
        return labels[method] || method;
    };

    if (loading) {
        return (
            <>
                <SEO title="Receivables - Bakery Sales" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading receivables...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO title="Receivables - Bakery Sales" />
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-orange-500" />
                    <h1 className="text-3xl font-bold">Receivables</h1>
                </div>

                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-orange-600">
                                    ${summary.totalReceivables.toFixed(2)}
                                </div>
                                <p className="text-sm text-gray-600">Total Receivables</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-green-600">
                                    ${summary.totalPaid.toFixed(2)}
                                </div>
                                <p className="text-sm text-gray-600">Total Paid</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-red-600">
                                    ${summary.totalOverdue.toFixed(2)}
                                </div>
                                <p className="text-sm text-gray-600">Overdue</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-amber-600">
                                    {summary.unpaidInvoices}
                                </div>
                                <p className="text-sm text-gray-600">Unpaid Invoices</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Payments</CardTitle>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search payments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-64"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredPayments.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No payments found</p>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-orange-100 rounded-lg">
                                                {getPaymentMethodIcon(payment.paymentMethod)}
                                            </div>
                                            <div>
                                                <Link
                                                    href={`/orders/${payment.orderId}`}
                                                    className="font-semibold hover:text-orange-600"
                                                >
                                                    Order #{payment.orderId.slice(0, 8)}
                                                </Link>
                                                <p className="text-sm text-gray-600">
                                                    {getPaymentMethodLabel(payment.paymentMethod)}
                                                    {payment.creditCardLast4 && ` •••• ${payment.creditCardLast4}`}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">
                                                ${payment.amount.toFixed(2)}
                                            </p>
                                            {payment.confirmed ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Confirmed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Unpaid Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Invoice #</th>
                                        <th className="text-left py-3 px-4">Customer</th>
                                        <th className="text-left py-3 px-4">Due Date</th>
                                        <th className="text-right py-3 px-4">Amount Due</th>
                                        <th className="text-left py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices
                                        .filter((inv) => !inv.paid)
                                        .map((invoice) => {
                                            const isOverdue =
                                                invoice.due_date && new Date(invoice.due_date) < new Date();
                                            return (
                                                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <Link
                                                            href={`/invoices/${invoice.id}`}
                                                            className="text-orange-600 hover:underline font-semibold"
                                                        >
                                                            {invoice.invoice_number}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 px-4">{invoice.customer_name}</td>
                                                    <td className="py-3 px-4">
                                                        {invoice.due_date
                                                            ? new Date(invoice.due_date).toLocaleDateString()
                                                            : "N/A"}
                                                    </td>
                                                    <td className="text-right py-3 px-4 font-semibold">
                                                        ${(invoice.amount_due || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                isOverdue
                                                                    ? "bg-red-50 text-red-700 border-red-200"
                                                                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                            }
                                                        >
                                                            {isOverdue ? "Overdue" : "Pending"}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}