import { useState, useEffect } from "react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Mail, CheckCircle2, XCircle, Clock, Filter, Download } from "lucide-react";
import Link from "next/link";
import type { EmailLog } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "order_confirmation" | "invoice" | "payment_confirmation">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "sent" | "failed">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmails();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [emails, searchTerm, filterType, filterStatus]);

  async function loadEmails() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) {
        console.error("Error loading emails:", error);
        return;
      }

      const emailLogs: EmailLog[] = (data || []).map((e: any) => ({
        id: e.id,
        orderId: e.order_id,
        customerId: e.customer_id,
        customerEmail: e.customer_email,
        customerName: e.customer_name,
        emailType: e.email_type,
        subject: e.subject,
        status: e.status,
        errorMessage: e.error_message,
        sentAt: e.sent_at,
        createdAt: e.created_at,
      }));

      setEmails(emailLogs);
    } finally {
      setLoading(false);
    }
  }

  function filterEmails() {
    let filtered = [...emails];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((e) => e.emailType === filterType);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((e) => e.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.customerName?.toLowerCase().includes(term) ||
          e.customerEmail.toLowerCase().includes(term) ||
          e.subject.toLowerCase().includes(term)
      );
    }

    setFilteredEmails(filtered);
  }

  function getStatusIcon(status: string) {
    if (status === "sent") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-yellow-600" />;
  }

  function getStatusBadge(status: string) {
    if (status === "sent")
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Sent
        </Badge>
      );
    if (status === "failed")
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Failed
        </Badge>
      );
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        Pending
      </Badge>
    );
  }

  function getTypeBadge(type: string) {
    if (type === "order_confirmation")
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Order Confirmation
        </Badge>
      );
    if (type === "payment_confirmation")
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Payment Confirmation
        </Badge>
      );
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Invoice
      </Badge>
    );
  }

  const stats = {
    total: emails.length,
    sent: emails.filter((e) => e.status === "sent").length,
    failed: emails.filter((e) => e.status === "failed").length,
    confirmations: emails.filter((e) => e.emailType === "order_confirmation").length,
    invoices: emails.filter((e) => e.emailType === "invoice").length,
    payments: emails.filter((e) => e.emailType === "payment_confirmation").length,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Dashboard</h1>
              <p className="text-gray-600 mt-1">Track all sent emails and delivery status</p>
            </div>
            <Button onClick={loadEmails} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-stone-50 p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Mail className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Emails</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sent</p>
                    <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Mail className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confirmations</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.confirmations}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Invoices</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.invoices}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payments</p>
                    <p className="text-2xl font-bold text-green-600">{stats.payments}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by customer name, email, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Email Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="order_confirmation">Order Confirmations</SelectItem>
                      <SelectItem value="invoice">Invoices</SelectItem>
                      <SelectItem value="payment_confirmation">Payment Confirmations</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Email List */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Loading emails...
                        </td>
                      </tr>
                    ) : filteredEmails.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No emails found
                        </td>
                      </tr>
                    ) : (
                      filteredEmails.map((email) => (
                        <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(email.status)}
                              {getStatusBadge(email.status)}
                            </div>
                          </td>
                          <td className="px-6 py-4">{getTypeBadge(email.emailType)}</td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{email.customerName || "Unknown"}</p>
                              <p className="text-sm text-gray-500">{email.customerEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">{email.subject}</p>
                            {email.errorMessage && (
                              <p className="text-xs text-red-600 mt-1">Error: {email.errorMessage}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(email.sentAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            {email.orderId && (
                              <Link href={`/orders/${email.orderId}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                  View Order
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}