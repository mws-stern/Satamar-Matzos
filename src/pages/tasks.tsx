import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabaseService } from "@/services/supabaseService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Truck,
  CheckCircle2,
  Circle,
  Trash2,
  ClipboardList,
  X,
  Package,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  due_date: string;
  notes?: string;
  completed: boolean;
  created_at: string;
}

interface DeliveryOrder {
  id: string;
  order_number: string;
  total: number;
  amount_due: number;
  payment_status: string;
  status: string;
  notes?: string;
  customers: { name: string; phone?: string; address?: string } | null;
  items?: any[];
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function parseDateLocal(str: string) {
  const [y, m, day] = str.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function TasksPage() {
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(formatDate(new Date()));
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  const router = useRouter();

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  async function loadData(date: string) {
    setLoading(true);
    const [tasksRes, deliveriesRes] = await Promise.all([
      supabaseService.getTasksByDate(date),
      supabaseService.getOrdersForDate(date),
    ]);
    setTasks((tasksRes.data as Task[]) || []);
    setDeliveries((deliveriesRes.data as DeliveryOrder[]) || []);
    setLoading(false);
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    const { data } = await supabaseService.createTask({
      title: newTaskTitle.trim(),
      due_date: newTaskDate,
      notes: newTaskNotes.trim() || undefined,
    });
    if (data) {
      if (newTaskDate === selectedDate) {
        setTasks((prev) => [...prev, data as Task]);
      }
      setNewTaskTitle("");
      setNewTaskNotes("");
      setNewTaskDate(selectedDate);
      setShowAddTask(false);
    }
  }

  async function toggleTask(task: Task) {
    const { data } = await supabaseService.updateTask(task.id, { completed: !task.completed });
    if (data) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? (data as Task) : t)));
    }
  }

  async function removeTask(id: string) {
    await supabaseService.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // Week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const displayDate = parseDateLocal(selectedDate);
  const displayLabel = displayDate.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paymentStatusColor = (status: string) => {
    if (status === "paid") return "bg-green-100 text-green-800";
    if (status === "partial") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-amber-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks & Deliveries</h1>
            <p className="text-gray-500 text-sm">Daily overview of deliveries and tasks</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setNewTaskDate(selectedDate);
            setShowAddTask(true);
          }}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Week Calendar Strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekStart((prev) => addDays(prev, -7))}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {weekStart.toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => setWeekStart((prev) => addDays(prev, 7))}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const ds = formatDate(day);
            const isSelected = ds === selectedDate;
            const isToday = ds === formatDate(new Date());
            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(ds)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? "bg-amber-600 text-white"
                    : isToday
                    ? "bg-amber-50 text-amber-800 font-semibold"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="text-xs uppercase tracking-wide opacity-70">
                  {day.toLocaleDateString("en-CA", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
              </button>
            );
          })}
        </div>
        {/* Manual date picker */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Jump to:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const d = parseDateLocal(e.target.value);
              setSelectedDate(e.target.value);
              // recenter week
              const day = d.getDay();
              const start = new Date(d);
              start.setDate(d.getDate() - day);
              setWeekStart(start);
            }}
            className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700"
          />
        </div>
      </div>

      {/* Selected Day Label */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4 capitalize">{displayLabel}</h2>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Deliveries Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800 text-base">
                Deliveries ({deliveries.length})
              </h3>
            </div>
            {deliveries.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 py-8 text-center text-gray-400 text-sm">
                No deliveries scheduled for this day
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/orders/${order.id}`}>
                            <span className="font-semibold text-amber-700 hover:underline cursor-pointer">
                              #{order.order_number}
                            </span>
                          </Link>
                          <span className="font-medium text-gray-900">
                            {order.customers?.name || "Unknown"}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentStatusColor(
                              order.payment_status
                            )}`}
                          >
                            {order.payment_status || "unpaid"}
                          </span>
                        </div>
                        {order.customers?.phone && (
                          <p className="text-sm text-gray-500 mt-1">
                            📞 {order.customers.phone}
                          </p>
                        )}
                        {order.customers?.address && (
                          <p className="text-sm text-gray-500">
                            📍 {order.customers.address}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-sm text-amber-700 mt-1 italic">
                            Note: {order.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-gray-900">
                          ${(order.total || 0).toFixed(2)}
                        </div>
                        {(order.amount_due || 0) > 0 && (
                          <div className="text-sm text-red-600 font-medium">
                            Due: ${(order.amount_due || 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800 text-base">
                Tasks ({tasks.length})
              </h3>
            </div>
            {tasks.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 py-8 text-center text-gray-400 text-sm">
                No tasks for this day —{" "}
                <button
                  onClick={() => {
                    setNewTaskDate(selectedDate);
                    setShowAddTask(true);
                  }}
                  className="text-amber-600 hover:underline"
                >
                  add one
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                      task.completed ? "border-gray-200 opacity-60" : "border-gray-200"
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task)}
                      className="mt-0.5 shrink-0 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          task.completed ? "line-through text-gray-400" : "text-gray-800"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{task.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Task</h3>
              <button
                onClick={() => setShowAddTask(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Call supplier, Prepare packages..."
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <Textarea
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={addTask}
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Add Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
