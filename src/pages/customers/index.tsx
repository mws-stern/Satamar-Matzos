import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Phone, Mail, MapPin, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Customer } from "@/types";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("customers")
                .select("*")
                .order("name", { ascending: true });
            if (error) {
                console.error("[customers] load error:", error);
                // Try without ordering as fallback
                const fallback = await supabase.from("customers").select("*");
                if (!fallback.error && fallback.data) {
                    setCustomers(((fallback.data || []) as any[]).map((c: any) => ({
                        ...c,
                        name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
                        nameHebrew: c.name_hebrew || `${c.first_name_hebrew || ""} ${c.last_name_hebrew || ""}`.trim(),
                        titleHebrew: c.title_hebrew || "",
                        titleEnglish: c.title_english || "",
                    })) as Customer[]);
                }
            } else {
                setCustomers(((data || []) as any[]).map((c: any) => ({
                    ...c,
                    name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
                    nameHebrew: c.name_hebrew || `${c.first_name_hebrew || ""} ${c.last_name_hebrew || ""}`.trim(),
                    titleHebrew: c.title_hebrew || "",
                    titleEnglish: c.title_english || "",
                })) as Customer[]);
            }
        } catch (err) {
            console.error("[customers] thrown error:", err);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCustomers(); }, []);

    const handleDelete = async (e: React.MouseEvent, customerId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this customer?")) return;
        setDeletingId(customerId);
        const { error } = await supabase.from("customers").delete().eq("id", customerId);
        if (error) {
            alert("Failed to delete: " + error.message);
        } else {
            setCustomers(prev => prev.filter(c => c.id !== customerId));
        }
        setDeletingId(null);
    };

    const filteredCustomers = customers.filter((customer) => {
        const query = searchQuery.toLowerCase();
        return (
            (customer.name || "").toLowerCase().includes(query) ||
            (customer.nameHebrew && customer.nameHebrew.includes(query)) ||
            (customer.email && customer.email.toLowerCase().includes(query)) ||
            (customer.phone && customer.phone.includes(query)) ||
            (customer.mobile && customer.mobile.includes(query))
        );
    });

    return (
        <>
            <SEO title="Customers - Satmar Montreal Matzos" />
            <div className="container mx-auto px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                            <p className="text-gray-600">{customers.length} customers in database</p>
                        </div>
                    </div>
                    <Link href="/customers/new">
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-4 h-4" />Add Customer
                        </Button>
                    </Link>
                </div>

                <Card className="mb-6 border-0 shadow-sm ring-1 ring-gray-200/50">
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search customers by name, phone, or email..."
                                className="pl-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
                        <p>Loading customers from database...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCustomers.map((customer) => (
                                <div key={customer.id} className="relative group">
                                    <Link href={`/customers/${customer.id}`}>
                                        <Card className="hover:shadow-lg transition-all cursor-pointer h-full border-gray-200">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="flex items-start justify-between">
                                                    <div className="w-full">
                                                        <div className="text-lg font-bold hover:text-blue-600 transition-colors">
                                                            {customer.titleEnglish && <span className="text-gray-500 font-normal mr-1">{customer.titleEnglish}</span>}
                                                            {customer.name}
                                                        </div>
                                                        {customer.nameHebrew && (
                                                            <div className="text-sm text-gray-500 mt-1" dir="rtl">{customer.nameHebrew}</div>
                                                        )}
                                                    </div>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2.5 text-sm text-gray-600">
                                                    {customer.email && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                                <Mail className="w-3.5 h-3.5 text-blue-600" />
                                                            </div>
                                                            <span className="truncate">{customer.email}</span>
                                                        </div>
                                                    )}
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                                                <Phone className="w-3.5 h-3.5 text-green-600" />
                                                            </div>
                                                            <span>{customer.phone}</span>
                                                        </div>
                                                    )}
                                                    {customer.mobile && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                                                                <Phone className="w-3.5 h-3.5 text-purple-600" />
                                                            </div>
                                                            <span>{customer.mobile} <span className="text-xs text-gray-400">(Mobile)</span></span>
                                                        </div>
                                                    )}
                                                    {(customer.address || customer.city) && (
                                                        <div className="flex items-start gap-3 pt-1">
                                                            <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                                                                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                                                            </div>
                                                            <span className="line-clamp-2">
                                                                {customer.address}{customer.city && `, ${customer.city}`}{customer.state && `, ${customer.state}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                    <button
                                        onClick={(e) => handleDelete(e, customer.id)}
                                        disabled={deletingId === customer.id}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1.5 z-10"
                                        title="Delete customer"
                                    >
                                        {deletingId === customer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {filteredCustomers.length === 0 && (
                            <Card className="border-dashed border-2">
                                <CardContent className="py-16 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No customers found</h3>
                                    <p className="text-gray-500 mb-6">
                                        {searchQuery ? `No results match "${searchQuery}"` : "No customers yet."}
                                    </p>
                                    {!searchQuery && (
                                        <Link href="/customers/new">
                                            <Button className="bg-blue-600 hover:bg-blue-700">
                                                <Plus className="w-4 h-4 mr-2" />Add Your First Customer
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
