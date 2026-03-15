import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Plus, Trash2, Send, Save, Copy, Zap, Check, ChevronsUpDown, Search, UserPlus, Calendar, FileText, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/emailService";
import type { Product, Customer, OrderItem, Order } from "@/types";

export async function getServerSideProps() {
                return {
                                props: {
                                                initialCustomers: [],
                                                initialProducts: [],
                                                initialOrders: [],
                                                initialSettings: {
                                                                companyName: "Satmar Montreal Matzos",
                                                                companyNameHebrew: "מצות סאטמאר מאנטרעאל",
                                                                email: "sales@satmarmatzosmtl.ca",
                                                                phone: "(514) 000-0000",
                                                                address: "Montreal, QC, Canada",
                                                                taxRate: 0,
                                                                currency: "CAD",
                                                },
                                },
                };
}

export default function NewOrderPage({
                initialProducts,
                initialCustomers,
                initialOrders,
                initialSettings,
}: {
                initialProducts: Product[],
                initialCustomers: Customer[],
                initialOrders: Order[],
                initialSettings?: { taxRate?: number } | null,
}) {
                const router = useRouter();
                const { toast } = useToast();
                const [mounted, setMounted] = useState(false);
                const [products, setProducts] = useState < Product[] > (initialProducts || []);
                const [customers, setCustomers] = useState < Customer[] > (initialCustomers || []);
                const [allOrders, setAllOrders] = useState < Order[] > (initialOrders || []);
                const [selectedCustomerId, setSelectedCustomerId] = useState("");
                const [openCombobox, setOpenCombobox] = useState(false);
                const [items, setItems] = useState < OrderItem[] > ([]);
                const [notes, setNotes] = useState("");
                const [deliveryDate, setDeliveryDate] = useState("");
                const [orderDiscount, setOrderDiscount] = useState("");
                const [orderDiscountType, setOrderDiscountType] = useState < "percent" | "fixed" > ("percent");
                const [customerOrders, setCustomerOrders] = useState < Order[] > ([]);
                const [isLoading, setIsLoading] = useState(false);
                const [selectedCustomer, setSelectedCustomer] = useState < Customer | null > (null);
                const [requireEmail, setRequireEmail] = useState(false);
                const [tempEmail, setTempEmail] = useState("");
                const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
                const [newCustomer, setNewCustomer] = useState({
                                name: "",
                                phone: "",
                                email: "",
                                address: "",
                                balance: 0,
                });

                useEffect(() => {
                                setMounted(true);
                                // Load data client-side
                                const loadData = async () => {
                                                const { data: customersData } = await supabase.from("customers").select("*").order("name", { ascending: true });
                                                const { data: productsData } = await supabase.from("products").select("*");
                                                const { data: ordersData } = await supabase.from("orders").select("*");
                                                if (customersData) setCustomers((customersData as any[]).map((c: any) => ({
                                                                ...c,
                                                                name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
                                                                nameHebrew: c.name_hebrew || "",
                                                                titleHebrew: c.title_hebrew || "",
                                                                titleEnglish: c.title_english || "",
                                                })));
                                                if (productsData) setProducts((productsData as any[]).map((p: any) => ({
                                                                ...p,
                                                                nameHebrew: p.name_hebrew || "",
                                                                pricePerLb: Number(p.price_per_lb || 0),
                                                                sellByHalfLb: Boolean((p as any).sell_by_half_lb),
                                                                pricePerHalfLb: (p as any).price_per_half_lb ? Number((p as any).price_per_half_lb) : undefined,
                                                                inStock: Boolean(p.in_stock),
                                                                currentInventory: Number(p.current_inventory || 0),
                                                })));
                                                if (ordersData) setAllOrders((ordersData as any[]).map((o: any) => ({
                                                                ...o,
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
                                                                notes: o.notes || null,
                                                                deliveryDate: o.delivery_date || null,
                                                                orderTime: o.order_time,
                                                                inventoryDeducted: Boolean(o.inventory_deducted),
                                                                createdAt: o.created_at,
                                                                updatedAt: o.updated_at,
                                                })));
                                };
                                loadData();
                }, []);

                useEffect(() => {
                                if (selectedCustomerId) {
                                                const custOrders = allOrders.filter((o) => o.customerId === selectedCustomerId);
                                                setCustomerOrders(custOrders);

                                                const customer = customers.find((c) => c.id === selectedCustomerId) || null;
                                                setSelectedCustomer(customer);

                                                if (customer && (!customer.email || !customer.email.includes("@"))) {
                                                                setRequireEmail(true);
                                                                setTempEmail("");
                                                } else {
                                                                setRequireEmail(false);
                                                }
                                } else {
                                                setCustomerOrders([]);
                                                setSelectedCustomer(null);
                                                setRequireEmail(false);
                                }
                }, [selectedCustomerId, customers, allOrders]);

                const addItem = () => {
                                if (products.length === 0) return;
                                const p0 = products[0];
                                const unit0 = p0.sellByHalfLb ? "half_lb" : "lb";
                                const price0 = p0.sellByHalfLb ? (p0.pricePerHalfLb || p0.pricePerLb) : p0.pricePerLb;
                                setItems([...items, {
                                                id: crypto.randomUUID(),
                                                orderId: "",
                                                productId: p0.id,
                                                productName: p0.name,
                                                productNameHebrew: p0.nameHebrew,
                                                quantity: 0,
                                                unit: unit0,
                                                pricePerLb: price0,
                                                totalPrice: 0,
                                                discount: 0,
                                                discountType: "fixed",
                                                finalPrice: undefined,
                                }]);
                };

                const duplicateLastOrder = () => {
                                if (customerOrders.length === 0) return;

                                const lastOrder = customerOrders.sort((a, b) =>
                                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                )[0];

                                setItems(lastOrder.items.map(item => ({ ...item })));
                                setNotes(lastOrder.notes || "");
                                setDeliveryDate(lastOrder.deliveryDate || "");

                                toast({
                                                title: "Order Duplicated",
                                                description: `Loaded items from ${lastOrder.orderNumber}`,
                                });
                };

                const updateItem = (index: number, field: keyof OrderItem, value: any) => {
                                const newItems = [...items];
                                if (field === "productId") {
                                                const product = products.find(p => p.id === value);
                                                if (product) {
                                                                const unit = product.sellByHalfLb ? "half_lb" : "lb";
                                                                const effectivePrice = product.sellByHalfLb ? (product.pricePerHalfLb || product.pricePerLb) : product.pricePerLb;
                                                                newItems[index] = {
                                                                                ...newItems[index],
                                                                                productId: product.id,
                                                                                productName: product.name,
                                                                                productNameHebrew: product.nameHebrew,
                                                                                unit,
                                                                                pricePerLb: effectivePrice,
                                                                                totalPrice: effectivePrice * newItems[index].quantity,
                                                                };
                                                }
                                } else if (field === "quantity") {
                                                const qty = parseFloat(value) || 0;
                                                newItems[index].quantity = qty;
                                                const basePrice = newItems[index].pricePerLb * qty;

                                                if (newItems[index].discount && newItems[index].discountType) {
                                                                if (newItems[index].discountType === "percent") {
                                                                                newItems[index].finalPrice = basePrice * (1 - (newItems[index].discount! / 100));
                                                                } else {
                                                                                newItems[index].finalPrice = basePrice - newItems[index].discount!;
                                                                }
                                                } else {
                                                                newItems[index].totalPrice = basePrice;
                                                }
                                } else if (field === "discount") {
                                                const discountValue = parseFloat(value) || 0;
                                                newItems[index].discount = discountValue > 0 ? discountValue : undefined;
                                                const basePrice = newItems[index].pricePerLb * newItems[index].quantity;

                                                if (discountValue > 0) {
                                                                if (newItems[index].discountType === "percent") {
                                                                                newItems[index].finalPrice = basePrice * (1 - (discountValue / 100));
                                                                } else {
                                                                                newItems[index].finalPrice = basePrice - discountValue;
                                                                }
                                                } else {
                                                                newItems[index].finalPrice = undefined;
                                                                newItems[index].totalPrice = basePrice;
                                                }
                                } else if (field === "discountType") {
                                                newItems[index].discountType = value;
                                                const basePrice = newItems[index].pricePerLb * newItems[index].quantity;

                                                if (newItems[index].discount) {
                                                                if (value === "percent") {
                                                                                newItems[index].finalPrice = basePrice * (1 - (newItems[index].discount! / 100));
                                                                } else {
                                                                                newItems[index].finalPrice = basePrice - newItems[index].discount!;
                                                                }
                                                }
                                } else {
                                                (newItems[index] as any)[field] = value;
                                }
                                setItems(newItems);
                };

                const removeItem = (index: number) => {
                                setItems(items.filter((_, i) => i !== index));
                };

                const calculateSubtotal = () => {
                                return items.reduce((sum, item) => {
                                                return sum + (item.finalPrice ?? item.totalPrice);
                                }, 0);
                };

                const calculateDiscount = () => {
                                if (!orderDiscount || parseFloat(orderDiscount) <= 0) return 0;
                                const subtotal = calculateSubtotal();
                                if (orderDiscountType === "percent") {
                                                return subtotal * (parseFloat(orderDiscount) / 100);
                                }
                                return parseFloat(orderDiscount);
                };

                const calculateTotal = () => {
                                return calculateSubtotal() - calculateDiscount();
                };

                const getProductStock = (productId: string) => {
                                const product = products.find(p => p.id === productId);
                                return product?.currentInventory || 0;
                };

                const handleCreateCustomer = async () => {
                                if (!newCustomer.name || !newCustomer.phone) {
                                                alert("Please fill in at least name and phone");
                                                return;
                                }

                                try {
                                                setIsLoading(true);
                                                const customerToCreate = {
                                                                ...newCustomer,
                                                                balance: parseFloat(newCustomer.balance as any) || 0,
                                                };

                                                const { data: createdCustomer } = await supabaseService.addCustomer(customerToCreate);

                                                if (createdCustomer) {
                                                                // Close dialog and select the newly created customer
                                                                setIsCustomerDialogOpen(false);

                                                                // Add to local state so it appears in the list
                                                                const updatedCustomers = [...customers, createdCustomer];
                                                                // We can't directly update the customers state since it's missing a setter in the original code,
                                                                // but it will be selected and the order can proceed. Ideally we'd have a setCustomers.

                                                                setSelectedCustomerId(createdCustomer.id);
                                                                setSelectedCustomer(createdCustomer);

                                                                // Reset form
                                                                setNewCustomer({
                                                                                name: "",
                                                                                phone: "",
                                                                                email: "",
                                                                                address: "",
                                                                                balance: 0,
                                                                });

                                                                toast({
                                                                                title: "Customer Created",
                                                                                description: `${createdCustomer.name} has been created and selected.`,
                                                                });
                                                }
                                } catch (error) {
                                                console.error("Error creating customer:", error);
                                                toast({
                                                                title: "Error",
                                                                description: "Failed to create customer. Please try again.",
                                                                variant: "destructive",
                                                });
                                } finally {
                                                setIsLoading(false);
                                }
                };

                const handleSubmit = async (status: "draft" | "pending") => {
                                if (!selectedCustomerId) {
                                                toast({
                                                                title: "Error",
                                                                description: "Please select a customer",
                                                                variant: "destructive",
                                                });
                                                return;
                                }

                                const customer = customers.find(c => c.id === selectedCustomerId);
                                if (!customer) return;

                                if (requireEmail) {
                                                if (!tempEmail || !tempEmail.includes("@")) {
                                                                toast({
                                                                                title: "Email Required",
                                                                                description: "Please enter a valid email address.",
                                                                                variant: "destructive",
                                                                });
                                                                return;
                                                }
                                                const updatedCustomer = { ...customer, email: tempEmail };
                                                await supabaseService.updateCustomer(customer.id, { email: tempEmail });
                                                customer.email = tempEmail;
                                                setRequireEmail(false);
                                }

                                if (items.length === 0) {
                                                toast({
                                                                title: "Error",
                                                                description: "Please add at least one item",
                                                                variant: "destructive",
                                                });
                                                return;
                                }

                                setIsLoading(true);
                                const discount = parseFloat(orderDiscount) || undefined;

                                try {
                                                const orderNumber = `ORD-${Date.now()}`;
                                                const { data: order } = await supabaseService.addOrder({
                                                                order_number: orderNumber,
                                                                customer_id: customer.id,
                                                                customer_name: customer.name,
                                                                customer_email: customer.email || "",
                                                                subtotal: calculateSubtotal(),
                                                                tax: calculateTotal() * 0,
                                                                total: calculateTotal() + calculateTotal() * 0,
                                                                discount: discount ?? null,
                                                                discount_type: discount ? orderDiscountType : null,
                                                                status,
                                                                notes,
                                                                delivery_date: deliveryDate || null,
                                                                amount_paid: 0,
                                                                amount_due: calculateTotal() + calculateTotal() * 0,
                                                                payment_status: "unpaid",
                                                });

                                                if (order) {
                                                                // Save order items as JSON on the order
                                                                const orderItems = items.map(item => ({
                                                                                id: item.id,
                                                                                productId: item.productId,
                                                                                productName: item.productName,
                                                                                productNameHebrew: item.productNameHebrew || null,
                                                                                quantity: item.quantity,
                                                                                unit: item.unit ?? "lb",
                                                                                pricePerLb: item.pricePerLb,
                                                                                totalPrice: item.totalPrice,
                                                                                discount: item.discount || 0,
                                                                                discountType: item.discountType || "fixed",
                                                                                finalPrice: item.finalPrice ?? item.totalPrice,
                                                                }));

                                                                await supabaseService.updateOrder(order.id, {
                                                                                items: orderItems,
                                                                                inventory_deducted: status === "pending",
                                                                } as any);

                                                                // Deduct inventory for pending/confirmed orders
                                                                if (status === "pending") {
                                                                                for (const item of orderItems) {
                                                                                                const product = products.find(p => p.id === item.productId);
                                                                                                if (product) {
                                                                                                                const deductQty = item.unit === "half_lb" ? item.quantity * 0.5 : item.quantity;
                                                                                                                const newInventory = Math.max(0, (product.currentInventory || 0) - deductQty);
                                                                                                                await supabaseService.updateProduct(item.productId, {
                                                                                                                                current_inventory: newInventory,
                                                                                                                } as any);
                                                                                                }
                                                                                }
                                                                }

                                                                toast({
                                                                                title: status === "draft" ? "Draft Saved" : "Order Created",
                                                                                description: `Order ${order.order_number} has been ${status === "draft" ? "saved as draft" : "created successfully"}`,
                                                                });

                                                                // Auto-send confirmation email if not draft and customer has email
                                                                if (status === "pending" && customer.email) {
                                                                                try {
                                                                                                const fullOrder: any = { ...order, orderNumber: order.order_number, items: orderItems, subtotal: order.subtotal, total: order.total, discount: order.discount || 0, discountType: order.discount_type || "fixed", status: order.status, paymentStatus: order.payment_status, amountPaid: 0, amountDue: order.amount_due, notes: order.notes || "", deliveryDate: order.delivery_date || null, createdAt: order.created_at, updatedAt: order.updated_at };
                                                                                                await emailService.sendOrderConfirmation(fullOrder, customer as any);
                                                                                } catch (emailErr) { console.error("Email send failed (non-critical):", emailErr); }
                                                                }

                                                                router.push(`/orders/${order.id}`);
                                                } else {
                                                                throw new Error("Failed to create order");
                                                }
                                } catch (error) {
                                                console.error("Order creation failed", error);
                                                toast({
                                                                title: "Error",
                                                                description: "Failed to create order. Please try again.",
                                                                variant: "destructive",
                                                });
                                                setIsLoading(false);
                                }
                };

                const handleAddProduct = (product: Product) => {
                                const quantity = 1;
                                const unit = product.sellByHalfLb ? "half_lb" : "lb";
                                const effectivePrice = product.sellByHalfLb ? (product.pricePerHalfLb || product.pricePerLb) : product.pricePerLb;
                                const totalPrice = effectivePrice * quantity;

                                const newItem: OrderItem = {
                                                id: crypto.randomUUID(),
                                                orderId: "",
                                                productId: product.id,
                                                productName: product.name,
                                                productNameHebrew: product.nameHebrew,
                                                quantity,
                                                unit,
                                                pricePerLb: effectivePrice,
                                                totalPrice,
                                                discount: 0,
                                                discountType: "fixed",
                                                finalPrice: totalPrice,
                                };

                                setItems((prev) => [...prev, newItem]);
                };

                if (!mounted) {
                                return null;
                }

                

                return (
                                <>
                                                <SEO title="New Order - Satmar Montreal Matzos" />

                                                <div className="container mx-auto px-6 py-8">
                                                                <div className="mb-6 flex items-center gap-4">
                                                                                <Link href="/orders">
                                                                                                <Button variant="ghost" size="icon">
                                                                                                                <ArrowLeft className="w-5 h-5" />
                                                                                                </Button>
                                                                                </Link>
                                                                                <div>
                                                                                                <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
                                                                                                                New Order
                                                                                                </h1>
                                                                                                <p className="text-gray-600" style={{ fontFamily: "'Heebo', sans-serif" }}>Create a new customer order</p>
                                                                                </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                                                <div className="lg:col-span-2 space-y-6">
                                                                                                <Card className="border-amber-200">
                                                                                                                <CardHeader>
                                                                                                                                <CardTitle>Customer Information</CardTitle>
                                                                                                                </CardHeader>
                                                                                                                <CardContent className="space-y-4">
                                                                                                                                <div className="flex flex-col space-y-2">
                                                                                                                                                <Label>Select Customer</Label>
                                                                                                                                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                                                                                                                                                <PopoverTrigger asChild>
                                                                                                                                                                                <Button
                                                                                                                                                                                                variant="outline"
                                                                                                                                                                                                role="combobox"
                                                                                                                                                                                                aria-expanded={openCombobox}
                                                                                                                                                                                                className="w-full justify-between h-12"
                                                                                                                                                                                >
                                                                                                                                                                                                {selectedCustomerId
                                                                                                                                                                                                                ? customers.find((customer) => customer.id === selectedCustomerId)?.name
                                                                                                                                                                                                                : "Search customer by name, phone, or email..."}
                                                                                                                                                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                                                                                                                                </Button>
                                                                                                                                                                </PopoverTrigger>
                                                                                                                                                                <PopoverContent className="w-[600px] p-0" align="start">
                                                                                                                                                                                <Command>
                                                                                                                                                                                                <CommandInput placeholder="Search customers..." />
                                                                                                                                                                                                <div className="p-1 border-b bg-blue-50/50">
                                                                                                                                                                                                                <Button
                                                                                                                                                                                                                                variant="ghost"
                                                                                                                                                                                                                                size="sm"
                                                                                                                                                                                                                                className="w-full justify-start text-blue-600 font-medium h-9 hover:text-blue-700 hover:bg-blue-100"
                                                                                                                                                                                                                                onClick={() => setIsCustomerDialogOpen(true)}
                                                                                                                                                                                                                >
                                                                                                                                                                                                                                <Plus className="mr-2 h-4 w-4" />
                                                                                                                                                                                                                                Add New Customer
                                                                                                                                                                                                                </Button>
                                                                                                                                                                                                </div>
                                                                                                                                                                                                <CommandList>
                                                                                                                                                                                                                <CommandEmpty>No customer found.</CommandEmpty>
                                                                                                                                                                                                                <CommandGroup heading="Existing Customers">
                                                                                                                                                                                                                                {customers.map((customer) => (
                                                                                                                                                                                                                                                <CommandItem
                                                                                                                                                                                                                                                                key={customer.id}
                                                                                                                                                                                                                                                                value={`${customer.name} ${customer.nameHebrew || ''} ${customer.phone || ''} ${customer.mobile || ''} ${customer.email || ''}`}
                                                                                                                                                                                                                                                                onSelect={() => {
                                                                                                                                                                                                                                                                                setSelectedCustomerId(customer.id);
                                                                                                                                                                                                                                                                                setOpenCombobox(false);
                                                                                                                                                                                                                                                                }}
                                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                                <Check
                                                                                                                                                                                                                                                                                className={cn(
                                                                                                                                                                                                                                                                                                "mr-2 h-4 w-4",
                                                                                                                                                                                                                                                                                                selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                                                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                                                                />
                                                                                                                                                                                                                                                                <div className="flex flex-col">
                                                                                                                                                                                                                                                                                <div className="flex items-center gap-2">
                                                                                                                                                                                                                                                                                                <span className="font-medium">{customer.name}</span>
                                                                                                                                                                                                                                                                                                {customer.nameHebrew && <span className="text-gray-500 text-sm" dir="rtl">{customer.nameHebrew}</span>}
                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                <div className="text-sm text-gray-500 flex gap-2">
                                                                                                                                                                                                                                                                                                {customer.phone && <span>{customer.phone}</span>}
                                                                                                                                                                                                                                                                                                {customer.mobile && <span>{customer.mobile}</span>}
                                                                                                                                                                                                                                                                                                {customer.email && <span>• {customer.email}</span>}
                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                </CommandItem>
                                                                                                                                                                                                                                ))}
                                                                                                                                                                                                                </CommandGroup>
                                                                                                                                                                                                </CommandList>
                                                                                                                                                                                </Command>
                                                                                                                                                                </PopoverContent>
                                                                                                                                                </Popover>
                                                                                                                                </div>
                                                                                                                                {customers.length === 0 && (
                                                                                                                                                <div className="text-center py-4">
                                                                                                                                                                <p className="text-gray-600 mb-3">No customers found</p>
                                                                                                                                                                <Link href="/customers/new">
                                                                                                                                                                                <Button variant="outline" size="sm">Add First Customer</Button>
                                                                                                                                                                </Link>
                                                                                                                                                </div>
                                                                                                                                )}
                                                                                                                                {customerOrders.length > 0 && (
                                                                                                                                                <div className="flex items-center gap-2">
                                                                                                                                                                <Button onClick={duplicateLastOrder} variant="outline" size="sm" className="gap-2">
                                                                                                                                                                                <Copy className="w-4 h-4" />
                                                                                                                                                                                Duplicate Last Order
                                                                                                                                                                </Button>
                                                                                                                                                                <span className="text-sm text-gray-600">
                                                                                                                                                                                {customerOrders.length} previous order{customerOrders.length > 1 ? 's' : ''}
                                                                                                                                                                </span>
                                                                                                                                                </div>
                                                                                                                                )}

                                                                                                                                {requireEmail && (
                                                                                                                                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                                                                                                                                                                <Label className="flex items-center gap-2 text-amber-800 font-medium">
                                                                                                                                                                                <Mail className="w-4 h-4" />
                                                                                                                                                                                Email Required for Orders
                                                                                                                                                                </Label>
                                                                                                                                                                <Input
                                                                                                                                                                                type="email"
                                                                                                                                                                                placeholder="Enter customer's email address..."
                                                                                                                                                                                value={tempEmail}
                                                                                                                                                                                onChange={(e) => setTempEmail(e.target.value)}
                                                                                                                                                                                className="bg-white"
                                                                                                                                                                />
                                                                                                                                                                <p className="text-xs text-amber-700">
                                                                                                                                                                                We need an email address to send the order confirmation and invoice. This will be saved to their profile.
                                                                                                                                                                </p>
                                                                                                                                                </div>
                                                                                                                                )}
                                                                                                                </CardContent>
                                                                                                </Card>

                                                                                                <Card className="border-amber-200">
                                                                                                                <CardHeader>
                                                                                                                                <div className="flex items-center justify-between">
                                                                                                                                                <CardTitle>Order Items</CardTitle>
                                                                                                                                                <Button onClick={addItem} size="sm" className="gap-2">
                                                                                                                                                                <Plus className="w-4 h-4" />
                                                                                                                                                                Add Item
                                                                                                                                                </Button>
                                                                                                                                </div>
                                                                                                                </CardHeader>
                                                                                                                <CardContent>
                                                                                                                                {items.length === 0 ? (
                                                                                                                                                <div className="text-center py-8 text-gray-500">
                                                                                                                                                                <p>No items added yet</p>
                                                                                                                                                </div>
                                                                                                                                ) : (
                                                                                                                                                <div className="space-y-4">
                                                                                                                                                                {items.map((item, index) => {
                                                                                                                                                                                const stock = getProductStock(item.productId);
                                                                                                                                                                                const product = products.find(p => p.id === item.productId);
                                                                                                                                                                                const basePrice = item.pricePerLb * item.quantity;
                                                                                                                                                                                const finalPrice = item.finalPrice ?? item.totalPrice;

                                                                                                                                                                                return (
                                                                                                                                                                                                <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4">
                                                                                                                                                                                                                <div className="flex gap-4 items-start">
                                                                                                                                                                                                                                <div className="flex-1 grid grid-cols-3 gap-4">
                                                                                                                                                                                                                                                <div>
                                                                                                                                                                                                                                                                <Label>Product</Label>
                                                                                                                                                                                                                                                                <Select
                                                                                                                                                                                                                                                                                value={item.productId}
                                                                                                                                                                                                                                                                                onValueChange={(value) => updateItem(index, "productId", value)}
                                                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                                                <SelectTrigger>
                                                                                                                                                                                                                                                                                                <SelectValue />
                                                                                                                                                                                                                                                                                </SelectTrigger>
                                                                                                                                                                                                                                                                                <SelectContent>
                                                                                                                                                                                                                                                                                                {products.map((product) => (
                                                                                                                                                                                                                                                                                                                <SelectItem key={product.id} value={product.id}>
                                                                                                                                                                                                                                                                                                                                <div className="flex items-center justify-between w-full gap-4">
                                                                                                                                                                                                                                                                                                                                                <span>{product.name}</span>
                                                                                                                                                                                                                                                                                                                                                <span className="text-sm text-muted-foreground" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
                                                                                                                                                                                                                                                                                                                                                                {product.nameHebrew}
                                                                                                                                                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                </SelectItem>
                                                                                                                                                                                                                                                                                                ))}
                                                                                                                                                                                                                                                                                </SelectContent>
                                                                                                                                                                                                                                                                </Select>
                                                                                                                                                                                                                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                                                                                                                                                                                                                                Stock: {stock.toFixed(1)} lbs
                                                                                                                                                                                                                                                                </p>
                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                <div>
                                                                                                                                                                                                                                                                <Label>{item.unit === "half_lb" ? "Quantity (half-lbs)" : "Quantity (lbs)"}</Label>
                                                                                                                                                                                                                                                                <Input
                                                                                                                                                                                                                                                                                type="number"
                                                                                                                                                                                                                                                                                step="1"
                                                                                                                                                                                                                                                                                min="0"
                                                                                                                                                                                                                                                                                placeholder="0"
                                                                                                                                                                                                                                                                                value={item.quantity || ""}
                                                                                                                                                                                                                                                                                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                                                                                                                                                                                                                                                />
                                                                                                                                                                                                                                                                {item.unit === "half_lb" && item.quantity > 0 && (
                                                                                                                                                                                                                                                                                <p className="text-xs text-amber-700 mt-1">= {(item.quantity * 0.5).toFixed(1)} lbs</p>
                                                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                <div>
                                                                                                                                                                                                                                                                <Label>Price</Label>
                                                                                                                                                                                                                                                                <Input
                                                                                                                                                                                                                                                                                value={`$${basePrice.toFixed(2)}`}
                                                                                                                                                                                                                                                                                disabled
                                                                                                                                                                                                                                                                                className="bg-white"
                                                                                                                                                                                                                                                                />
                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                <Button
                                                                                                                                                                                                                                                variant="ghost"
                                                                                                                                                                                                                                                size="icon"
                                                                                                                                                                                                                                                onClick={() => removeItem(index)}
                                                                                                                                                                                                                                                className="mt-6"
                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                                                                                                                                                                                                </Button>
                                                                                                                                                                                                                </div>

                                                                                                                                                                                                                <div className="border-t border-amber-300 pt-4">
                                                                                                                                                                                                                                <Label className="mb-2 block">Item Discount (Optional)</Label>
                                                                                                                                                                                                                                <div className="grid grid-cols-3 gap-4">
                                                                                                                                                                                                                                                <RadioGroup
                                                                                                                                                                                                                                                                value={item.discountType || "percent"}
                                                                                                                                                                                                                                                                onValueChange={(value) => updateItem(index, "discountType", value)}
                                                                                                                                                                                                                                                                className="flex gap-4"
                                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                                <div className="flex items-center space-x-2">
                                                                                                                                                                                                                                                                                <RadioGroupItem value="percent" id={`percent-${index}`} />
                                                                                                                                                                                                                                                                                <Label htmlFor={`percent-${index}`}>Percent %</Label>
                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                <div className="flex items-center space-x-2">
                                                                                                                                                                                                                                                                                <RadioGroupItem value="fixed" id={`fixed-${index}`} />
                                                                                                                                                                                                                                                                                <Label htmlFor={`fixed-${index}`}>Fixed $</Label>
                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                </RadioGroup>
                                                                                                                                                                                                                                                <Input
                                                                                                                                                                                                                                                                type="number"
                                                                                                                                                                                                                                                                step="0.01"
                                                                                                                                                                                                                                                                min="0"
                                                                                                                                                                                                                                                                placeholder={item.discountType === "percent" ? "0%" : "$0.00"}
                                                                                                                                                                                                                                                                value={item.discount || ""}
                                                                                                                                                                                                                                                                onChange={(e) => updateItem(index, "discount", e.target.value)}
                                                                                                                                                                                                                                                />
                                                                                                                                                                                                                                                <div>
                                                                                                                                                                                                                                                                <Input
                                                                                                                                                                                                                                                                                value={`Final: $${finalPrice.toFixed(2)}`}
                                                                                                                                                                                                                                                                                disabled
                                                                                                                                                                                                                                                                                className="bg-white font-semibold"
                                                                                                                                                                                                                                                                />
                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                </div>
                                                                                                                                                                                                </div>
                                                                                                                                                                                );
                                                                                                                                                                })}
                                                                                                                                                </div>
                                                                                                                                )}
                                                                                                                </CardContent>
                                                                                                </Card>

                                                                                                <Card className="border-amber-200">
                                                                                                                <CardHeader>
                                                                                                                                <CardTitle>Additional Details</CardTitle>
                                                                                                                </CardHeader>
                                                                                                                <CardContent className="space-y-4">
                                                                                                                                <div>
                                                                                                                                                <Label htmlFor="delivery-date">Delivery Date (Optional)</Label>
                                                                                                                                                <Input
                                                                                                                                                                id="delivery-date"
                                                                                                                                                                type="date"
                                                                                                                                                                value={deliveryDate}
                                                                                                                                                                onChange={(e) => setDeliveryDate(e.target.value)}
                                                                                                                                                />
                                                                                                                                </div>
                                                                                                                                <div>
                                                                                                                                                <Label htmlFor="notes">Order Notes (Optional)</Label>
                                                                                                                                                <Textarea
                                                                                                                                                                id="notes"
                                                                                                                                                                value={notes}
                                                                                                                                                                onChange={(e) => setNotes(e.target.value)}
                                                                                                                                                                rows={3}
                                                                                                                                                                placeholder="Special instructions, delivery notes, etc."
                                                                                                                                                />
                                                                                                                                </div>
                                                                                                                </CardContent>
                                                                                                </Card>
                                                                                </div>

                                                                                <div>
                                                                                                <Card className="border-amber-200 sticky top-6">
                                                                                                                <CardHeader>
                                                                                                                                <CardTitle>Order Summary</CardTitle>
                                                                                                                </CardHeader>
                                                                                                                <CardContent className="space-y-4">
                                                                                                                                <div className="space-y-2">
                                                                                                                                                <div className="flex justify-between text-gray-600">
                                                                                                                                                                <span>Subtotal:</span>
                                                                                                                                                                <span>${calculateSubtotal().toFixed(2)}</span>
                                                                                                                                                </div>

                                                                                                                                                <div className="border-t border-amber-200 pt-2">
                                                                                                                                                                <Label className="mb-2 block">Order Discount (Optional)</Label>
                                                                                                                                                                <RadioGroup
                                                                                                                                                                                value={orderDiscountType}
                                                                                                                                                                                onValueChange={(value: "percent" | "fixed") => setOrderDiscountType(value)}
                                                                                                                                                                                className="flex gap-4 mb-2"
                                                                                                                                                                >
                                                                                                                                                                                <div className="flex items-center space-x-2">
                                                                                                                                                                                                <RadioGroupItem value="percent" id="order-percent" />
                                                                                                                                                                                                <Label htmlFor="order-percent">Percent %</Label>
                                                                                                                                                                                </div>
                                                                                                                                                                                <div className="flex items-center space-x-2">
                                                                                                                                                                                                <RadioGroupItem value="fixed" id="order-fixed" />
                                                                                                                                                                                                <Label htmlFor="order-fixed">Fixed $</Label>
                                                                                                                                                                                </div>
                                                                                                                                                                </RadioGroup>
                                                                                                                                                                <Input
                                                                                                                                                                                type="number"
                                                                                                                                                                                step="0.01"
                                                                                                                                                                                min="0"
                                                                                                                                                                                placeholder={orderDiscountType === "percent" ? "0%" : "$0.00"}
                                                                                                                                                                                value={orderDiscount}
                                                                                                                                                                                onChange={(e) => setOrderDiscount(e.target.value)}
                                                                                                                                                                />
                                                                                                                                                </div>

                                                                                                                                                {calculateDiscount() > 0 && (
                                                                                                                                                                <div className="flex justify-between text-green-600">
                                                                                                                                                                                <span>Discount:</span>
                                                                                                                                                                                <span>-${calculateDiscount().toFixed(2)}</span>
                                                                                                                                                                </div>
                                                                                                                                                )}

                                                                                                                                                <div className="border-t border-amber-200 pt-2">
                                                                                                                                                                <div className="flex justify-between text-lg font-bold">
                                                                                                                                                                                <span>Total:</span>
                                                                                                                                                                                <span>${calculateTotal().toFixed(2)}</span>
                                                                                                                                                                </div>
                                                                                                                                                </div>
                                                                                                                                </div>

                                                                                                                                <div className="space-y-2">
                                                                                                                                                <Button
                                                                                                                                                                onClick={() => handleSubmit("pending")}
                                                                                                                                                                className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700"
                                                                                                                                                                disabled={!selectedCustomerId || items.length === 0}
                                                                                                                                                >
                                                                                                                                                                <Send className="w-4 h-4" />
                                                                                                                                                                Create Order
                                                                                                                                                </Button>
                                                                                                                                                <Button
                                                                                                                                                                onClick={() => handleSubmit("draft")}
                                                                                                                                                                variant="outline"
                                                                                                                                                                className="w-full gap-2"
                                                                                                                                                                disabled={!selectedCustomerId || items.length === 0}
                                                                                                                                                >
                                                                                                                                                                <Save className="w-4 h-4" />
                                                                                                                                                                Save as Draft
                                                                                                                                                </Button>
                                                                                                                                </div>
                                                                                                                </CardContent>
                                                                                                </Card>
                                                                                </div>
                                                                </div>
                                                </div>
                                </>
                );
}