import { useEffect, useState } from "react";
import { Bell, X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllAlerts, type AutomationAlert } from "@/lib/automation";
import Link from "next/link";

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<AutomationAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadAlerts = () => {
      const newAlerts = getAllAlerts();
      setAlerts(newAlerts);
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  const getAlertIcon = (severity: AutomationAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: AutomationAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "info":
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-600">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-y-auto z-50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Alerts & Notifications</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No alerts</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {alert.productId && (
                            <Link href="/inventory">
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                Add Inventory
                              </Button>
                            </Link>
                          )}
                          {alert.orderId && (
                            <Link href={`/orders/${alert.orderId}`}>
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                View Order
                              </Button>
                            </Link>
                          )}
                          {alert.invoiceId && (
                            <Link href={`/invoices/${alert.invoiceId}`}>
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                View Invoice
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}