import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import type { Product, InventoryEntry } from "@/types";

export default function InventoryPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState < Product[] > ([]);
    const [inventory, setInventory] = useState < InventoryEntry[] > ([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEntry, setNewEntry] = useState({
        productId: "",
        productName: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [productsResult, inventoryResult] = await Promise.all([
            supabaseService.getProducts(),
            supabaseService.getInventory(),
        ]);
        setProducts((((productsResult as any).data || productsResult || []) as any[]).map((p: any) => ({
            ...p,
            nameHebrew: p.name_hebrew || "",
            pricePerLb: Number(p.price_per_lb || 0),
            inStock: Boolean(p.in_stock),
            currentInventory: Number(p.current_inventory || 0),
        })) as Product[]);
        setInventory(((inventoryResult as any).data || inventoryResult || []) as InventoryEntry[]);
        setLoading(false);
    };

    const handleAddEntry = async () => {
        if (!newEntry.productId || newEntry.amount === 0) {
            toast({
                title: "Error",
                description: "Please select a product and enter an amount",
                variant: "destructive",
            });
            return;
        }

        const product = products.find((p) => p.id === newEntry.productId);
        if (!product) return;

        const response: any = await supabaseService.addInventoryEntry({
            product_id: newEntry.productId,
            product_name: product.name,
            amount: newEntry.amount,
            date: newEntry.date,
            notes: newEntry.notes,
        });
        const entry = response?.data || response;
        const error = response?.error;

        if (!error && entry) {
            toast({
                title: "Success",
                description: "Inventory entry added successfully",
            });

            // Reload data to get updated inventory
            await loadData();

            setShowAddForm(false);
            setNewEntry({
                productId: "",
                productName: "",
                amount: 0,
                date: new Date().toISOString().split("T")[0],
                notes: "",
            });
        }
    };

    if (loading) {
        return (
            <>
                <SEO title="Inventory - Bakery Sales" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading inventory...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO title="Inventory - Bakery Sales" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-orange-500" />
                        <h1 className="text-3xl font-bold">Inventory Management</h1>
                    </div>
                    <Button onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                    </Button>
                </div>

                {showAddForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Inventory Entry</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="product">Product</Label>
                                    <Select
                                        value={newEntry.productId}
                                        onValueChange={(value) => setNewEntry({ ...newEntry, productId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="amount">Amount (lbs)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={newEntry.amount}
                                        onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={newEntry.date}
                                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Input
                                        id="notes"
                                        value={newEntry.notes}
                                        onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddEntry}>Add Entry</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Current Stock Levels</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div>
                                        <h3 className="font-semibold">{product.name}</h3>
                                        <p className="text-sm text-gray-600">{product.nameHebrew}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-orange-600">
                                            {product.currentInventory || 0} lbs
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {product.inStock ? "In Stock" : "Out of Stock"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Inventory Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Date</th>
                                        <th className="text-left py-3 px-4">Product</th>
                                        <th className="text-right py-3 px-4">Amount</th>
                                        <th className="text-left py-3 px-4">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((entry) => (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">{entry.productName}</td>
                                            <td className="text-right py-3 px-4 font-semibold">
                                                {entry.amount > 0 ? "+" : ""}
                                                {entry.amount} lbs
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{entry.notes}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}