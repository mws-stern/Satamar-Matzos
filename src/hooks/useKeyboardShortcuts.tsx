import { useEffect } from "react";
import { useRouter } from "next/router";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = !shortcut.ctrl || (event.ctrlKey || event.metaKey);
        const matchesShift = !shortcut.shift || event.shiftKey;
        const matchesAlt = !shortcut.alt || event.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.callback();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, router]);
};

// Global shortcuts
export const useGlobalShortcuts = () => {
  const router = useRouter();

  const shortcuts: ShortcutConfig[] = [
    {
      key: "n",
      ctrl: true,
      description: "New Order",
      callback: () => router.push("/orders/new"),
    },
    {
      key: "i",
      ctrl: true,
      description: "Inventory",
      callback: () => router.push("/inventory"),
    },
    {
      key: "c",
      ctrl: true,
      description: "Customers",
      callback: () => router.push("/customers"),
    },
    {
      key: "o",
      ctrl: true,
      description: "Orders",
      callback: () => router.push("/orders"),
    },
    {
      key: "r",
      ctrl: true,
      description: "Reports",
      callback: () => router.push("/reports"),
    },
    {
      key: "h",
      ctrl: true,
      description: "Home",
      callback: () => router.push("/"),
    },
  ];

  useKeyboardShortcuts(shortcuts);
};