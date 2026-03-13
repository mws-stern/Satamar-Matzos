import { useState } from "react";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: "Ctrl + N", description: "Create New Order" },
    { key: "Ctrl + O", description: "View Orders" },
    { key: "Ctrl + I", description: "Manage Inventory" },
    { key: "Ctrl + C", description: "View Customers" },
    { key: "Ctrl + R", description: "View Reports" },
    { key: "Ctrl + H", description: "Go to Home" },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        title="Keyboard Shortcuts"
      >
        <Keyboard className="w-5 h-5" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <Card className="w-96" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}