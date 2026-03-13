import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Save, X, Trash2, AlertTriangle } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
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
import type { Product } from "@/types";

export default function ProductsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState < Product[] > ([]);
    const [editingId, setEditingId] = useState < string | null > (null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editForm, setEditForm] = useState < Partial < Product >> ({});
    const [newProduct, setNewProduct] = useState < Partial < Product >> ({
        name: "",
        nameHebrew: "",
        pricePerLb: 0,
        category: "regular",
        description: "",
        inStock: true,
        currentInventory: 0,
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data: result, error } = await supabaseService.getProducts();
            if (error) {
                console.error("[ProductsPage][getProducts] error", error);
                setProducts([]);
            } else {
                setProducts(((result || []) as any[]).map((p: any) => ({
                    ...p,
                    nameHebrew: p.name_hebrew || "",
                    pricePerLb: Number(p.price_per_lb || 0),
                    sellByHalfLb: Boolean(p.sell_by_half_lb),
                    pricePerHalfLb: p.price_per_half_lb ? Number(p.price_per_half_lb) : undefined,
                    inStock: Boolean(p.in_stock),
                    currentInventory: Number(p.current_inventory || 0),
                })) as Product[]);
            }
        } catch (err) {
            console.error("[ProductsPage][getProducts] error", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setEditForm(product);
    };

    const handleSave = async (id: string) => {
        const productToUpdate = products.find((p) => p.id === id);
        if (!productToUpdate) return;

        const updated = { ...productToUpdate, ...editForm };
        await supabaseService.updateProduct(id, {
            name: updated.name,
            name_hebrew: updated.nameHebrew,
            price_per_lb: updated.pricePerLb,
            sell_by_half_lb: updated.sellByHalfLb ?? false,
            price_per_half_lb: updated.pricePerHalfLb ?? null,
            category: updated.category,
            description: updated.description,
            in_stock: updated.inStock,
            current_inventory: updated.currentInventory,
        });

        await loadProducts();
        setEditingId(null);
        setEditForm({});

        toast({
            title: "Product updated",
            description: "Product has been updated successfully.",
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleDelete = async (id: string) => {
        await supabaseService.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        toast({ title: "Product deleted", description: "Product removed successfully." });
    };

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.category) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        await supabaseService.addProduct({
            name: newProduct.name!,
            name_hebrew: newProduct.nameHebrew,
            price_per_lb: newProduct.pricePerLb ?? 0,
            sell_by_half_lb: newProduct.sellByHalfLb ?? false,
            price_per_half_lb: newProduct.pricePerHalfLb ?? null,
            category: newProduct.category ?? "regular",
            description: newProduct.description,
            in_stock: newProduct.inStock ?? true,
            current_inventory: newProduct.currentInventory ?? 0,
        });
        await loadProducts();

        setShowAddForm(false);
        setNewProduct({
            name: "",
            nameHebrew: "",
            pricePerLb: 0,
            category: "regular",
            description: "",
            inStock: true,
            currentInventory: 0,
        });

        toast({
            title: "Product added",
            description: "New product has been added successfully.",
        });
    };

    const getCategoryBadge = (category: string) => {
        const variants: Record<string, string> = {
            rashi: "bg-purple-100 text-purple-800 border-purple-300",
            regular: "bg-blue-100 text-blue-800 border-blue-300",
            spelt: "bg-green-100 text-green-800 border-green-300",
            wholewheat: "bg-amber-100 text-amber-800 border-amber-300",
            flour: "bg-orange-100 text-orange-800 border-orange-300",
            shvurim: "bg-red-100 text-red-800 border-red-300",
        };

        return (
            <Badge variant="outline" className={variants[category] || variants.regular}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
        );
    };

    if (loading) {
        return (
            <>
                <SEO title="Products - Bakery Sales" />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading products...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO title="Products - Bakery Sales" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-orange-500" />
                        <h1 className="text-3xl font-bold">Products</h1>
                    </div>
                    <Button onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                </div>

                {showAddForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Product</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={newProduct.name}
                                        onChange={(e) =>
                                            setNewProduct({ ...newProduct, name: e.target.value })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="nameHebrew">Name (Hebrew)</Label>
                                    <Input
                                        id="nameHebrew"
                                        value={newProduct.nameHebrew}
                                        onChange={(e) =>
                                            setNewProduct({ ...newProduct, nameHebrew: e.target.value })
                                        }
                                        dir="rtl"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="pricePerLb">Price per Lb ($)</Label>
                                    <Input
                                        id="pricePerLb"
                                        type="number"
                                        step="0.01"
                                        value={newProduct.pricePerLb}
                                        onChange={(e) =>
                                            setNewProduct({
                                                ...newProduct,
                                                pricePerLb: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between py-2 border rounded-lg px-3">
                                    <div>
                                        <Label className="font-medium">Also sell by half-lb?</Label>
                                        <p className="text-xs text-muted-foreground">e.g. flour at $27/half-lb</p>
                                    </div>
                                    <Switch
                                        checked={newProduct.sellByHalfLb ?? false}
                                        onCheckedChange={(v) => setNewProduct({ ...newProduct, sellByHalfLb: v })}
                                    />
                                </div>

                                {newProduct.sellByHalfLb && (
                                    <div>
                                        <Label htmlFor="pricePerHalfLb">Price per Half-Lb ($)</Label>
                                        <Input
                                            id="pricePerHalfLb"
                                            type="number"
                                            step="0.01"
                                            placeholder="27.00"
                                            value={newProduct.pricePerHalfLb ?? ""}
                                            onChange={(e) =>
                                                setNewProduct({
                                                    ...newProduct,
                                                    pricePerHalfLb: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                        />
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        value={newProduct.category}
                                        onChange={(e) =>
                                            setNewProduct({
                                                ...newProduct,
                                                category: e.target.value as Product["category"],
                                            })
                                        }
                                        className="w-full h-10 px-3 rounded-md border border-gray-300"
                                    >
                                        <option value="rashi">Rashi</option>
                                        <option value="regular">Regular</option>
                                        <option value="spelt">Spelt</option>
                                        <option value="wholewheat">Whole Wheat</option>
                                        <option value="flour">Flour</option>
                                        <option value="shvurim">Shvurim</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={newProduct.description}
                                        onChange={(e) =>
                                            setNewProduct({ ...newProduct, description: e.target.value })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="currentInventory">Current Inventory (lbs)</Label>
                                    <Input
                                        id="currentInventory"
                                        type="number"
                                        step="0.01"
                                        value={newProduct.currentInventory}
                                        onChange={(e) =>
                                            setNewProduct({
                                                ...newProduct,
                                                currentInventory: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="inStock"
                                        checked={newProduct.inStock}
                                        onCheckedChange={(checked) =>
                                            setNewProduct({ ...newProduct, inStock: checked })
                                        }
                                    />
                                    <Label htmlFor="inStock">In Stock</Label>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddProduct}>Add Product</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => {
                        const isEditing = editingId === product.id;
                        const currentData = isEditing ? { ...product, ...editForm } : product;

                        return (
                            <Card key={product.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <Input
                                                    value={currentData.name}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, name: e.target.value })
                                                    }
                                                    className="mb-2"
                                                />
                                            ) : (
                                                <CardTitle>{product.name}</CardTitle>
                                            )}
                                            {isEditing ? (
                                                <Input
                                                    value={currentData.nameHebrew}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, nameHebrew: e.target.value })
                                                    }
                                                    dir="rtl"
                                                    className="text-sm"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-600" dir="rtl">
                                                    {product.nameHebrew}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {isEditing ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleSave(product.id)}
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleCancel}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete <strong>{product.name}</strong>? This cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(product.id)}>
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        {getCategoryBadge(currentData.category)}
                                        <Badge
                                            variant="outline"
                                            className={
                                                currentData.inStock
                                                    ? "bg-green-100 text-green-800 border-green-300"
                                                    : "bg-red-100 text-red-800 border-red-300"
                                            }
                                        >
                                            {currentData.inStock ? "In Stock" : "Out of Stock"}
                                        </Badge>
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <div>
                                                <Label className="text-xs">Price per Lb ($)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={currentData.pricePerLb}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            pricePerLb: parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between py-1">
                                                <Label className="text-xs">Also sell by half-lb?</Label>
                                                <Switch
                                                    checked={editForm.sellByHalfLb ?? currentData.sellByHalfLb ?? false}
                                                    onCheckedChange={(v) => setEditForm({ ...editForm, sellByHalfLb: v })}
                                                />
                                            </div>
                                            {(editForm.sellByHalfLb ?? currentData.sellByHalfLb) && (
                                                <div>
                                                    <Label className="text-xs">Price per Half-Lb ($)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="27.00"
                                                        value={editForm.pricePerHalfLb ?? currentData.pricePerHalfLb ?? ""}
                                                        onChange={(e) => setEditForm({ ...editForm, pricePerHalfLb: parseFloat(e.target.value) || 0 })}
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <Label className="text-xs">Current Inventory (lbs)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={currentData.currentInventory}
                                                    onChange={(e) =>
                                                        setEditForm({
                                                            ...editForm,
                                                            currentInventory: parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Description</Label>
                                                <Textarea
                                                    value={currentData.description}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, description: e.target.value })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-2xl font-bold text-orange-600">
                                                ${product.pricePerLb.toFixed(2)}
                                                <span className="text-sm text-gray-600 font-normal">/lb</span>
                                            </div>
                                            {product.sellByHalfLb && product.pricePerHalfLb && (
                                                <div className="text-sm font-semibold text-amber-700">
                                                    ${product.pricePerHalfLb.toFixed(2)}<span className="font-normal text-gray-600">/half-lb</span>
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-600">
                                                <span className="font-semibold">Stock:</span>{" "}
                                                {product.currentInventory || 0} lbs
                                            </div>
                                            {product.description && (
                                                <p className="text-sm text-gray-600">{product.description}</p>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </>
    );
}