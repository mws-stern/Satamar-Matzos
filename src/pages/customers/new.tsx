import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/services/supabaseService";

export async function getServerSideProps() {
  return { props: { existingCustomers: [] } };
}

export default function NewCustomerPage({ existingCustomers: _initial }: { existingCustomers: { id: string; name: string; email: string | null; phone: string | null; mobile: string | null }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [existingCustomers, setExistingCustomers] = useState<{ id: string; name: string; email: string | null; phone: string | null; mobile: string | null }[]>([]);

  useEffect(() => {
    supabase.from("customers").select("id, name, email, phone, mobile").then(({ data }) => {
      if (data) setExistingCustomers(data as any);
    });
  }, []);
  
  const [formData, setFormData] = useState({
    titleHebrew: "",
    titleEnglish: "",
    firstNameHebrew: "",
    lastNameHebrew: "",
    firstName: "",
    lastName: "",
    houseNumber: "",
    apt: "",
    street: "",
    email: "",
    phone: "",
    mobile: "",
    notes: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check for duplicates as user types
    if (field === "email" || field === "phone" || field === "lastName") {
      checkForDuplicates(field, value);
    }
  };

  const checkForDuplicates = (field: string, value: string) => {
    if (!value || value.length < 3) {
      setDuplicateWarning(null);
      return;
    }

    const normalized = value.toLowerCase().trim();
    
    const duplicate = existingCustomers.find(c => {
      if (field === "lastName" && c.name) {
        return c.name.toLowerCase().includes(normalized);
      }
      if (field === "email" && c.email) {
        return c.email.toLowerCase().trim() === normalized;
      }
      if (field === "phone") {
        const cleanValue = value.replace(/\D/g, "");
        const cleanPhone = (c.phone || "").replace(/\D/g, "");
        const cleanMobile = (c.mobile || "").replace(/\D/g, "");
        return cleanPhone === cleanValue || cleanMobile === cleanValue;
      }
      return false;
    });

    if (duplicate) {
      setDuplicateWarning(`A customer with similar details already exists: "${duplicate.name}"`);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email address is strictly required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firstName.trim() && !formData.lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide at least a First or Last Name in English.",
        variant: "destructive",
      });
      return;
    }

    // Final duplicate check before submission
    const emailDuplicate = formData.email && existingCustomers.find(c => 
      c.email && c.email.toLowerCase().trim() === formData.email.toLowerCase().trim()
    );

    if (emailDuplicate) {
      toast({
        title: "Duplicate Email",
        description: `This email is already used by "${emailDuplicate.name}"`,
        variant: "destructive",
      });
      return;
    }

    // Assemble the legacy "name" and "address" fields for backward compatibility
    const assembledName = `${formData.firstName} ${formData.lastName}`.trim();
    const assembledHebrewName = `${formData.firstNameHebrew} ${formData.lastNameHebrew}`.trim();
    const assembledAddress = `${formData.houseNumber} ${formData.street} ${formData.apt ? `Apt ${formData.apt}` : ''}`.trim();

    setLoading(true);
    const response: any = await supabaseService.addCustomer({
      name: assembledName || "Unknown Name",
      name_hebrew: assembledHebrewName,
      title_hebrew: formData.titleHebrew,
      title_english: formData.titleEnglish,
      first_name_hebrew: formData.firstNameHebrew,
      last_name_hebrew: formData.lastNameHebrew,
      first_name: formData.firstName,
      last_name: formData.lastName,
      house_number: formData.houseNumber,
      apt: formData.apt,
      street: formData.street,
      email: formData.email,
      phone: formData.phone,
      mobile: formData.mobile,
      address: assembledAddress,
      city: "Montreal",
      state: "QC",
      zip: "",
      notes: formData.notes,
    });
    const newCustomer = response?.data || response;
    const error = response?.error;
    setLoading(false);

    if (!error && newCustomer) {
      toast({
        title: "Customer Added",
        description: `${newCustomer.name || assembledName} has been added successfully.`,
      });
      router.push("/customers");
    } else {
      toast({
        title: "Error",
        description: error?.message || "Failed to save the customer to the database.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SEO title="Add New Customer - Satmar Montreal Matzos" />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
            <p className="text-gray-600">Enter detailed customer information matching the directory.</p>
          </div>
        </div>

        {duplicateWarning && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Potential Duplicate Found</AlertTitle>
            <AlertDescription>{duplicateWarning}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Customer Directory Details</CardTitle>
              <CardDescription>All fields follow the standard list format. Email is required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Hebrew Names */}
              <div className="bg-gray-50/50 p-4 rounded-lg border space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Hebrew Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="titleHebrew">Title (תואר)</Label>
                    <Input
                      id="titleHebrew"
                      placeholder="e.g. הר''ר"
                      value={formData.titleHebrew}
                      onChange={(e) => handleChange("titleHebrew", e.target.value)}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstNameHebrew">First Name (שם פרטי)</Label>
                    <Input
                      id="firstNameHebrew"
                      value={formData.firstNameHebrew}
                      onChange={(e) => handleChange("firstNameHebrew", e.target.value)}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastNameHebrew">Last Name (משפחה)</Label>
                    <Input
                      id="lastNameHebrew"
                      value={formData.lastNameHebrew}
                      onChange={(e) => handleChange("lastNameHebrew", e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* English Names */}
              <div className="bg-white p-4 rounded-lg border space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">English Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="titleEnglish">Title</Label>
                    <Input
                      id="titleEnglish"
                      placeholder="e.g. Mr. / Mrs. / Rabbi"
                      value={formData.titleEnglish}
                      onChange={(e) => handleChange("titleEnglish", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="bg-white p-4 rounded-lg border space-y-4">
                <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">House Number</Label>
                    <Input
                      id="houseNumber"
                      value={formData.houseNumber}
                      onChange={(e) => handleChange("houseNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apt">Apt / Unit (A-B)</Label>
                    <Input
                      id="apt"
                      placeholder="e.g. A, B, #4"
                      value={formData.apt}
                      onChange={(e) => handleChange("apt", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleChange("street", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100 space-y-4">
                <h3 className="font-semibold text-sm text-blue-800 uppercase tracking-wider">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-900 font-semibold">Email Address (Required) <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="customer@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                      className="border-blue-300 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Home Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Cell Phone</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleChange("mobile", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  placeholder="Enter any special instructions here..."
                />
              </div>

            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-4 pb-12">
            <Link href="/customers">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading || !!duplicateWarning} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving Customer..." : "Save Customer Record"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}